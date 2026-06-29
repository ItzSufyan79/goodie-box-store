import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user || !["SELLER", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json(null, { status: 401 });
  }

  const sellerId = session.user.id;

  const [products, orderItems, revenue, pendingOrders] = await Promise.all([
    db.product.count({ where: { sellerId, isActive: true } }),
    db.orderItem.count({ where: { sellerId } }),
    db.orderItem.aggregate({
      where: { sellerId, order: { paymentStatus: "PAID" } },
      _sum: { price: true },
    }),
    db.orderItem.count({
      where: { sellerId, status: "PENDING" },
    }),
  ]);

  return NextResponse.json({
    totalProducts: products,
    totalOrders: orderItems,
    pendingOrders,
    revenue: Number(revenue._sum.price ?? 0),
  });
}
