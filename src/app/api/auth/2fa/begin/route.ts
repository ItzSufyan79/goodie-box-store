import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { db } from "@/lib/db";
import { generate2FAChallenge } from "@/lib/webauthn";
import { create2FASession } from "@/lib/2fa-session";
import { verifyTurnstile } from "@/lib/turnstile";

export async function POST(request: Request) {
  const { email, password, turnstileToken } = await request.json();

  const user = await db.user.findUnique({ where: { email: email?.toLowerCase() } });
  if (!user?.passwordHash || !user.twoFactorEnabled) {
    return NextResponse.json({ error: "2FA not available" }, { status: 400 });
  }

  // Verify Turnstile
  if (!turnstileToken) {
    return NextResponse.json({ error: "Missing security check" }, { status: 400 });
  }
  const turnstileValid = await verifyTurnstile(turnstileToken);
  if (!turnstileValid) {
    return NextResponse.json({ error: "Security check failed" }, { status: 400 });
  }

  const valid = await compare(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const challenge = await generate2FAChallenge(user.id);
  const sessionToken = await create2FASession(user.id, challenge);
  if (!sessionToken) {
    return NextResponse.json({ error: "Server unavailable" }, { status: 500 });
  }

  return NextResponse.json({
    sessionToken,
  });
}
