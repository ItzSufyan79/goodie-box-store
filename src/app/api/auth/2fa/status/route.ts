import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  const { email } = await request.json();
  if (!email) return NextResponse.json({ twoFactorRequired: false });

  const user = await db.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { twoFactorEnabled: true, authenticators: { take: 1 } },
  });

  return NextResponse.json({
    twoFactorRequired: user?.twoFactorEnabled === true && user.authenticators.length > 0,
  });
}
