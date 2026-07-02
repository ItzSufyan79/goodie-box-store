import { randomBytes } from "crypto";
import { redis } from "@/lib/redis";
import { db } from "@/lib/db";

const TOKEN_EXPIRY = 60 * 60; // 1 hour

export async function createResetToken(email: string): Promise<string | null> {
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + TOKEN_EXPIRY * 1000);

  if (redis) {
    const key = `reset:${token}`;
    await redis.setex(key, TOKEN_EXPIRY, email.toLowerCase());
    return token;
  }

  // Fall back to DB
  try {
    await db.verificationToken.create({
      data: {
        identifier: `reset:${email.toLowerCase()}`,
        token,
        expires,
      },
    });
    return token;
  } catch {
    return null;
  }
}

export async function verifyResetToken(token: string): Promise<string | null> {
  if (redis) {
    const key = `reset:${token}`;
    const email = await redis.get<string>(key);
    if (!email) return null;
    await redis.del(key);
    return email;
  }

  // Fall back to DB
  try {
    const record = await db.verificationToken.findUnique({ where: { token } });
    if (!record || !record.identifier.startsWith("reset:") || record.expires < new Date()) {
      if (record) await db.verificationToken.delete({ where: { token } });
      return null;
    }
    await db.verificationToken.delete({ where: { token } });
    return record.identifier.replace("reset:", "");
  } catch {
    return null;
  }
}
