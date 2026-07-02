"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

interface CouponInput {
  code: string;
  description?: string;
  discountPercent?: number;
  discountAmount?: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  maxUses: number;
  expiresAt?: string;
}

export async function createCouponAction(data: CouponInput) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") throw new Error("Unauthorized");

  const coupon = await db.coupon.create({
    data: {
      code: data.code.toUpperCase(),
      description: data.description,
      discountPercent: data.discountPercent || null,
      discountAmount: data.discountAmount ? Math.round(data.discountAmount * 100) / 100 : null,
      minOrderAmount: Math.round(data.minOrderAmount * 100) / 100,
      maxDiscountAmount: data.maxDiscountAmount ? Math.round(data.maxDiscountAmount * 100) / 100 : null,
      maxUses: data.maxUses,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      createdBy: session.user.id,
    },
  });

  revalidatePath("/admin/coupons");
  return { success: true, coupon };
}

export async function getCouponsAction() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return [];

  const coupons = await db.coupon.findMany({ orderBy: { createdAt: "desc" } });
  return coupons.map((c) => ({
    ...c,
    discountAmount: c.discountAmount ? Number(c.discountAmount) : null,
    minOrderAmount: Number(c.minOrderAmount),
    maxDiscountAmount: c.maxDiscountAmount ? Number(c.maxDiscountAmount) : null,
    expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
  }));
}

export async function toggleCouponAction(id: string, isActive: boolean) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") throw new Error("Unauthorized");

  await db.coupon.update({ where: { id }, data: { isActive } });
  revalidatePath("/admin/coupons");
  return { success: true };
}

export async function deleteCouponAction(id: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") throw new Error("Unauthorized");

  await db.coupon.delete({ where: { id } });
  revalidatePath("/admin/coupons");
  return { success: true };
}

export async function validateCouponAction(code: string, subtotal: number) {
  const coupon = await db.coupon.findUnique({ where: { code: code.toUpperCase() } });

  if (!coupon) return { valid: false, message: "Invalid coupon code" };
  if (!coupon.isActive) return { valid: false, message: "Coupon is no longer active" };
  if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
    return { valid: false, message: "Coupon has reached its usage limit" };
  }
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    return { valid: false, message: "Coupon has expired" };
  }
  if (Number(coupon.minOrderAmount) > subtotal) {
    return {
      valid: false,
      message: `Minimum order amount of ₹${Number(coupon.minOrderAmount).toLocaleString("en-IN")} required`,
    };
  }

  let discount = 0;
  if (coupon.discountPercent) {
    discount = Math.round(subtotal * (coupon.discountPercent / 100));
    if (coupon.maxDiscountAmount && discount > Number(coupon.maxDiscountAmount)) {
      discount = Number(coupon.maxDiscountAmount);
    }
  } else if (coupon.discountAmount) {
    discount = Number(coupon.discountAmount);
  }

  return {
    valid: true,
    coupon: {
      id: coupon.id,
      code: coupon.code,
      description: coupon.description,
      discountPercent: coupon.discountPercent,
      discountAmount: Number(coupon.discountAmount ?? 0),
      maxDiscountAmount: coupon.maxDiscountAmount ? Number(coupon.maxDiscountAmount) : null,
    },
    discount,
  };
}
