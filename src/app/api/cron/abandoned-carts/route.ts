import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendAbandonedCartEmail, sendLowStockAlert } from "@/lib/email";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const carts = await db.cart.findMany({
      where: {
        items: { some: {} },
        lastActivityAt: { lte: oneHourAgo },
        reminderSentAt: null,
        userId: { not: null },
      },
      include: {
        items: {
          include: {
            product: {
              select: { title: true, price: true, photos: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true } } },
            },
          },
        },
        user: { select: { email: true, name: true } },
      },
    });

    let sent = 0;
    for (const cart of carts) {
      if (!cart.user?.email) continue;

      await sendAbandonedCartEmail({
        email: cart.user.email,
        name: cart.user.name ?? "Customer",
        items: cart.items.map((item) => ({
          title: item.product.title,
          quantity: item.quantity,
          price: Number(item.product.price),
          image: item.product.photos[0]?.url,
        })),
        cartUrl: `${process.env.NEXT_PUBLIC_APP_URL}/cart`,
      });

      await db.cart.update({
        where: { id: cart.id },
        data: { reminderSentAt: new Date() },
      });
      sent++;
    }

    logger.info("Abandoned cart reminders sent", { count: sent });

    let lowStockSent = 0;
    try {
      const lowStockProducts = await db.product.findMany({
        where: { isActive: true, inventory: { lte: 5 } },
        select: { title: true, slug: true, inventory: true, sellerId: true },
      });

      if (lowStockProducts.length > 0) {
        const sellerIds = [...new Set(lowStockProducts.map((p) => p.sellerId))];
        const sellers = await db.user.findMany({
          where: { id: { in: sellerIds } },
          select: { id: true, email: true },
        });

        for (const seller of sellers) {
          const products = lowStockProducts.filter((p) => p.sellerId === seller.id);
          await sendLowStockAlert({
            email: seller.email,
            products: products.map((p) => ({
              title: p.title,
              slug: p.slug,
              inventory: p.inventory,
            })),
          });
          lowStockSent += products.length;
        }
      }
    } catch (e) {
      logger.error("Low stock check in cron failed", { error: e });
    }

    return NextResponse.json({ success: true, sent, lowStockSent });
  } catch (error) {
    logger.error("Abandoned cart cron failed", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
