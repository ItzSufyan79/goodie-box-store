import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { enabled } = await request.json();

  // Require at least one passkey to enable 2FA
  if (enabled) {
    const count = await db.authenticator.count({
      where: { userId: session.user.id },
    });
    if (count === 0) {
      return NextResponse.json(
        { error: "Register a passkey first" },
        { status: 400 }
      );
    }
  }

  await db.user.update({
    where: { id: session.user.id },
    data: { twoFactorEnabled: enabled },
  });

  return NextResponse.json({ success: true });
}
