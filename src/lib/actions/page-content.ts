"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export async function getPageContent(pageKey: string): Promise<Record<string, unknown> | null> {
  try {
    const setting = await db.siteSetting.findUnique({
      where: { key: pageKey },
    });
    return (setting?.value as Record<string, unknown>) ?? null;
  } catch {
    return null;
  }
}

export async function updatePageContent(pageKey: string, content: unknown) {
  const session = await auth();
  if (!session?.user || !["SELLER", "ADMIN"].includes(session.user.role)) {
    throw new Error("Unauthorized");
  }

  await db.siteSetting.upsert({
    where: { key: pageKey },
    update: { value: content as any },
    create: { key: pageKey, value: content as any },
  });

  return { success: true };
}
