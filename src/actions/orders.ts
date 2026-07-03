"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateOrderNumber } from "@/lib/utils";
import { checkoutSchema } from "@/lib/validations";
import { createPaymentOrder, verifyRazorpayPayment, verifyStripePayment } from "@/lib/payments";
import { clearCartAction, getCartAction } from "@/actions/cart";
import { notifyOrderUpdate } from "@/lib/pusher";
import { sendOrderConfirmation, sendOrderStatusUpdate, sendNewOrderNotification } from "@/lib/email";
import { auditLog } from "@/lib/audit";
import { logger } from "@/lib/logger";
import { calculateShippingRate, generateWaybill, checkPincodeServiceability, trackShipment, createShipment } from "@/lib/delhivery";
import { validateCouponAction } from "@/actions/coupons";
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

  let discount = 0;
  let couponCode: string | null = null;
  if (parsed.data.couponCode) {
    const result = await validateCouponAction(parsed.data.couponCode, subtotal);
    if (result.valid) {
      discount = result.discount!;
      couponCode = result.coupon!.code;
    }
  }

  let shipping: number;
  try {
    const totalWeight = cart.items.reduce(
      (sum, item) => sum + (Number(item.product.weight ?? 0.5) * item.quantity),
      0
    );
    const rate = await calculateShippingRate({
      pincode: parsed.data.address.postalCode,
      weight: Math.max(totalWeight, 0.5),
      amount: subtotal - discount,
    });
    shipping = rate ? rate.totalCharge : 59;
  } catch {
    shipping = 59;
  }
  if (parsed.data.deliveryOption === "STANDARD" && subtotal >= 1499) shipping = 0;
  const afterDiscount = subtotal - discount;
  const tax = Math.round(Math.max(afterDiscount, 0) * 0.05);
  const total = Math.max(afterDiscount, 0) + shipping + tax;

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
      discount,
      couponCode,
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
  if (parsed.data.paymentProvider === "COD") {
    payment = { provider: "cod" };
  } else {
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
      discount: Number(order.discount),
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
    include: { items: true, address: true },
  });

  if (!order) throw new Error("Order not found");
  if (order.paymentStatus === "PAID") return { success: true };

  let verified = false;

  if (paymentData.provider === "cod") {
    verified = true;
  } else if (
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
        ...(paymentData.provider !== "cod" && { paymentStatus: "PAID" }),
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

    if (order.couponCode) {
      await tx.coupon.updateMany({
        where: { code: order.couponCode },
        data: { usedCount: { increment: 1 } },
      });
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
    subtotal: Number(order.subtotal),
    shipping: Number(order.shipping),
    tax: Number(order.tax),
    discount: Number(order.discount),
    total: Number(order.total),
    items: order.items.map((i) => ({
      title: i.title,
      quantity: i.quantity,
      price: Number(i.price),
    })),
    address: {
      fullName: order.address.fullName,
      phone: order.address.phone,
      line1: order.address.line1,
      line2: order.address.line2,
      city: order.address.city,
      state: order.address.state,
      postalCode: order.address.postalCode,
    },
  });

  sendNewOrderNotification({
    orderNumber: order.orderNumber,
    customerName: session.user.name ?? "Customer",
    customerEmail: session.user.email,
    subtotal: Number(order.subtotal),
    shipping: Number(order.shipping),
    tax: Number(order.tax),
    discount: Number(order.discount),
    total: Number(order.total),
    items: order.items.map((i) => ({
      title: i.title,
      quantity: i.quantity,
      price: Number(i.price),
    })),
    address: {
      fullName: order.address.fullName,
      phone: order.address.phone,
      line1: order.address.line1,
      line2: order.address.line2,
      city: order.address.city,
      state: order.address.state,
      postalCode: order.address.postalCode,
    },
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

export async function getOrderTrackingAction(orderId: string) {
  const session = await auth();
  if (!session?.user) return null;

  const order = await db.order.findFirst({
    where: { id: orderId, userId: session.user.id },
    select: { trackingNumber: true },
  });

  if (!order?.trackingNumber) return null;

  return trackShipment(order.trackingNumber);
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

  let tracking = trackingNumber;
  if (status === "SHIPPED" && !tracking) {
    const fullOrder = await db.order.findUnique({
      where: { id: orderId },
      include: { address: true, items: true },
    });

    if (fullOrder?.address) {
      const waybill = await generateWaybill();
      if (waybill) {
        const weight = Math.max(
          fullOrder.items.reduce((sum, i) => sum + i.quantity * 0.3, 0) + 0.2,
          0.5
        );
        await createShipment({
          waybill,
          name: fullOrder.address.fullName,
          address: fullOrder.address.line1,
          address2: fullOrder.address.line2 ?? undefined,
          city: fullOrder.address.city,
          state: fullOrder.address.state,
          pincode: fullOrder.address.postalCode,
          phone: fullOrder.address.phone,
          orderNumber: fullOrder.orderNumber,
          paymentMode: fullOrder.paymentProvider === "COD" ? "COD" : "Prepaid",
          amount: Number(fullOrder.total),
          weight,
        });
        tracking = waybill;
      }
    }
  }

  const [order] = await Promise.all([
    db.order.update({
      where: { id: orderId },
      data: { status, trackingNumber: tracking },
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
      trackingNumber: tracking,
    });
  }

  revalidatePath("/seller/orders");
  revalidatePath("/admin/orders");
  return { success: true };
}

export async function getShippingRateAction(pincode: string, subtotal: number): Promise<{
  serviceable: boolean;
  message: string;
  charge: number | null;
  estimatedDays?: string;
  codAvailable?: boolean;
}> {
  try {
    const serviceability = await checkPincodeServiceability(pincode);
    if (!serviceability.serviceable) {
      return { serviceable: false, message: "Delivery not available to this pincode", charge: null };
    }
    const rate = await calculateShippingRate({
      pincode,
      weight: 0.5,
      amount: subtotal,
    });
    return {
      serviceable: true,
      estimatedDays: serviceability.estimatedDays,
      codAvailable: serviceability.codAvailable,
      charge: rate?.totalCharge ?? null,
      message: rate
        ? `₹${rate.totalCharge} (${serviceability.estimatedDays} days)`
        : `${serviceability.estimatedDays} days`,
    };
  } catch {
    return { serviceable: true, message: "Standard delivery applies", charge: null, estimatedDays: "N/A", codAvailable: false };
  }
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
          address: true,
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
      discount: Number(item.order.discount),
      total: Number(item.order.total),
      createdAt: item.order.createdAt instanceof Date
        ? item.order.createdAt.toISOString()
        : String(item.order.createdAt),
      items: item.order.items.map((i) => ({
        ...i,
        price: Number(i.price),
      })),
      address: item.order.address ? {
        fullName: item.order.address.fullName,
        phone: item.order.address.phone,
        line1: item.order.address.line1,
        line2: item.order.address.line2,
        city: item.order.address.city,
        state: item.order.address.state,
        postalCode: item.order.address.postalCode,
      } : null,
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

export async function deleteOrderAction(orderId: string) {
  const session = await auth();
  if (!session?.user || !["SELLER", "ADMIN"].includes(session.user.role)) {
    return { error: "Unauthorized" };
  }

  const orderItem = await db.orderItem.findFirst({
    where: { id: orderId, sellerId: session.user.id },
    include: { order: { select: { paymentStatus: true, paymentProvider: true } } },
  });

  if (!orderItem) return { error: "Order item not found" };
  if (orderItem.order.paymentStatus !== "PENDING") {
    return { error: "Only unpaid orders can be removed" };
  }
  if (orderItem.order.paymentProvider === "COD") {
    return { error: "Cannot delete COD orders" };
  }

  await db.orderItem.delete({ where: { id: orderId } });

  // Clean up order if no items remain
  const remaining = await db.orderItem.count({ where: { orderId: orderItem.orderId } });
  if (remaining === 0) {
    await db.order.delete({ where: { id: orderItem.orderId } });
  }

  revalidatePath("/seller/orders");
  return { success: true };
}

export async function clearUnpaidOrdersAction() {
  const session = await auth();
  if (!session?.user || !["SELLER", "ADMIN"].includes(session.user.role)) {
    return { error: "Unauthorized" };
  }

  const unpaidItems = await db.orderItem.findMany({
    where: {
      sellerId: session.user.id,
      order: { paymentStatus: "PENDING", paymentProvider: { not: "COD" } },
    },
    select: { id: true, orderId: true },
  });

  if (unpaidItems.length === 0) return { success: true, count: 0 };

  const orderIds = [...new Set(unpaidItems.map((i) => i.orderId))];

  await db.orderItem.deleteMany({
    where: { id: { in: unpaidItems.map((i) => i.id) } },
  });

  // Clean up orders with no items left
  for (const orderId of orderIds) {
    const remaining = await db.orderItem.count({ where: { orderId } });
    if (remaining === 0) {
      await db.order.delete({ where: { id: orderId } });
    }
  }

  revalidatePath("/seller/orders");
  return { success: true, count: unpaidItems.length };
}

export async function getSellerStatsAction() {
  const session = await auth();
  if (!session?.user || !["SELLER", "ADMIN"].includes(session.user.role)) {
    return null;
  }

  const sellerId = session.user.id;

  const [products, orderItems, paidItems] = await Promise.all([
    db.product.count({ where: { sellerId, isActive: true } }),
    db.orderItem.count({ where: { sellerId } }),
    db.orderItem.findMany({
      where: { sellerId, order: { paymentStatus: "PAID" } },
      select: { price: true, quantity: true },
    }),
  ]);

  const revenue = paidItems.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0,
  );

  const pendingOrders = await db.orderItem.count({
    where: { sellerId, status: "PENDING" },
  });

  return {
    totalProducts: products,
    totalOrders: orderItems,
    pendingOrders,
    revenue,
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
