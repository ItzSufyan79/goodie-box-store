import { randomBytes } from "crypto";
import { redis } from "@/lib/redis";

const TOKEN_EXPIRY = 60 * 60; // 1 hour

export async function createResetToken(email: string): Promise<string | null> {
  if (!redis) return null;
  const token = randomBytes(32).toString("hex");
  const key = `reset:${token}`;
  await redis.setex(key, TOKEN_EXPIRY, email.toLowerCase());
  return token;
}

export async function verifyResetToken(token: string): Promise<string | null> {
  if (!redis) return null;
  const key = `reset:${token}`;
  const email = await redis.get<string>(key);
  if (!email) return null;
  await redis.del(key);
  return email;
}
