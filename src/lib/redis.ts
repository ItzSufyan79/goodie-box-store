import { Redis } from "@upstash/redis";

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

export const redis =
  url && token ? new Redis({ url, token }) : null;

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  try {
    return (await redis.get<T>(key)) ?? null;
  } catch {
    return null;
  }
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds = 300
): Promise<void> {
  if (!redis) return;
  try {
    await redis.set(key, value, { ex: ttlSeconds });
  } catch {
    // fail silently — cache is optional
  }
}

export async function cacheDel(key: string): Promise<void> {
  if (!redis) return;
  try {
    await redis.del(key);
  } catch {
    // fail silently
  }
}

export const CACHE_KEYS = {
  product: (slug: string) => `product:${slug}`,
  products: (page: number) => `products:page:${page}`,
  cart: (userId: string) => `cart:${userId}`,
  featured: "products:featured",
} as const;
