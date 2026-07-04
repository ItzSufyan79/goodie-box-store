import { Resend } from "resend";
import { logger } from "@/lib/logger";
import { stripHtml } from "@/lib/sanitize";

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const fromEmail = process.env.RESEND_FROM_EMAIL ?? "orders@goodieboxstore.online";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://goodieboxstore.online";

function headerHtml(title: string, subtitle: string) {
  return `
    <div style="background:linear-gradient(135deg,#e91e8c,#c2185b);border-radius:16px 16px 0 0;padding:32px 40px;text-align:center">
      <div style="font-size:48px;margin-bottom:8px">🎁</div>
      <h1 style="color:#fff;margin:0;font-size:26px;font-weight:800;letter-spacing:-0.5px">GoodieBox Store</h1>
      <p style="color:rgba(255,255,255,0.85);margin:4px 0 0;font-size:15px">${subtitle}</p>
    </div>
    <div style="background:#fff;border-radius:0 0 16px 16px;padding:32px 40px">
      <h2 style="color:#1e293b;margin:0 0 4px;font-size:22px">${title}</h2>`;
}

function footerHtml() {
  return `
    </div>
    <div style="text-align:center;padding:24px 40px;border-top:1px solid #f1f5f9;background:#fafafa;border-radius:0 0 16px 16px">
      <p style="margin:0;font-size:12px;color:#94a3b8">GoodieBox Store — Making gifting special ✨</p>
      <p style="margin:4px 0 0;font-size:12px;color:#94a3b8">
        <a href="${APP_URL}" style="color:#e91e8c;text-decoration:none">${APP_URL}</a>
      </p>
    </div>`;
}

function wrapperHtml(content: string) {
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;padding:16px">
      <div style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06)">
        ${content}
      </div>
    </div>`;
}

interface ItemRow {
  title: string;
  quantity: number;
  price: number;
  image?: string;
}

function itemsTableHtml(items: ItemRow[]) {
  return items
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;vertical-align:middle">
          <table style="border-collapse:collapse">
            <tr>
              ${item.image ? `
              <td style="padding-right:12px;vertical-align:middle">
                <img src="${item.image}" alt="" width="48" height="48" style="border-radius:8px;width:48px;height:48px;object-fit:cover;display:block" />
              </td>` : ""}
              <td style="vertical-align:middle">
                <p style="margin:0;font-size:14px;font-weight:600;color:#1e293b">${stripHtml(item.title)}</p>
                <p style="margin:2px 0 0;font-size:12px;color:#94a3b8">Qty: ${item.quantity}</p>
              </td>
            </tr>
          </table>
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;text-align:right;vertical-align:middle;font-size:14px;font-weight:600;color:#1e293b">₹${(item.price * item.quantity).toFixed(2)}</td>
      </tr>`
    )
    .join("");
}

function timelineHtml(currentStatus: string) {
  const steps = [
    { key: "PROCESSING", label: "Processing" },
    { key: "SHIPPED", label: "Shipped" },
    { key: "DELIVERED", label: "Delivered" },
  ];

  const currentIndex = steps.findIndex((s) => s.key === currentStatus);

  return `
    <div style="display:flex;align-items:center;justify-content:center;margin:24px 0;gap:0">
      ${steps
        .map((step, i) => {
          const done = i <= currentIndex;
          const isLast = i === steps.length - 1;
          return `
            <div style="display:flex;align-items:center">
              <div style="width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;${
                done
                  ? "background:#e91e8c;color:#fff"
                  : "background:#f1f5f9;color:#94a3b8"
              }">${done ? "✓" : i + 1}</div>
              ${!isLast ? `
              <div style="width:48px;height:3px;border-radius:2px;margin:0 4px;${
                i < currentIndex ? "background:#e91e8c" : "background:#f1f5f9"
              }"></div>` : ""}
            </div>
          `;
        })
        .join("")}
    </div>
    <div style="display:flex;align-items:center;justify-content:center;gap:0;margin-top:-8px">
      ${steps
        .map((step, i) => {
          const isLast = i === steps.length - 1;
          return `
            <div style="font-size:11px;font-weight:${step.key === currentStatus ? "700" : "500"};color:${step.key === currentStatus ? "#e91e8c" : "#94a3b8"};text-align:center;width:${isLast ? "auto" : "80px"}">
              ${step.label}
            </div>
            ${!isLast ? '<div style="width:48px"></div>' : ""}
          `;
        })
        .join("")}
    </div>`;
}

