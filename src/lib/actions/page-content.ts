"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

const pageContentSchema = z.object({}).passthrough();

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

  const parsed = pageContentSchema.safeParse(content);
  if (!parsed.success) {
    return { error: "Invalid content format" };
  }

  await db.siteSetting.upsert({
    where: { key: pageKey },
    update: { value: parsed.data as Prisma.JsonObject },
    create: { key: pageKey, value: parsed.data as Prisma.JsonObject },
  });

  return { success: true };
}
