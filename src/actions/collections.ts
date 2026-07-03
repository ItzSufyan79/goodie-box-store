"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { slugify } from "@/lib/utils";

export async function getAllCollectionsAction() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return [];

  return db.collection.findMany({
    include: {
      products: { include: { product: { select: { title: true } } } },
    },
    orderBy: { sortOrder: "asc" },
  });
}

export async function createCollectionAction(data: {
  title: string;
  description?: string;
  image?: string;
  type: "GIFT_GUIDE" | "CURATED" | "OCCASION";
  occasion?: string;
  sortOrder?: number;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") throw new Error("Unauthorized");

  const slug = slugify(data.title);

  const collection = await db.collection.create({
    data: {
      title: data.title,
      slug,
      description: data.description,
      image: data.image,
      type: data.type,
      occasion: data.occasion,
      sortOrder: data.sortOrder ?? 0,
    },
  });

  revalidatePath("/admin/collections");
  revalidatePath("/collections");
  return { success: true, collection };
}

export async function updateCollectionAction(
  id: string,
  data: {
    title?: string;
    description?: string;
    image?: string;
    type?: "GIFT_GUIDE" | "CURATED" | "OCCASION";
    occasion?: string;
    sortOrder?: number;
    isActive?: boolean;
  }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") throw new Error("Unauthorized");

  const updateData: Record<string, unknown> = { ...data };
  if (data.title) {
    updateData.slug = slugify(data.title);
  }

  await db.collection.update({ where: { id }, data: updateData as any });
  revalidatePath("/admin/collections");
  revalidatePath("/collections");
  return { success: true };
}

export async function deleteCollectionAction(id: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") throw new Error("Unauthorized");

  await db.collection.delete({ where: { id } });
  revalidatePath("/admin/collections");
  revalidatePath("/collections");
  return { success: true };
}

export async function toggleCollectionAction(id: string, isActive: boolean) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") throw new Error("Unauthorized");

  await db.collection.update({ where: { id }, data: { isActive } });
  revalidatePath("/admin/collections");
  revalidatePath("/collections");
  return { success: true };
}
