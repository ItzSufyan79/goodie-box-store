import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const authenticators = await db.authenticator.findMany({
    where: { userId: session.user.id },
    select: { credentialID: true },
  });

  return NextResponse.json({ authenticators });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { credentialID } = await request.json();
  await db.authenticator.deleteMany({
    where: { credentialID, userId: session.user.id },
  });

  return NextResponse.json({ success: true });
}
