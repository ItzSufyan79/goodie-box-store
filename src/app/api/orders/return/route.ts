import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendReturnRequestNotification } from "@/lib/email";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId } = await req.json();
  if (!orderId) {
    return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
  }

  const order = await db.order.findFirst({
    where: { id: orderId, userId: session.user.id },
    include: {
      items: { include: { product: { select: { title: true } } } },
      user: { select: { name: true, email: true } },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.status !== "DELIVERED") {
    return NextResponse.json(
      { error: "Only delivered orders can be returned" },
      { status: 400 }
    );
  }

  const daysSinceDelivery = Math.floor(
    (Date.now() - order.updatedAt.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysSinceDelivery > 7) {
    return NextResponse.json(
      { error: "Return window is 7 days from delivery" },
      { status: 400 }
    );
  }

  await db.order.update({
    where: { id: orderId },
    data: { status: "RETURNED", paymentStatus: "REFUNDED" },
  });

  await db.orderItem.updateMany({
    where: { orderId },
    data: { status: "RETURNED" },
  });

  await sendReturnRequestNotification({
    email: session.user.email,
    name: session.user.name ?? "Customer",
    orderNumber: order.orderNumber,
  });

  return NextResponse.json({ success: true });
}
