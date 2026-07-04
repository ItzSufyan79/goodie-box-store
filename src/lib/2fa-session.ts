import { randomBytes } from "crypto";
import { redis } from "@/lib/redis";
import { db } from "@/lib/db";
import type { PublicKeyCredentialRequestOptionsJSON } from "@simplewebauthn/types";

const SESSION_EXPIRY = 5 * 60; // 5 minutes

export async function create2FASession(
  userId: string,
  challenge?: PublicKeyCredentialRequestOptionsJSON
): Promise<string | null> {
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + SESSION_EXPIRY * 1000);

  if (redis) {
    const key = `2fa:${token}`;
    const value = challenge ? JSON.stringify({ userId, challenge }) : userId;
    await redis.setex(key, SESSION_EXPIRY, value);
    return token;
  }

  // DB fallback
  try {
    await db.twoFactorSession.create({
      data: {
        token,
        userId,
        challenge: challenge ? JSON.stringify(challenge) : null,
        expires,
      },
    });
    return token;
  } catch {
    return null;
  }
}

export async function verify2FASession(
  token: string
): Promise<string | null> {
  if (redis) {
    const key = `2fa:${token}`;
    const raw = await redis.get<string>(key);
    if (!raw) return null;
    await redis.del(key);
    try {
      const parsed = JSON.parse(raw);
      return parsed.userId || null;
    } catch {
      return raw;
    }
  }

  // DB fallback
  try {
    const session = await db.twoFactorSession.findUnique({
      where: { token },
    });
    if (!session || session.expires < new Date()) {
      if (session) {
        await db.twoFactorSession.delete({ where: { id: session.id } });
      }
      return null;
    }
    await db.twoFactorSession.delete({ where: { id: session.id } });
    return session.userId;
  } catch {
    return null;
  }
}

export async function get2FAChallenge(
  token: string
): Promise<PublicKeyCredentialRequestOptionsJSON | null> {
  if (redis) {
    const key = `2fa:${token}`;
    const raw = await redis.get<string>(key);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return parsed.challenge || null;
    } catch {
      return null;
    }
  }

  // DB fallback
  try {
    const session = await db.twoFactorSession.findUnique({
      where: { token },
    });
    if (!session || session.expires < new Date()) {
      if (session) {
        await db.twoFactorSession.delete({ where: { id: session.id } });
      }
      return null;
    }
    if (!session.challenge) return null;
    return JSON.parse(session.challenge);
  } catch {
    return null;
  }
}