// ─── EMAIL FUNCTIONS ─────────────────────────────────────────

export async function sendOrderConfirmation(params: {
  email: string;
  name: string;
  orderNumber: string;
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  items: ItemRow[];
  address: {
    fullName: string;
    phone: string;
    line1: string;
    line2?: string | null;
    city: string;
    state: string;
    postalCode: string;
  };
}) {
  if (!resend) {
    logger.warn("Resend not configured — skipping order confirmation email");
    return;
  }

  const itemsHtml = itemsTableHtml(params.items);
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
      from: `GoodieBox <${fromEmail}>`,
      to: params.email,
      subject: `✅ Order Confirmed — ${safeOrderNumber}`,
      html: wrapperHtml(`
        ${headerHtml("You're all set! 🎉", "Your order has been placed successfully")}

        <div style="background:#f8f4fc;border-radius:12px;padding:16px;margin:20px 0">
          <p style="margin:0;font-size:13px;color:#64748b">Order Number</p>
          <p style="margin:4px 0 0;font-size:20px;font-weight:800;color:#1e293b;letter-spacing:1px">${safeOrderNumber}</p>
        </div>

        <div style="background:#fef7f9;border-radius:12px;padding:16px;margin:20px 0">
          <p style="margin:0 0 4px;font-size:13px;color:#64748b;font-weight:600">👋 Hi ${safeName},</p>
          <p style="margin:0;font-size:14px;color:#475569;line-height:1.5">Thanks for shopping at GoodieBox! We're carefully preparing your order and will notify you when it ships.</p>
        </div>

        <h3 style="font-size:15px;margin:24px 0 12px;color:#1e293b">🛍️ Items Ordered</h3>
        <table style="width:100%;border-collapse:collapse">${itemsHtml}</table>

        <div style="border-top:2px solid #f1f5f9;padding-top:16px;margin-top:16px">
          ${params.discount > 0 ? `
          <div style="display:flex;justify-content:space-between;font-size:14px;margin-bottom:6px;color:#16a34a">
            <span>Discount</span>
            <span>-₹${params.discount.toFixed(2)}</span>
          </div>` : ""}
          <div style="display:flex;justify-content:space-between;font-size:14px;margin-bottom:6px">
            <span style="color:#64748b">Subtotal</span>
            <span style="color:#1e293b">₹${params.subtotal.toFixed(2)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:14px;margin-bottom:6px">
            <span style="color:#64748b">Shipping</span>
            <span style="color:#1e293b">${params.shipping === 0 ? "FREE" : `₹${params.shipping.toFixed(2)}`}</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:14px;margin-bottom:6px">
            <span style="color:#64748b">Tax (5% GST)</span>
            <span style="color:#1e293b">₹${params.tax.toFixed(2)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:20px;font-weight:800;border-top:2px solid #e91e8c;padding-top:14px;margin-top:10px">
            <span style="color:#1e293b">Total</span>
            <span style="color:#e91e8c">₹${params.total.toFixed(2)}</span>
          </div>
        </div>

        <div style="background:#f8fafc;border-radius:12px;padding:16px;margin:24px 0">
          <h3 style="font-size:13px;margin:0 0 8px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px">📍 Shipping Address</h3>
          <p style="margin:2px 0;font-size:14px;color:#1e293b;font-weight:500">${safeAddr.fullName}</p>
          <p style="margin:2px 0;font-size:14px;color:#475569">${safeAddr.line1}${safeAddr.line2 ? `, ${safeAddr.line2}` : ""}</p>
          <p style="margin:2px 0;font-size:14px;color:#475569">${safeAddr.city}, ${safeAddr.state} — ${safeAddr.postalCode}</p>
          <p style="margin:2px 0;font-size:14px;color:#475569">📞 ${safeAddr.phone}</p>
        </div>

        <div style="text-align:center;margin:28px 0 8px">
          <a href="${APP_URL}/orders" style="display:inline-block;background:linear-gradient(135deg,#e91e8c,#c2185b);color:#fff;padding:14px 36px;border-radius:10px;text-decoration:none;font-size:15px;font-weight:600">View Your Order</a>
        </div>

        ${footerHtml()}
      `),
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

  const safeName = stripHtml(params.name);
  const safeOrderNumber = stripHtml(params.orderNumber);
  const safeTrackingNumber = params.trackingNumber ? stripHtml(params.trackingNumber) : null;
  const safeStatus = stripHtml(params.status);

  const statusEmojis: Record<string, string> = {
    PROCESSING: "🔨",
    SHIPPED: "🚚",
    DELIVERED: "📦",
    CANCELLED: "❌",
  };

  const statusTitles: Record<string, string> = {
    PROCESSING: "We're working on it!",
    SHIPPED: "On its way! 🎉",
    DELIVERED: "Delivered! Enjoy 🎁",
    CANCELLED: "Order Cancelled",
  };

  const statusMessages: Record<string, string> = {
    PROCESSING: "Your order is being carefully prepared. We'll notify you the moment it ships.",
    SHIPPED: "Your package is on its way! Track it using the number below.",
    DELIVERED: "Your package has been delivered. We hope you love it! 💝",
    CANCELLED: "Your order has been cancelled as requested.",
  };

  const emoji = statusEmojis[params.status] ?? "📋";

  try {
    await resend.emails.send({
      from: `GoodieBox <${fromEmail}>`,
      to: params.email,
      subject: `${emoji} Order ${safeStatus} — ${safeOrderNumber}`,
      html: wrapperHtml(`
        ${headerHtml(statusTitles[params.status] ?? "Order Update", safeOrderNumber)}

        <div style="text-align:center;margin:24px 0">
          <div style="font-size:56px;margin-bottom:12px">${emoji}</div>
          <p style="font-size:16px;color:#475569;line-height:1.6;margin:0">${statusMessages[params.status] ?? "Your order status has been updated."}</p>
        </div>

        ${params.status !== "CANCELLED" ? timelineHtml(params.status) : ""}

        ${safeTrackingNumber ? `
        <div style="background:#f8f4fc;border-radius:12px;padding:16px;text-align:center;margin:24px 0">
          <p style="margin:0;font-size:13px;color:#64748b">Tracking Number</p>
          <p style="margin:6px 0 0;font-size:18px;font-weight:700;color:#1e293b;letter-spacing:1px;font-family:monospace">${safeTrackingNumber}</p>
          <a href="https://www.delhivery.com/tracking?awb=${safeTrackingNumber}" style="display:inline-block;margin-top:10px;font-size:13px;color:#e91e8c;text-decoration:underline">Track on Delhivery →</a>
        </div>` : ""}

        <div style="background:#fef7f9;border-radius:12px;padding:16px;margin:24px 0">
          <p style="margin:0;font-size:13px;color:#64748b">👋 Hi ${safeName},</p>
          <p style="margin:4px 0 0;font-size:14px;color:#475569;line-height:1.5">
            ${params.status === "SHIPPED" ? "Your gift is on its way to bring smiles! 🎉" : ""}
            ${params.status === "DELIVERED" ? "We'd love to hear what you think! Leave a review on our site. ⭐" : ""}
            ${params.status === "PROCESSING" ? "We're handpicking every item with care just for you. 💕" : ""}
          </p>
        </div>

        <div style="text-align:center;margin:28px 0 8px">
          <a href="${APP_URL}/orders" style="display:inline-block;background:linear-gradient(135deg,#e91e8c,#c2185b);color:#fff;padding:14px 36px;border-radius:10px;text-decoration:none;font-size:15px;font-weight:600">Track Order</a>
        </div>

        ${footerHtml()}
      `),
    });
    logger.info("Order status email sent", { orderNumber: params.orderNumber, status: params.status });
  } catch (error) {
    logger.error("Failed to send order status email", { error, orderNumber: params.orderNumber });
  }
}

