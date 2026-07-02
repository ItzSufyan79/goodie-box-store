import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { verifyPasskeyRegistration } from "@/lib/webauthn";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { challenge, response } = await request.json();

  const result = await verifyPasskeyRegistration(session.user.id, challenge, response);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ verified: true });
}
