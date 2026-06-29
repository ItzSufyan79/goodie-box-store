import { redis } from "@/lib/redis";
import { logger } from "@/lib/logger";

interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

const defaults: RateLimitConfig = {
  limit: 10,
  windowMs: 60000,
};

const memoryStore = new Map<string, { timestamps: number[] }>();
const MEMORY_CLEANUP_INTERVAL = 60000;
let lastCleanup = Date.now();

function cleanupMemoryStore() {
  const now = Date.now();
  if (now - lastCleanup < MEMORY_CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of memoryStore) {
    const cutoff = now - 60000;
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
    if (entry.timestamps.length === 0) memoryStore.delete(key);
  }
}

function memoryRateLimit(
  identifier: string,
  config: { limit: number; windowMs: number }
): { success: boolean; remaining: number; resetInMs: number } {
  cleanupMemoryStore();
  const now = Date.now();
  const cutoff = now - config.windowMs;

  let entry = memoryStore.get(identifier);
  if (!entry) {
    entry = { timestamps: [] };
    memoryStore.set(identifier, entry);
  }

  entry.timestamps = entry.timestamps.filter((t) => t > cutoff);

  if (entry.timestamps.length >= config.limit) {
    const oldest = entry.timestamps[0];
    const resetInMs = Math.max(1, oldest + config.windowMs - now);
    return { success: false, remaining: 0, resetInMs };
  }

  entry.timestamps.push(now);
  return { success: true, remaining: config.limit - entry.timestamps.length, resetInMs: 0 };
}

export async function rateLimit(
  identifier: string,
  config: Partial<RateLimitConfig> = {}
): Promise<{ success: boolean; remaining: number; resetInMs: number }> {
  const { limit, windowMs } = { ...defaults, ...config };

  if (!redis) {
    return memoryRateLimit(identifier, { limit, windowMs });
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
  } catch (error) {
    logger.warn("Redis rate limit failed, falling back to memory", { identifier, error });
    return memoryRateLimit(identifier, { limit, windowMs });
  }
}