export async function sendAbandonedCartEmail(params: {
  email: string;
  name: string;
  items: ItemRow[];
  cartUrl: string;
}) {
  if (!resend) {
    logger.warn("Resend not configured — skipping abandoned cart email");
    return;
  }

  const itemsHtml = itemsTableHtml(params.items);
  const safeName = stripHtml(params.name);

  try {
    await resend.emails.send({
      from: `GoodieBox <${fromEmail}>`,
      to: params.email,
      subject: `Hey ${safeName}, your cart is waiting! 🛒`,
      html: wrapperHtml(`
        ${headerHtml("You left something behind 💝", "Your cart is still waiting for you")}

        <div style="background:#fef7f9;border-radius:12px;padding:16px;margin:20px 0">
          <p style="margin:0;font-size:14px;color:#475569;line-height:1.5">Hi ${safeName}, you added some lovely items but didn't complete your purchase. They're still in your cart!</p>
        </div>

        <h3 style="font-size:15px;margin:24px 0 12px;color:#1e293b">🛍️ Items in Your Cart</h3>
        <table style="width:100%;border-collapse:collapse">${itemsHtml}</table>

        <div style="text-align:center;margin:28px 0 8px">
          <a href="${params.cartUrl}" style="display:inline-block;background:linear-gradient(135deg,#e91e8c,#c2185b);color:#fff;padding:14px 36px;border-radius:10px;text-decoration:none;font-size:15px;font-weight:600">Return to Cart</a>
        </div>

        <p style="text-align:center;font-size:12px;color:#94a3b8;margin-top:16px">This is a one-time reminder. No spam, we promise! 💬</p>

        ${footerHtml()}
      `),
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
  items: ItemRow[];
  address: {
    fullName: string;
    phone: string;
    line1: string;
    line2?: string | null;
    city: string;
    state: string;
    postalCode: string;
  };
}) {
  if (!resend) {
    logger.warn("Resend not configured — skipping new order notification");
    return;
  }

  const itemsHtml = itemsTableHtml(params.items);
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
      html: wrapperHtml(`
        ${headerHtml("New Order Received! 🎉", params.orderNumber)}

        <div style="background:#f8f4fc;border-radius:12px;padding:16px;margin:20px 0">
          <p style="margin:0;font-size:13px;color:#64748b">Customer</p>
          <p style="margin:4px 0 0;font-size:16px;font-weight:700;color:#1e293b">${stripHtml(params.customerName)}</p>
          <p style="margin:2px 0 0;font-size:14px;color:#64748b">${stripHtml(params.customerEmail)}</p>
        </div>

        <h3 style="font-size:15px;margin:24px 0 12px;color:#1e293b">🛍️ Items Ordered</h3>
        <table style="width:100%;border-collapse:collapse">${itemsHtml}</table>

        <div style="border-top:2px solid #f1f5f9;padding-top:16px;margin-top:16px">
          ${params.discount > 0 ? `
          <div style="display:flex;justify-content:space-between;font-size:14px;margin-bottom:6px;color:#16a34a">
            <span>Discount</span>
            <span>-₹${params.discount.toFixed(2)}</span>
          </div>` : ""}
          <div style="display:flex;justify-content:space-between;font-size:14px;margin-bottom:6px">
            <span style="color:#64748b">Subtotal</span>
            <span style="color:#1e293b">₹${params.subtotal.toFixed(2)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:14px;margin-bottom:6px">
            <span style="color:#64748b">Shipping</span>
            <span style="color:#1e293b">${params.shipping === 0 ? "FREE" : `₹${params.shipping.toFixed(2)}`}</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:14px;margin-bottom:6px">
            <span style="color:#64748b">Tax (5% GST)</span>
            <span style="color:#1e293b">₹${params.tax.toFixed(2)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:20px;font-weight:800;border-top:2px solid #e91e8c;padding-top:14px;margin-top:10px">
            <span style="color:#1e293b">Total</span>
            <span style="color:#e91e8c">₹${params.total.toFixed(2)}</span>
          </div>
        </div>

        <div style="background:#f8fafc;border-radius:12px;padding:16px;margin:24px 0">
          <h3 style="font-size:13px;margin:0 0 8px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px">📍 Shipping Address</h3>
          <p style="margin:2px 0;font-size:14px;color:#1e293b;font-weight:500">${safeAddr.fullName}</p>
          <p style="margin:2px 0;font-size:14px;color:#475569">${safeAddr.line1}${safeAddr.line2 ? `, ${safeAddr.line2}` : ""}</p>
          <p style="margin:2px 0;font-size:14px;color:#475569">${safeAddr.city}, ${safeAddr.state} — ${safeAddr.postalCode}</p>
          <p style="margin:2px 0;font-size:14px;color:#475569">📞 ${safeAddr.phone}</p>
        </div>

        <div style="text-align:center;margin:28px 0 8px">
          <a href="${APP_URL}/seller/orders" style="display:inline-block;background:linear-gradient(135deg,#e91e8c,#c2185b);color:#fff;padding:14px 36px;border-radius:10px;text-decoration:none;font-size:15px;font-weight:600">View in Dashboard</a>
        </div>

        ${footerHtml()}
      `),
    });
    logger.info("New order notification sent to admin", { orderNumber: params.orderNumber });
  } catch (error) {
    logger.error("Failed to send new order notification", { error, orderNumber: params.orderNumber });
  }
}

