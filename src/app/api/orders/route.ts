import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json([]);
  }

  const orders = await db.order.findMany({
    where: { userId: session.user.id },
    include: {
      items: { include: { product: { include: { photos: { take: 1 } } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  const serialized = orders.map((order) => ({
    ...order,
    subtotal: Number(order.subtotal),
    shipping: Number(order.shipping),
    tax: Number(order.tax),
    total: Number(order.total),
    createdAt: order.createdAt.toISOString(),
    deliveryDate: order.deliveryDate ?? null,
    deliveryOption: order.deliveryOption ?? null,
    resinRelated: order.resinRelated ?? null,
    giftOption: order.giftOption ?? null,
    giftMessage: order.giftMessage ?? null,
    items: order.items.map((item) => ({
      ...item,
      price: Number(item.price),
    })),
  }));

  return NextResponse.json(serialized);
}
