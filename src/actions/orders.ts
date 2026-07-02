"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateOrderNumber } from "@/lib/utils";
import { checkoutSchema } from "@/lib/validations";
import { createPaymentOrder, verifyRazorpayPayment, verifyStripePayment } from "@/lib/payments";
import { clearCartAction, getCartAction } from "@/actions/cart";
import { notifyOrderUpdate } from "@/lib/pusher";
import { sendOrderConfirmation, sendOrderStatusUpdate } from "@/lib/email";
import { auditLog } from "@/lib/audit";
import { logger } from "@/lib/logger";
import { revalidatePath } from "next/cache";
import type { PaymentProvider } from "@prisma/client";

function getPaymentErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;

  if (
    typeof error === "object" &&
    error !== null &&
    "error" in error &&
    typeof error.error === "object" &&
    error.error !== null &&
    "description" in error.error &&
    typeof error.error.description === "string"
  ) {
    return `Razorpay error: ${error.error.description}`;
  }

  return "Could not create the payment order.";
}

export async function createOrderAction(data: unknown) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const parsed = checkoutSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const cart = await getCartAction();
  if (!cart || cart.items.length === 0) {
    return { error: { root: ["Cart is empty"] } };
  }

  for (const item of cart.items) {
    if (item.product.inventory < item.quantity) {
      return {
        error: {
          root: [`Insufficient stock for ${item.product.title}`],
        },
      };
    }
  }

  const address = await db.address.create({
    data: {
      userId: session.user.id,
      ...parsed.data.address,
    },
  });

  const subtotal = cart.items.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0
  );
  const deliveryRates: Record<string, number> = { URGENT: 99, STANDARD: 49, FLEXIBLE: 149 };
  let shipping = deliveryRates[parsed.data.deliveryOption] ?? 49;
  if (parsed.data.deliveryOption === "STANDARD" && subtotal >= 999) shipping = 0;
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + shipping + tax;

  const order = await db.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      userId: session.user.id,
      addressId: address.id,
      paymentProvider: parsed.data.paymentProvider as PaymentProvider,
      subtotal,
      shipping,
      tax,
      total,
      deliveryOption: parsed.data.deliveryOption,
      deliveryDate: parsed.data.deliveryDate,
      resinRelated: parsed.data.resinRelated,
      giftOption: parsed.data.giftOption,
      giftMessage: parsed.data.giftMessage,
      notes: parsed.data.notes,
      items: {
        create: cart.items.map((item) => ({
          productId: item.productId,
          sellerId: item.product.sellerId,
          title: item.product.title,
          price: item.product.price,
          quantity: item.quantity,
        })),
      },
    },
    include: { items: true, address: true },
  });

  let payment;
  try {
    payment = await createPaymentOrder({
      amount: total,
      orderId: order.id,
      customerEmail: session.user.email,
      customerName: session.user.name ?? undefined,
      provider: parsed.data.paymentProvider.toLowerCase() as "razorpay" | "stripe",
    });
  } catch (error) {
    logger.error("Payment order creation failed", error, { userId: session.user.id });
    return {
      error: {
        root: [getPaymentErrorMessage(error)],
      },
    };
  }

  await auditLog({
    action: "ORDER_CREATED",
    entity: "Order",
    entityId: order.id,
    userId: session.user.id,
    metadata: { total: Number(order.total), paymentProvider: parsed.data.paymentProvider },
  });

  return {
    success: true,
    order: {
      ...order,
      subtotal: Number(order.subtotal),
      shipping: Number(order.shipping),
      tax: Number(order.tax),
      total: Number(order.total),
    },
    payment,
  };
}

export async function confirmPaymentAction(
  orderId: string,
  paymentData: {
    provider: string;
    razorpayOrderId?: string;
    paymentId?: string;
    signature?: string;
    paymentIntentId?: string;
    mockPaymentId?: string;
  }
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const order = await db.order.findFirst({
    where: { id: orderId, userId: session.user.id },
    include: { items: true },
  });

  if (!order) throw new Error("Order not found");
  if (order.paymentStatus === "PAID") return { success: true };

  let verified = false;

  if (
    paymentData.provider === "razorpay" &&
    paymentData.razorpayOrderId &&
    paymentData.paymentId &&
    paymentData.signature
  ) {
    verified = await verifyRazorpayPayment(
      paymentData.razorpayOrderId,
      paymentData.paymentId,
      paymentData.signature
    );
  } else if (paymentData.provider === "stripe" && paymentData.paymentIntentId) {
    verified = await verifyStripePayment(paymentData.paymentIntentId);
  }

  if (!verified) return { error: "Payment verification failed" };

  await db.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: "PAID",
        status: "PROCESSING",
        paymentId:
          paymentData.paymentId ??
          paymentData.paymentIntentId,
      },
    });

    for (const item of order.items) {
      const result = await tx.product.updateMany({
        where: { id: item.productId, inventory: { gte: item.quantity } },
        data: { inventory: { decrement: item.quantity } },
      });
      if (result.count === 0) {
        throw new Error(`Insufficient inventory for ${item.title}`);
      }
    }
  });

  await clearCartAction();
  await notifyOrderUpdate(session.user.id, orderId, "PROCESSING");

  await auditLog({
    action: "PAYMENT_CONFIRMED",
    entity: "Order",
    entityId: orderId,
    userId: session.user.id,
    metadata: {
      provider: paymentData.provider,
      amount: Number(order.total),
      paymentId: paymentData.paymentId ?? paymentData.paymentIntentId,
    },
  });

  sendOrderConfirmation({
    email: session.user.email,
    name: session.user.name ?? "Customer",
    orderNumber: order.orderNumber,
    total: Number(order.total),
    items: order.items.map((i) => ({
      title: i.title,
      quantity: i.quantity,
      price: Number(i.price),
    })),
  });

  revalidatePath("/orders");
  return { success: true, orderId };
}

