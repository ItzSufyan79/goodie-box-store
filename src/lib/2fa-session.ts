import { randomBytes } from "crypto";
import { redis } from "@/lib/redis";
import type { PublicKeyCredentialRequestOptionsJSON } from "@simplewebauthn/types";

const SESSION_EXPIRY = 5 * 60; // 5 minutes

export async function create2FASession(
  userId: string,
  challenge?: PublicKeyCredentialRequestOptionsJSON
): Promise<string | null> {
  if (!redis) return null;
  const token = randomBytes(32).toString("hex");
  const key = `2fa:${token}`;
  const value = challenge ? JSON.stringify({ userId, challenge }) : userId;
  await redis.setex(key, SESSION_EXPIRY, value);
  return token;
}

export async function verify2FASession(
  token: string
): Promise<string | null> {
  if (!redis) return null;
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

export async function get2FAChallenge(
  token: string
): Promise<PublicKeyCredentialRequestOptionsJSON | null> {
  if (!redis) return null;
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
