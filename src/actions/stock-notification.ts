"use server";

import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function subscribeStockNotificationAction(
  email: string,
  productId: string
) {
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Valid email is required" };
  }

  try {
    await db.stockNotification.create({ data: { email, productId } });
    return { success: true };
  } catch (error: any) {
    if (error?.code === "P2002") {
      return { error: "You'll be notified when this product is back in stock!" };
    }
    logger.error("Stock notification failed", error);
    return { error: "Something went wrong. Try again." };
  }
}
