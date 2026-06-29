import { Resend } from "resend";
import { logger } from "@/lib/logger";
import { stripHtml } from "@/lib/sanitize";

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const fromEmail = process.env.RESEND_FROM_EMAIL ?? "orders@goodiebox.store";

export async function sendOrderConfirmation(params: {
  email: string;
  name: string;
  orderNumber: string;
  total: number;
  items: { title: string; quantity: number; price: number }[];
}) {
  if (!resend) {
    logger.warn("Resend not configured — skipping order confirmation email");
    return;
  }

  const itemsHtml = params.items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px;border-bottom:1px solid #eee">${stripHtml(item.title)}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">₹${item.price}</td>
        </tr>`
    )
    .join("");

  const safeName = stripHtml(params.name);
  const safeOrderNumber = stripHtml(params.orderNumber);

  try {
    await resend.emails.send({
      from: `Goodie Box <${fromEmail}>`,
      to: params.email,
      subject: `Order Confirmed — ${safeOrderNumber}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h1 style="color:#e91e8c">Order Confirmed!</h1>
          <p>Hi ${safeName},</p>
          <p>Your order <strong>${safeOrderNumber}</strong> has been placed successfully.</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0">
            <thead>
              <tr style="background:#f5f5f5">
                <th style="padding:8px;text-align:left">Item</th>
                <th style="padding:8px;text-align:center">Qty</th>
                <th style="padding:8px;text-align:right">Price</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <p style="font-size:18px;font-weight:bold">Total: ₹${params.total}</p>
          <p>We'll notify you when your order ships.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/orders" style="display:inline-block;background:#e91e8c;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px">View Order</a>
        </div>
      `,
    });
    logger.info("Order confirmation email sent", { orderNumber: params.orderNumber, email: params.email });
  } catch (error) {
    logger.error("Failed to send order confirmation email", { error, orderNumber: params.orderNumber });
  }
}

export async function sendOrderStatusUpdate(params: {
  email: string;
  name: string;
  orderNumber: string;
  status: string;
  trackingNumber?: string | null;
}) {
  if (!resend) {
    logger.warn("Resend not configured — skipping order status email");
    return;
  }

  const statusMessages: Record<string, string> = {
    PROCESSING: "Your order is now being processed.",
    SHIPPED: "Your order has been shipped!",
    DELIVERED: "Your order has been delivered.",
    CANCELLED: "Your order has been cancelled.",
  };

  const safeName2 = stripHtml(params.name);
  const safeOrderNumber2 = stripHtml(params.orderNumber);
  const safeTrackingNumber = params.trackingNumber ? stripHtml(params.trackingNumber) : null;
  const safeStatus = stripHtml(params.status);

  try {
    await resend.emails.send({
      from: `Goodie Box <${fromEmail}>`,
      to: params.email,
      subject: `Order ${safeStatus} — ${safeOrderNumber2}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h1 style="color:#e91e8c">Order Update</h1>
          <p>Hi ${safeName2},</p>
          <p>${statusMessages[params.status] ?? "Your order status has been updated."}</p>
          ${safeTrackingNumber ? `<p>Tracking Number: <strong>${safeTrackingNumber}</strong></p>` : ""}
          <p>Order: <strong>${safeOrderNumber2}</strong></p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/orders" style="display:inline-block;background:#e91e8c;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px">Track Order</a>
        </div>
      `,
    });
    logger.info("Order status email sent", { orderNumber: params.orderNumber, status: params.status });
  } catch (error) {
    logger.error("Failed to send order status email", { error, orderNumber: params.orderNumber });
  }
}
