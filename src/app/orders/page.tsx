import { redirect } from "next/navigation";
import { getOrdersAction } from "@/actions/orders";
import { auth } from "@/lib/auth";
import { OrdersList } from "@/components/orders/orders-list";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/orders");

  const orders = await getOrdersAction();

  const serialized = orders.map((order) => ({
    ...order,
    subtotal: Number(order.subtotal),
    shipping: Number(order.shipping),
    tax: Number(order.tax),
    discount: Number(order.discount),
    total: Number(order.total),
    createdAt: order.createdAt.toISOString(),
    deliveryDate: order.deliveryDate ?? null,
    deliveryOption: order.deliveryOption ?? null,
    resinRelated: order.resinRelated ?? null,
    giftOption: order.giftOption ?? null,
    giftMessage: order.giftMessage ?? null,
    items: order.items.map((item) => ({
      ...item,
      price: Number(item.price),
    })),
  }));

  return <OrdersList initialOrders={serialized} />;
}
