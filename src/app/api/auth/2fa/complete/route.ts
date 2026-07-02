import { NextResponse } from "next/server";
import { verify2FAAssertion } from "@/lib/webauthn";
import { create2FASession, verify2FASession, get2FAChallenge } from "@/lib/2fa-session";
import { auditLog } from "@/lib/audit";

export async function POST(request: Request) {
  const { sessionToken, response } = await request.json();

  // Read challenge before session is consumed
  const webauthnChallenge = await get2FAChallenge(sessionToken);
  if (!webauthnChallenge) {
    return NextResponse.json({ error: "Challenge not found" }, { status: 400 });
  }

  const userId = await verify2FASession(sessionToken);
  if (!userId) {
    return NextResponse.json({ error: "Session expired" }, { status: 401 });
  }

  const result = await verify2FAAssertion(userId, webauthnChallenge.challenge, response);
  if ("error" in result) {
    await auditLog({
      action: "2FA_VERIFY_FAILED",
      entity: "User",
      entityId: userId,
    });
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  // Generate auth token for the authorize callback
  const authToken = await create2FASession(userId);

  await auditLog({
    action: "2FA_VERIFY_SUCCESS",
    entity: "User",
    entityId: userId,
  });

  return NextResponse.json({ authToken });
}
