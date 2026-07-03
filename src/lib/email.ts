import { Resend } from "resend";
import { logger } from "@/lib/logger";
import { stripHtml } from "@/lib/sanitize";

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const fromEmail = process.env.RESEND_FROM_EMAIL ?? "orders@goodieboxstore.online";

export async function sendOrderConfirmation(params: {
  email: string;
  name: string;
  orderNumber: string;
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  items: { title: string; quantity: number; price: number }[];
  address: { fullName: string; phone: string; line1: string; line2?: string | null; city: string; state: string; postalCode: string };
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
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">₹${(item.price * item.quantity).toFixed(2)}</td>
        </tr>`
    )
    .join("");

  const safeName = stripHtml(params.name);
  const safeOrderNumber = stripHtml(params.orderNumber);
  const safeAddr = {
    fullName: stripHtml(params.address.fullName),
    phone: stripHtml(params.address.phone),
    line1: stripHtml(params.address.line1),
    line2: params.address.line2 ? stripHtml(params.address.line2) : "",
    city: stripHtml(params.address.city),
    state: stripHtml(params.address.state),
    postalCode: stripHtml(params.address.postalCode),
  };

  try {
    await resend.emails.send({
      from: `Goodie Box <${fromEmail}>`,
      to: params.email,
      subject: `Order Confirmed — ${safeOrderNumber}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px">
          <div style="text-align:center;margin-bottom:32px">
            <h1 style="color:#e91e8c;margin:0">Thank You for Your Purchase!</h1>
            <p style="color:#64748b;margin-top:8px">Your order has been placed successfully.</p>
          </div>

          <div style="background:#f8f4fc;border-radius:12px;padding:20px;margin-bottom:24px">
            <p style="margin:0;font-size:14px;color:#64748b">Order Number</p>
            <p style="margin:4px 0 0;font-size:18px;font-weight:bold">${safeOrderNumber}</p>
          </div>

          <h2 style="font-size:16px;margin-bottom:12px">Items Ordered</h2>
          <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
            <thead>
              <tr style="background:#f5f5f5">
                <th style="padding:10px;text-align:left;font-size:13px">Item</th>
                <th style="padding:10px;text-align:center;font-size:13px">Qty</th>
                <th style="padding:10px;text-align:right;font-size:13px">Price</th>
                <th style="padding:10px;text-align:right;font-size:13px">Total</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>

          <div style="border-top:2px solid #eee;padding-top:16px;margin-bottom:24px">
            <div style="display:flex;justify-content:space-between;font-size:14px;margin-bottom:6px">
              <span style="color:#64748b">Subtotal</span>
              <span>₹${params.subtotal.toFixed(2)}</span>
            </div>
            ${params.discount > 0 ? `
            <div style="display:flex;justify-content:space-between;font-size:14px;margin-bottom:6px;color:#16a34a">
              <span>Discount</span>
              <span>-₹${params.discount.toFixed(2)}</span>
            </div>` : ""}
            <div style="display:flex;justify-content:space-between;font-size:14px;margin-bottom:6px">
              <span style="color:#64748b">Shipping</span>
              <span>${params.shipping === 0 ? "FREE" : `₹${params.shipping.toFixed(2)}`}</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:14px;margin-bottom:6px">
              <span style="color:#64748b">Tax (5% GST)</span>
              <span>₹${params.tax.toFixed(2)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:18px;font-weight:bold;border-top:2px solid #eee;padding-top:12px;margin-top:8px">
              <span>Total</span>
              <span style="color:#e91e8c">₹${params.total.toFixed(2)}</span>
            </div>
          </div>

          <div style="background:#f5f5f5;border-radius:12px;padding:20px;margin-bottom:24px">
            <h2 style="font-size:14px;margin:0 0 8px;color:#64748b">Shipping Address</h2>
            <p style="margin:2px 0;font-size:14px">${safeAddr.fullName}</p>
            <p style="margin:2px 0;font-size:14px">${safeAddr.line1}${safeAddr.line2 ? `, ${safeAddr.line2}` : ""}</p>
            <p style="margin:2px 0;font-size:14px">${safeAddr.city}, ${safeAddr.state} — ${safeAddr.postalCode}</p>
            <p style="margin:2px 0;font-size:14px">${safeAddr.phone}</p>
          </div>

          <div style="text-align:center;margin-top:32px">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/orders" style="display:inline-block;background:#e91e8c;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:16px">View Your Order</a>
            <p style="color:#64748b;font-size:13px;margin-top:16px">You'll receive another email when your order ships.</p>
          </div>
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

export async function sendAbandonedCartEmail(params: {
  email: string;
  name: string;
  items: { title: string; quantity: number; price: number; image?: string }[];
  cartUrl: string;
}) {
  if (!resend) {
    logger.warn("Resend not configured — skipping abandoned cart email");
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

  try {
    await resend.emails.send({
      from: `GoodieBox <${fromEmail}>`,
      to: params.email,
      subject: `You left something behind, ${safeName}!`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h1 style="color:#e91e8c">Complete Your Order 💝</h1>
          <p>Hi ${safeName},</p>
          <p>You added items to your cart but didn't complete the purchase. They're still waiting for you!</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0">
            <thead>
              <tr style="background:#f8f4fc">
                <th style="padding:8px;text-align:left">Item</th>
                <th style="padding:8px">Qty</th>
                <th style="padding:8px;text-align:right">Price</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <a href="${params.cartUrl}" style="display:inline-block;background:#e91e8c;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:16px;margin-top:8px">Return to Cart</a>
          <p style="margin-top:24px;font-size:12px;color:#64748b">This is a one-time reminder. No spam, we promise!</p>
        </div>
      `,
    });
    logger.info("Abandoned cart email sent", { email: params.email });
  } catch (error) {
    logger.error("Failed to send abandoned cart email", { error, email: params.email });
  }
}

export async function sendNewOrderNotification(params: {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  items: { title: string; quantity: number; price: number }[];
  address: { fullName: string; phone: string; line1: string; line2?: string | null; city: string; state: string; postalCode: string };
}) {
  if (!resend) {
    logger.warn("Resend not configured — skipping new order notification");
    return;
  }

  const itemsHtml = params.items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px;border-bottom:1px solid #eee">${stripHtml(item.title)}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">₹${item.price}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">₹${(item.price * item.quantity).toFixed(2)}</td>
        </tr>`
    )
    .join("");

  const safeAddr = {
    fullName: stripHtml(params.address.fullName),
    phone: stripHtml(params.address.phone),
    line1: stripHtml(params.address.line1),
    line2: params.address.line2 ? stripHtml(params.address.line2) : "",
    city: stripHtml(params.address.city),
    state: stripHtml(params.address.state),
    postalCode: stripHtml(params.address.postalCode),
  };

  try {
    await resend.emails.send({
      from: `GoodieBox <${fromEmail}>`,
      to: "admin@goodieboxstore.online",
      subject: `🛒 New Order — ${params.orderNumber}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px">
          <div style="background:linear-gradient(135deg,#e91e8c,#c2185b);border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
            <h1 style="color:#fff;margin:0;font-size:24px">New Order Received!</h1>
            <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;font-size:16px">${params.orderNumber}</p>
          </div>

          <div style="background:#f8f4fc;border-radius:12px;padding:16px;margin-bottom:24px">
            <p style="margin:0;font-size:14px;color:#64748b">Customer</p>
            <p style="margin:4px 0 0;font-size:16px;font-weight:bold">${stripHtml(params.customerName)}</p>
            <p style="margin:2px 0 0;font-size:14px;color:#64748b">${stripHtml(params.customerEmail)}</p>
          </div>

          <h2 style="font-size:16px;margin-bottom:12px">Items Ordered</h2>
          <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
            <thead>
              <tr style="background:#f5f5f5">
                <th style="padding:10px;text-align:left;font-size:13px">Item</th>
                <th style="padding:10px;text-align:center;font-size:13px">Qty</th>
                <th style="padding:10px;text-align:right;font-size:13px">Price</th>
                <th style="padding:10px;text-align:right;font-size:13px">Total</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>

          <div style="border-top:2px solid #eee;padding-top:16px;margin-bottom:24px">
            <div style="display:flex;justify-content:space-between;font-size:14px;margin-bottom:6px">
              <span style="color:#64748b">Subtotal</span>
              <span>₹${params.subtotal.toFixed(2)}</span>
            </div>
            ${params.discount > 0 ? `
            <div style="display:flex;justify-content:space-between;font-size:14px;margin-bottom:6px;color:#16a34a">
              <span>Discount</span>
              <span>-₹${params.discount.toFixed(2)}</span>
            </div>` : ""}
            <div style="display:flex;justify-content:space-between;font-size:14px;margin-bottom:6px">
              <span style="color:#64748b">Shipping</span>
              <span>${params.shipping === 0 ? "FREE" : `₹${params.shipping.toFixed(2)}`}</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:14px;margin-bottom:6px">
              <span style="color:#64748b">Tax (5% GST)</span>
              <span>₹${params.tax.toFixed(2)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:18px;font-weight:bold;border-top:2px solid #eee;padding-top:12px;margin-top:8px">
              <span>Total</span>
              <span style="color:#e91e8c">₹${params.total.toFixed(2)}</span>
            </div>
          </div>

          <div style="background:#f5f5f5;border-radius:12px;padding:20px;margin-bottom:24px">
            <h2 style="font-size:14px;margin:0 0 8px;color:#64748b">Shipping Address</h2>
            <p style="margin:2px 0;font-size:14px">${safeAddr.fullName}</p>
            <p style="margin:2px 0;font-size:14px">${safeAddr.line1}${safeAddr.line2 ? `, ${safeAddr.line2}` : ""}</p>
            <p style="margin:2px 0;font-size:14px">${safeAddr.city}, ${safeAddr.state} — ${safeAddr.postalCode}</p>
            <p style="margin:2px 0;font-size:14px">${safeAddr.phone}</p>
          </div>

          <div style="text-align:center">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/seller/orders" style="display:inline-block;background:#e91e8c;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:16px">View in Dashboard</a>
          </div>
        </div>
      `,
    });
    logger.info("New order notification sent to admin", { orderNumber: params.orderNumber });
  } catch (error) {
    logger.error("Failed to send new order notification", { error, orderNumber: params.orderNumber });
  }
}
