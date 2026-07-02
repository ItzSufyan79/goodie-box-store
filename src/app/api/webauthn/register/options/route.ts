import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generatePasskeyOptions } from "@/lib/webauthn";

export async function POST() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const options = await generatePasskeyOptions(
    session.user.id,
    session.user.email,
    session.user.name ?? undefined
  );

  return NextResponse.json(options);
}