export async function sendCustomRequestUpdate(params: {
  email: string;
  name: string;
  title: string;
  status: string;
}) {
  if (!resend) {
    logger.warn("Resend not configured — skipping custom request email");
    return;
  }

  const statusEmojis: Record<string, string> = {
    SUBMITTED: "📩",
    IN_REVIEW: "🔍",
    QUOTED: "💰",
    APPROVED: "✅",
    FULFILLED: "🎉",
    REJECTED: "💔",
    PAYMENT_PAID: "💳",
  };

  const statusTitles: Record<string, string> = {
    SUBMITTED: "Request Received!",
    IN_REVIEW: "Being Reviewed 🔍",
    QUOTED: "Quote Ready! 💰",
    APPROVED: "Request Approved ✅",
    FULFILLED: "Request Fulfilled! 🎉",
    REJECTED: "Request Rejected",
    PAYMENT_PAID: "Payment Confirmed! 💳",
  };

  const statusMessages: Record<string, string> = {
    SUBMITTED: "Your custom request has been received. Our team will review it shortly.",
    IN_REVIEW: "Your custom request is being reviewed by our curation team.",
    QUOTED: "Great news! We've prepared a quote for your custom request. Check the price in your dashboard.",
    APPROVED: "Your custom request has been approved! We'll start working on it soon.",
    FULFILLED: "Your custom request has been fulfilled! We hope you love it! 💝",
    REJECTED: "Unfortunately, your custom request has been rejected. Please reach out if you'd like to discuss alternatives.",
    PAYMENT_PAID: "Payment received for your custom request! We'll start working on it right away.",
  };

  const emoji = statusEmojis[params.status] ?? "📋";

  try {
    await resend.emails.send({
      from: `GoodieBox <${fromEmail}>`,
      to: params.email,
      subject: `${emoji} Custom Request ${params.status} — ${params.title}`,
      html: wrapperHtml(`
        ${headerHtml(statusTitles[params.status] ?? "Update", stripHtml(params.title))}

        <div style="text-align:center;margin:24px 0">
          <div style="font-size:48px;margin-bottom:12px">${emoji}</div>
          <p style="font-size:15px;color:#475569;line-height:1.6;margin:0">${statusMessages[params.status] ?? "Your custom request status has been updated."}</p>
        </div>

        <div style="background:#fef7f9;border-radius:12px;padding:16px;margin:24px 0">
          <p style="margin:0;font-size:13px;color:#64748b">👋 Hi ${stripHtml(params.name)},</p>
          <p style="margin:4px 0 0;font-size:14px;color:#475569;line-height:1.5">
            ${params.status === "QUOTED" ? "We've put together a special quote just for you! Check it out in your dashboard." : ""}
            ${params.status === "FULFILLED" ? "Your custom creation is ready! We hope it brings joy! ✨" : ""}
            ${params.status === "PAYMENT_PAID" ? "Thank you for your payment! We're excited to bring your vision to life. 🎨" : ""}
          </p>
        </div>

        <div style="text-align:center;margin:28px 0 8px">
          <a href="${APP_URL}/my-requests" style="display:inline-block;background:linear-gradient(135deg,#e91e8c,#c2185b);color:#fff;padding:14px 36px;border-radius:10px;text-decoration:none;font-size:15px;font-weight:600">View Request</a>
        </div>

        ${footerHtml()}
      `),
    });
    logger.info("Custom request email sent", { status: params.status, title: params.title });
  } catch (error) {
    logger.error("Failed to send custom request email", { error, title: params.title });
  }
}

