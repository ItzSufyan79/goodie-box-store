"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function getReturnRequestsAction() {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SELLER")) {
    throw new Error("Unauthorized");
  }

  return db.returnRequest.findMany({
    include: {
      order: {
        select: {
          orderNumber: true,
          total: true,
          paymentStatus: true,
          user: { select: { name: true, email: true } },
          items: {
            take: 1,
            select: { title: true, quantity: true, price: true },
          },
        },
      },
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateReturnRequestAction(id: string, data: { status: "APPROVED" | "REJECTED" | "REFUNDED"; sellerNotes?: string }) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SELLER")) {
    throw new Error("Unauthorized");
  }

  const update: Record<string, unknown> = { status: data.status, sellerNotes: data.sellerNotes };
  if (data.status === "APPROVED" || data.status === "REJECTED") {
    update.reviewedAt = new Date();
  }
  if (data.status === "REFUNDED") {
    update.refundedAt = new Date();
  }

  const request = await db.returnRequest.update({
    where: { id },
    data: update,
    include: { order: { select: { orderNumber: true } } },
  });

  if (data.status === "REFUNDED") {
    await db.order.update({
      where: { id: request.orderId },
      data: { paymentStatus: "REFUNDED", status: "RETURNED" },
    });
  }

  if (data.status === "APPROVED") {
    await db.order.update({
      where: { id: request.orderId },
      data: { status: "RETURNED" },
    });
  }

  return request;
}