export async function getOrdersAction() {
  const session = await auth();
  if (!session?.user) return [];

  return db.order.findMany({
    where: { userId: session.user.id },
    include: {
      items: { include: { product: { include: { photos: { take: 1 } } } } },
      address: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getOrderByIdAction(orderId: string) {
  const session = await auth();
  if (!session?.user) return null;

  return db.order.findFirst({
    where: {
      id: orderId,
      ...(session.user.role !== "ADMIN" && { userId: session.user.id }),
    },
    include: {
      items: { include: { product: { include: { photos: { take: 1 } } } } },
      address: true,
      user: { select: { name: true, email: true } },
    },
  });
}

export async function updateOrderStatusAction(
  orderId: string,
  status: "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED",
  trackingNumber?: string
) {
  const session = await auth();
  if (!session?.user || !["SELLER", "ADMIN"].includes(session.user.role)) {
    throw new Error("Unauthorized");
  }

  if (session.user.role !== "ADMIN") {
    const hasItems = await db.orderItem.findFirst({
      where: { orderId, sellerId: session.user.id },
    });
    if (!hasItems) throw new Error("Unauthorized");
  }

  const [order] = await Promise.all([
    db.order.update({
      where: { id: orderId },
      data: { status, trackingNumber },
    }),
    db.orderItem.updateMany({
      where: { orderId, ...(session.user.role !== "ADMIN" && { sellerId: session.user.id }) },
      data: { status },
    }),
  ]);

  const user = await db.user.findUnique({
    where: { id: order.userId },
    select: { name: true, email: true },
  });

  await notifyOrderUpdate(order.userId, orderId, status);

  if (user) {
    sendOrderStatusUpdate({
      email: user.email,
      name: user.name ?? "Customer",
      orderNumber: order.orderNumber,
      status,
      trackingNumber,
    });
  }

  revalidatePath("/seller/orders");
  revalidatePath("/admin/orders");
  return { success: true };
}

export async function getSellerOrdersAction() {
  const session = await auth();
  if (!session?.user || !["SELLER", "ADMIN"].includes(session.user.role)) {
    return [];
  }

  const items = await db.orderItem.findMany({
    where: { sellerId: session.user.id },
    include: {
      order: {
        include: {
          user: { select: { name: true, email: true } },
          items: true,
        },
      },
      product: { include: { photos: { take: 1 } } },
    },
    orderBy: { order: { createdAt: "desc" } },
  });

  return items.map((item) => ({
    ...item,
    price: Number(item.price),
    order: {
      ...item.order,
      subtotal: Number(item.order.subtotal),
      shipping: Number(item.order.shipping),
      tax: Number(item.order.tax),
      total: Number(item.order.total),
      createdAt: item.order.createdAt instanceof Date
        ? item.order.createdAt.toISOString()
        : String(item.order.createdAt),
      items: item.order.items.map((i) => ({
        ...i,
        price: Number(i.price),
      })),
    },
    product: {
      ...item.product,
      price: Number(item.product.price),
      compareAtPrice: item.product.compareAtPrice
        ? Number(item.product.compareAtPrice)
        : null,
    },
  }));
}

export async function getSellerStatsAction() {
  const session = await auth();
  if (!session?.user || !["SELLER", "ADMIN"].includes(session.user.role)) {
    return null;
  }

  const sellerId = session.user.id;

  const [products, orderItems, revenue] = await Promise.all([
    db.product.count({ where: { sellerId, isActive: true } }),
    db.orderItem.count({ where: { sellerId } }),
    db.orderItem.aggregate({
      where: { sellerId, order: { paymentStatus: "PAID" } },
      _sum: { price: true },
    }),
  ]);

  const pendingOrders = await db.orderItem.count({
    where: { sellerId, status: "PENDING" },
  });

  return {
    totalProducts: products,
    totalOrders: orderItems,
    pendingOrders,
    revenue: Number(revenue._sum.price ?? 0),
  };
}

export async function getAdminStatsAction() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return null;

  const [users, products, orders, revenue, customRequests] = await Promise.all([
    db.user.count(),
    db.product.count({ where: { isActive: true } }),
    db.order.count(),
    db.order.aggregate({
      where: { paymentStatus: "PAID" },
      _sum: { total: true },
    }),
    db.customRequest.count({ where: { status: "SUBMITTED" } }),
  ]);

  const recentOrders = await db.order.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, email: true } } },
  });

  return {
    totalUsers: users,
    totalProducts: products,
    totalOrders: orders,
    totalRevenue: Number(revenue._sum.total ?? 0),
    pendingCustomRequests: customRequests,
    recentOrders,
  };
}
