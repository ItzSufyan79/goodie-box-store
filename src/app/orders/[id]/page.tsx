import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Package } from "lucide-react";
import { getOrderByIdAction } from "@/actions/orders";
import { auth } from "@/lib/auth";
import { OrderDetailClient } from "./order-detail-client";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const order = await getOrderByIdAction(id);
  if (!order) return { title: "Order Not Found" };
  return {
    title: `Order ${order.orderNumber} | GoodieBox Store`,
    description: `Track your order ${order.orderNumber}.`,
  };
}

export default async function OrderDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/orders");

  const { id } = await params;
  const order = await getOrderByIdAction(id);
  if (!order) notFound();

  const serialized = {
    ...order,
    subtotal: Number(order.subtotal),
    shipping: Number(order.shipping),
    tax: Number(order.tax),
    discount: Number(order.discount),
    total: Number(order.total),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    deliveryDate: order.deliveryDate ?? null,
    deliveryOption: order.deliveryOption ?? null,
    delayReason: order.delayReason ?? null,
    delayedAt: order.delayedAt?.toISOString() ?? null,
    resinRelated: order.resinRelated ?? null,
    giftOption: order.giftOption ?? null,
    giftMessage: order.giftMessage ?? null,
    couponCode: order.couponCode ?? null,
    trackingNumber: order.trackingNumber ?? null,
    notes: order.notes ?? null,
    paymentId: order.paymentId ?? null,
    items: order.items.map((item) => ({
      ...item,
      price: Number(item.price),
      sizeId: item.sizeId ?? null,
      sizeLabel: item.size?.label ?? null,
      customizations: item.customizations as Record<string, string> | null,
    })),
    address: order.address
      ? {
          fullName: order.address.fullName,
          phone: order.address.phone,
          line1: order.address.line1,
          line2: order.address.line2,
          city: order.address.city,
          state: order.address.state,
          postalCode: order.address.postalCode,
          country: order.address.country,
          label: order.address.label,
        }
      : null,
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href="/orders"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Orders
      </Link>
      <OrderDetailClient order={serialized} />
    </div>
  );
}
