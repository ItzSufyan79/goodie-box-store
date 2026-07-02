import { NextResponse } from "next/server";
import { get2FAChallenge } from "@/lib/2fa-session";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const challenge = await get2FAChallenge(token);
  if (!challenge) {
    return NextResponse.json({ error: "Invalid or expired session" }, { status: 404 });
  }

  return NextResponse.json({ challenge });
}
