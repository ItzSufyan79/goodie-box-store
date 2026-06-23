import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    logger.warn("STRIPE_WEBHOOK_SECRET not set — webhook skipped");
    return NextResponse.json({ ok: true });
  }

  const Stripe = await import("stripe");
  const stripe = new Stripe.default(process.env.STRIPE_SECRET_KEY!);

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    logger.error("Stripe webhook signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    logger.info("Stripe webhook received", { event: event.type });

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object;
      const orderId = paymentIntent.metadata?.orderId;

      if (orderId) {
        await db.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: "PAID",
            status: "PROCESSING",
            paymentId: paymentIntent.id,
          },
        });
        logger.info("Order marked paid via Stripe webhook", { orderId });
      }
    }

    if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object;
      const orderId = paymentIntent.metadata?.orderId;
      if (orderId) {
        await db.order.update({
          where: { id: orderId },
          data: { paymentStatus: "FAILED" },
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error("Stripe webhook processing failed", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
