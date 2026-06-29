import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user || !["SELLER", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json([]);
  }

  const items = await db.orderItem.findMany({
    where: { sellerId: session.user.id },
    include: {
      order: {
        include: {
          user: { select: { name: true, email: true } },
          items: true,
        },
      },
      product: { include: { photos: { take: 1 } } },
    },
    orderBy: { order: { createdAt: "desc" } },
  });

  const serialized = items.map((item) => ({
    ...item,
    price: Number(item.price),
    order: {
      ...item.order,
      subtotal: Number(item.order.subtotal),
      shipping: Number(item.order.shipping),
      tax: Number(item.order.tax),
      total: Number(item.order.total),
      createdAt: item.order.createdAt.toISOString(),
      items: item.order.items.map((i) => ({
        ...i,
        price: Number(i.price),
      })),
    },
    product: {
      ...item.product,
      price: Number(item.product.price),
      compareAtPrice: item.product.compareAtPrice
        ? Number(item.product.compareAtPrice)
        : null,
    },
  }));

  return NextResponse.json(serialized);
}
