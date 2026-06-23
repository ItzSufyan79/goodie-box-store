import { redis } from "@/lib/redis";

interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

const defaults: RateLimitConfig = {
  limit: 10,
  windowMs: 60000,
};

export async function rateLimit(
  identifier: string,
  config: Partial<RateLimitConfig> = {}
): Promise<{ success: boolean; remaining: number; resetInMs: number }> {
  const { limit, windowMs } = { ...defaults, ...config };

  if (!redis) {
    return { success: true, remaining: limit, resetInMs: 0 };
  }

  const key = `ratelimit:${identifier}`;
  const now = Date.now();
  const windowStart = now - windowMs;

  try {
    const result = await redis
      .multi()
      .zremrangebyscore(key, 0, windowStart)
      .zcard(key)
      .zadd(key, { score: now, member: `${now}-${Math.random()}` })
      .expire(key, Math.ceil(windowMs / 1000))
      .exec();

    const count = (result?.[1] as unknown as [string, number])?.[1] ?? 0;

    if (count > limit) {
      const oldest = await redis.zrange(key, 0, 0, { withScores: true });
      const oldestTimestamp = oldest?.[1] ? Number(oldest[1]) : now;
      const resetInMs = Math.max(1, oldestTimestamp + windowMs - now);

      return { success: false, remaining: 0, resetInMs };
    }

    return { success: true, remaining: limit - count, resetInMs: 0 };
  } catch {
    return { success: true, remaining: limit, resetInMs: 0 };
  }
}