export async function sendDueOrderNotification(params: {
  email: string;
  orders: Array<{
    orderNumber: string;
    title: string;
    customer: string;
    dueDate: string;
    deliveryOption: string;
  }>;
}) {
  if (!resend) {
    logger.warn("Resend not configured — skipping due order email");
    return;
  }

  const rows = params.orders
    .map(
      (o) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#1e293b">${o.orderNumber}</td>
        <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#1e293b">${stripHtml(o.title)}</td>
        <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#1e293b">${stripHtml(o.customer)}</td>
        <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#e91e8c;font-weight:600">${o.dueDate}</td>
      </tr>`
    )
    .join("");

  try {
    await resend.emails.send({
      from: `GoodieBox <${fromEmail}>`,
      to: params.email,
      subject: `⏰ ${params.orders.length} order${params.orders.length > 1 ? "s" : ""} due soon — GoodieBox`,
      html: wrapperHtml(`
        ${headerHtml("Orders Due Soon ⏰", "Action required on these orders")}

        <div style="text-align:center;margin:24px 0">
          <div style="font-size:48px;margin-bottom:12px">⏰</div>
          <p style="font-size:15px;color:#475569;line-height:1.6;margin:0">
            The following order${params.orders.length > 1 ? "s are" : " is"} due within the next 2 days. Please process them on time.
          </p>
        </div>

        <table style="width:100%;border-collapse:collapse;margin:24px 0">
          <thead>
            <tr style="background:#fef7f9">
              <th style="padding:10px 12px;text-align:left;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px">Order</th>
              <th style="padding:10px 12px;text-align:left;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px">Product</th>
              <th style="padding:10px 12px;text-align:left;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px">Customer</th>
              <th style="padding:10px 12px;text-align:left;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px">Due Date</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>

        <div style="text-align:center;margin:28px 0 8px">
          <a href="${APP_URL}/seller/orders" style="display:inline-block;background:linear-gradient(135deg,#e91e8c,#c2185b);color:#fff;padding:14px 36px;border-radius:10px;text-decoration:none;font-size:15px;font-weight:600">View Orders</a>
        </div>

        ${footerHtml()}
      `),
    });
    logger.info("Due order notification sent", { count: params.orders.length });
  } catch (error) {
    logger.error("Failed to send due order notification", { error, count: params.orders.length });
  }
}

export async function sendReturnRequestNotification(params: {
  email: string;
  name: string;
  orderNumber: string;
}) {
  if (!resend) {
    logger.warn("Resend not configured — skipping return request email");
    return;
  }

  try {
    await resend.emails.send({
      from: `GoodieBox <${fromEmail}>`,
      to: params.email,
      subject: `🔄 Return Request Received — ${params.orderNumber}`,
      html: wrapperHtml(`
        ${headerHtml("Return Request Received 🔄", params.orderNumber)}

        <div style="text-align:center;margin:24px 0">
          <div style="font-size:48px;margin-bottom:12px">🔄</div>
          <p style="font-size:15px;color:#475569;line-height:1.6;margin:0">
            Your return request for <strong>${params.orderNumber}</strong> has been received.
          </p>
        </div>

        <div style="background:#fef7f9;border-radius:12px;padding:16px;margin:24px 0">
          <p style="margin:0;font-size:13px;color:#64748b">👋 Hi ${stripHtml(params.name)},</p>
          <p style="margin:4px 0 0;font-size:14px;color:#475569;line-height:1.5">
            We've received your return request. Our team will review it and contact you within 2 business days. Please keep the item unused and in original packaging. If you have any questions, reply to this email or contact us on WhatsApp.
          </p>
        </div>

        <div style="text-align:center;margin:28px 0 8px">
          <a href="${APP_URL}/orders" style="display:inline-block;background:linear-gradient(135deg,#e91e8c,#c2185b);color:#fff;padding:14px 36px;border-radius:10px;text-decoration:none;font-size:15px;font-weight:600">View Orders</a>
        </div>

        ${footerHtml()}
      `),
    });
    logger.info("Return request email sent", { orderNumber: params.orderNumber });
  } catch (error) {
    logger.error("Failed to send return request email", { error, orderNumber: params.orderNumber });
  }
}

export async function sendLowStockAlert(params: {
  email: string;
  products: Array<{
    title: string;
    slug: string;
    inventory: number;
  }>;
}) {
  if (!resend) {
    logger.warn("Resend not configured — skipping low stock alert");
    return;
  }

  const rows = params.products
    .map(
      (p) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#1e293b">${stripHtml(p.title)}</td>
        <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#e91e8c;font-weight:600;text-align:center">${p.inventory}</td>
      </tr>`
    )
    .join("");

  try {
    await resend.emails.send({
      from: `GoodieBox <${fromEmail}>`,
      to: params.email,
      subject: `⚠️ ${params.products.length} product${params.products.length > 1 ? "s are" : " is"} running low on stock`,
      html: wrapperHtml(`
        ${headerHtml("Low Stock Alert ⚠️", "These products need restocking")}

        <div style="text-align:center;margin:24px 0">
          <div style="font-size:48px;margin-bottom:12px">⚠️</div>
          <p style="font-size:15px;color:#475569;line-height:1.6;margin:0">
            The following products have low inventory. Please restock soon to avoid running out.
          </p>
        </div>

        <table style="width:100%;border-collapse:collapse;margin:24px 0">
          <thead>
            <tr style="background:#fef7f9">
              <th style="padding:10px 12px;text-align:left;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px">Product</th>
              <th style="padding:10px 12px;text-align:center;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px">Left</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>

        <div style="text-align:center;margin:28px 0 8px">
          <a href="${APP_URL}/seller/products" style="display:inline-block;background:linear-gradient(135deg,#e91e8c,#c2185b);color:#fff;padding:14px 36px;border-radius:10px;text-decoration:none;font-size:15px;font-weight:600">View Products</a>
        </div>

        ${footerHtml()}
      `),
    });
    logger.info("Low stock alert sent", { count: params.products.length });
  } catch (error) {
    logger.error("Failed to send low stock alert", { error, count: params.products.length });
  }
}
