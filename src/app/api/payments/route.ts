import { NextResponse } from "next/server";
import { createPaymentOrder, verifyRazorpayPayment } from "@/lib/payments";
import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = await rateLimit(`payment:${ip}`, { limit: 5, windowMs: 60000 });
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetInMs / 1000)) } }
    );
  }

  try {
    const body = await request.json();
    const { action } = body;

    if (action === "create") {
      const { amount, orderId, customerEmail, customerName, provider } = body;

      if (!amount || !orderId || !customerEmail || !provider) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }

      const payment = await createPaymentOrder({
        amount,
        orderId,
        customerEmail,
        customerName,
        provider,
      });
      return NextResponse.json(payment);
    }

    if (action === "verify-razorpay") {
      const { razorpayOrderId, paymentId, signature } = body;

      if (!razorpayOrderId || !paymentId || !signature) {
        return NextResponse.json({ error: "Missing verification fields" }, { status: 400 });
      }

      const verified = await verifyRazorpayPayment(
        razorpayOrderId,
        paymentId,
        signature
      );
      return NextResponse.json({ verified });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    logger.error("Payment API error", error, { userId: session.user.id });
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
