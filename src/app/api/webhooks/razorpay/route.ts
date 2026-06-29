import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    logger.warn("RAZORPAY_WEBHOOK_SECRET not set — webhook skipped");
    return NextResponse.json({ ok: true });
  }

  const body = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const crypto = await import("crypto");
  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  try {
    const sigValid = crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(signature)
    );
    if (!sigValid) throw new Error("Mismatch");
  } catch {
    logger.error("Razorpay webhook signature mismatch");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    const event = JSON.parse(body);
    logger.info("Razorpay webhook received", { event: event.event });

    if (event.event === "payment.captured") {
      const paymentId = event.payload.payment.entity.id;
      const orderId = event.payload.payment.entity.notes?.orderId;

      if (orderId) {
        await db.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: "PAID",
            status: "PROCESSING",
            paymentId,
          },
        });
        logger.info("Order marked paid via webhook", { orderId, paymentId });
      }
    }

    if (event.event === "payment.failed") {
      const orderId = event.payload.payment.entity.notes?.orderId;
      if (orderId) {
        await db.order.update({
          where: { id: orderId },
          data: { paymentStatus: "FAILED" },
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error("Razorpay webhook processing failed", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
