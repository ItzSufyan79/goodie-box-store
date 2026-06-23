"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function toggleWishlistAction(productId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const existing = await db.wishlistItem.findUnique({
    where: {
      userId_productId: { userId: session.user.id, productId },
    },
  });

  if (existing) {
    await db.wishlistItem.delete({ where: { id: existing.id } });
    revalidatePath("/wishlist");
    return { added: false };
  }

  await db.wishlistItem.create({
    data: { userId: session.user.id, productId },
  });

  revalidatePath("/wishlist");
  return { added: true };
}

export async function getWishlistAction() {
  const session = await auth();
  if (!session?.user) return [];

  return db.wishlistItem.findMany({
    where: { userId: session.user.id },
    include: {
      product: {
        include: {
          photos: { orderBy: { sortOrder: "asc" } },
          category: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateWishlistNotificationsAction(
  itemId: string,
  notifyOnSale: boolean,
  notifyLowStock: boolean
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await db.wishlistItem.update({
    where: { id: itemId },
    data: { notifyOnSale, notifyLowStock },
  });

  revalidatePath("/wishlist");
  return { success: true };
}
