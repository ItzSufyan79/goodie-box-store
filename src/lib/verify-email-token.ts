import { randomBytes } from "crypto";
import { redis } from "@/lib/redis";
import { db } from "@/lib/db";

const TOKEN_EXPIRY = 24 * 60 * 60; // 24 hours

export async function createVerifyEmailToken(userId: string): Promise<string | null> {
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + TOKEN_EXPIRY * 1000);

  if (redis) {
    const key = `verify-email:${token}`;
    await redis.setex(key, TOKEN_EXPIRY, userId);
    return token;
  }

  // Fall back to DB when Redis is unavailable
  try {
    await db.verificationToken.create({
      data: {
        identifier: userId,
        token,
        expires,
      },
    });
    return token;
  } catch {
    return null;
  }
}

export async function verifyEmailToken(token: string): Promise<string | null> {
  if (redis) {
    const key = `verify-email:${token}`;
    const userId = await redis.get<string>(key);
    if (!userId) return null;
    await redis.del(key);
    return userId;
  }

  // Fall back to DB
  try {
    const record = await db.verificationToken.findUnique({ where: { token } });
    if (!record || record.expires < new Date()) {
      if (record) await db.verificationToken.delete({ where: { token } });
      return null;
    }
    await db.verificationToken.delete({ where: { token } });
    return record.identifier;
  } catch {
    return null;
  }
}
