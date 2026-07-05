import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId, reason } = await req.json();
  if (!orderId || !reason?.trim()) {
    return NextResponse.json({ error: "Order ID and reason are required" }, { status: 400 });
  }

  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { id: true, userId: true, status: true, paymentStatus: true, updatedAt: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.userId !== session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  if (order.status !== "DELIVERED") {
    return NextResponse.json({ error: "Only delivered orders can be returned" }, { status: 400 });
  }

  if (order.paymentStatus === "REFUNDED") {
    return NextResponse.json({ error: "Order already refunded" }, { status: 400 });
  }

  const deliveredAt = order.updatedAt;
  const daysSinceDelivery = Math.floor((Date.now() - new Date(deliveredAt).getTime()) / (1000 * 60 * 60 * 24));
  if (daysSinceDelivery > 7) {
    return NextResponse.json({ error: "Return window is 7 days from delivery" }, { status: 400 });
  }

  const existing = await db.returnRequest.findUnique({ where: { orderId } });
  if (existing) {
    return NextResponse.json({ error: "Return already requested for this order" }, { status: 409 });
  }

  await db.returnRequest.create({
    data: { orderId, userId: session.user.id, reason: reason.trim() },
  });

  return NextResponse.json({ success: true });
}
