import Razorpay from "razorpay";
import Stripe from "stripe";

export type PaymentMode = "razorpay" | "stripe";

export function getPaymentMode(): PaymentMode {
  const mode = process.env.PAYMENT_MODE?.toLowerCase();
  if (mode === "razorpay" || mode === "stripe") return mode;
  return "razorpay";
}

export const razorpay =
  process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
    ? new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      })
    : null;

export const stripe =
  process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY)
    : null;

export interface CreatePaymentParams {
  amount: number;
  currency?: string;
  orderId: string;
  customerEmail: string;
  customerName?: string;
  provider?: PaymentMode;
}

export async function createPaymentOrder(params: CreatePaymentParams) {
  const { amount, currency = "INR", orderId, customerEmail, customerName, provider } =
    params;
  const mode = provider ?? getPaymentMode();

  if (mode === "razorpay") {
    if (!razorpay || !process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
      throw new Error("Razorpay is not configured. Set RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, and NEXT_PUBLIC_RAZORPAY_KEY_ID.");
    }

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency,
      receipt: orderId,
      notes: { orderId, customerEmail, customerName: customerName ?? "" },
    });
    return {
      provider: "razorpay" as const,
      razorpayOrderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      name: "Goodie Box Store",
      description: `Order ${orderId}`,
      prefill: {
        email: customerEmail,
        name: customerName ?? "",
      },
    };
  }

  if (mode === "stripe") {
    if (!stripe) {
      throw new Error("Stripe is not configured. Set STRIPE_SECRET_KEY.");
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: currency.toLowerCase(),
      metadata: { orderId, customerEmail, customerName: customerName ?? "" },
      receipt_email: customerEmail,
    });
    return {
      provider: "stripe" as const,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    };
  }

  throw new Error("No payment provider configured. Set PAYMENT_MODE to 'razorpay' or 'stripe' and configure the corresponding keys.");
}

export async function verifyRazorpayPayment(
  razorpayOrderId: string,
  paymentId: string,
  signature: string
) {
  if (!process.env.RAZORPAY_KEY_SECRET) return false;

  const crypto = await import("crypto");
  const body = `${razorpayOrderId}|${paymentId}`;
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  return expected === signature;
}

export async function verifyStripePayment(paymentIntentId: string) {
  if (!stripe) return false;
  const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
  return intent.status === "succeeded";
}
