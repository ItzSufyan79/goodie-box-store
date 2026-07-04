import { db } from "@/lib/db";
import { sendLowStockAlert } from "@/lib/email";
import { NextResponse } from "next/server";

const CRON_SECRET = process.env.CRON_SECRET ?? "cron-secret";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const lowStockProducts = await db.product.findMany({
      where: { isActive: true, inventory: { lte: 5 } },
      select: { title: true, slug: true, inventory: true, sellerId: true },
    });

    if (lowStockProducts.length === 0) {
      return NextResponse.json({ success: true, sent: 0 });
    }

    const sellerIds = [...new Set(lowStockProducts.map((p) => p.sellerId))];
    const sellers = await db.user.findMany({
      where: { id: { in: sellerIds } },
      select: { id: true, email: true },
    });

    let sent = 0;
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
      sent += products.length;
    }

    return NextResponse.json({ success: true, sent });
  } catch (error) {
    console.error("Low stock cron error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
