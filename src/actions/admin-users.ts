"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getUsersAction() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return [];

  return db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      role: true,
      twoFactorEnabled: true,
      failedLoginAttempts: true,
      lockoutUntil: true,
      createdAt: true,
      _count: { select: { orders: true, products: true } },
    },
  });
}

export async function updateUserRoleAction(
  userId: string,
  role: "CUSTOMER" | "SELLER" | "ADMIN"
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  if (userId === session.user.id) {
    throw new Error("Cannot change your own role");
  }

  await db.user.update({
    where: { id: userId },
    data: { role },
  });

  revalidatePath("/admin/users");
  return { success: true };
}

export async function toggleUserLockAction(userId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { lockoutUntil: true },
  });

  if (!user) throw new Error("User not found");

  const now = new Date();
  const isLocked = user.lockoutUntil && user.lockoutUntil > now;

  await db.user.update({
    where: { id: userId },
    data: {
      lockoutUntil: isLocked ? null : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      failedLoginAttempts: isLocked ? 0 : 5,
    },
  });

  revalidatePath("/admin/users");
  return { success: true, locked: !isLocked };
}

export async function deleteUserAction(userId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  if (userId === session.user.id) {
    throw new Error("Cannot delete your own account");
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      _count: { select: { orders: true, products: true } },
    },
  });

  if (!user) throw new Error("User not found");

  if (user._count.orders > 0 || user._count.products > 0) {
    throw new Error(
      `Cannot delete user with ${user._count.orders} order(s) and ${user._count.products} product(s). Remove them first.`
    );
  }

  await db.user.delete({ where: { id: userId } });

  revalidatePath("/admin/users");
  return { success: true };
}
