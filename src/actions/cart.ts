"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { cacheDel, CACHE_KEYS } from "@/lib/redis";
import { revalidatePath } from "next/cache";

async function getOrCreateCart(userId: string) {
  let cart = await db.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            include: { photos: { where: { isPrimary: true }, take: 1 } },
          },
        },
      },
    },
  });

  if (!cart) {
    cart = await db.cart.create({
      data: { userId },
      include: {
        items: {
          include: {
            product: {
              include: { photos: { where: { isPrimary: true }, take: 1 } },
            },
          },
        },
      },
    });
  }

  return cart;
}

export async function getCartAction() {
  const session = await auth();
  if (!session?.user) return null;
  return getOrCreateCart(session.user.id);
}

export async function addToCartAction(productId: string, quantity = 1, customizations?: Record<string, string>) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  if (quantity > 99) throw new Error("Quantity exceeds maximum of 99");
  if (quantity < 1) throw new Error("Quantity must be at least 1");

  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product || !product.isActive) throw new Error("Product not found");
  if (product.inventory < quantity) throw new Error("Insufficient inventory");

  const cart = await getOrCreateCart(session.user.id);

  const existing = await db.cartItem.findFirst({
    where: {
      cartId: cart.id,
      productId,
      customizations: customizations && Object.keys(customizations).length > 0
        ? { equals: customizations }
        : undefined,
    },
  });

  if (existing) {
    await db.cartItem.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + quantity },
    });
  } else {
    await db.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        quantity,
        customizations: customizations && Object.keys(customizations).length > 0 ? customizations : undefined,
      },
    });
  }

  await db.cart.update({
    where: { id: cart.id },
    data: { lastActivityAt: new Date() },
  });

  await cacheDel(CACHE_KEYS.cart(session.user.id));
  revalidatePath("/cart");
  return { success: true };
}

async function verifyCartItemOwnership(itemId: string, userId: string) {
  const item = await db.cartItem.findUnique({
    where: { id: itemId },
    include: { cart: { select: { userId: true, id: true } } },
  });
  if (!item || item.cart.userId !== userId) {
    throw new Error("Cart item not found");
  }
  return { ...item, cartId: item.cart.id };
}

export async function updateCartItemAction(itemId: string, quantity: number) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const item = await verifyCartItemOwnership(itemId, session.user.id);

  if (quantity <= 0) {
    await db.cartItem.delete({ where: { id: itemId } });
  } else {
    const product = await db.product.findUnique({
      where: { id: item.productId },
      select: { inventory: true },
    });

    if (product && quantity > product.inventory) {
      return {
        error: `Only ${product.inventory} in stock.`,
        maxAvailable: product.inventory,
      };
    }

    await db.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });
  }

  await db.cart.update({
    where: { id: item.cartId },
    data: { lastActivityAt: new Date() },
  });

  await cacheDel(CACHE_KEYS.cart(session.user.id));
  revalidatePath("/cart");
  return { success: true };
}

export async function removeFromCartAction(itemId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const item = await verifyCartItemOwnership(itemId, session.user.id);

  await db.cartItem.delete({ where: { id: itemId } });

  await db.cart.update({
    where: { id: item.cartId },
    data: { lastActivityAt: new Date() },
  });

  await cacheDel(CACHE_KEYS.cart(session.user.id));
  revalidatePath("/cart");
  return { success: true };
}

export async function clearCartAction() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const cart = await db.cart.findUnique({ where: { userId: session.user.id } });
  if (cart) {
    await db.cartItem.deleteMany({ where: { cartId: cart.id } });
  }

  await cacheDel(CACHE_KEYS.cart(session.user.id));
  revalidatePath("/cart");
  return { success: true };
}

export async function getCartItemCountAction() {
  const session = await auth();
  if (!session?.user) return 0;

  const cart = await db.cart.findUnique({
    where: { userId: session.user.id },
    include: { items: true },
  });

  return cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
}
