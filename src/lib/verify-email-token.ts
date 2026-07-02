import { randomBytes } from "crypto";
import { redis } from "@/lib/redis";

const TOKEN_EXPIRY = 24 * 60 * 60; // 24 hours

export async function createVerifyEmailToken(userId: string): Promise<string | null> {
  if (!redis) return null;
  const token = randomBytes(32).toString("hex");
  const key = `verify-email:${token}`;
  await redis.setex(key, TOKEN_EXPIRY, userId);
  return token;
}

export async function verifyEmailToken(token: string): Promise<string | null> {
  if (!redis) return null;
  const key = `verify-email:${token}`;
  const userId = await redis.get<string>(key);
  if (!userId) return null;
  await redis.del(key);
  return userId;
}
