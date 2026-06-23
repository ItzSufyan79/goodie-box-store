import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Package, Clock, CheckCircle, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getOrdersAction } from "@/actions/orders";
import { formatPrice } from "@/lib/utils";
import { auth } from "@/lib/auth";
import { OrderTracker } from "@/components/orders/order-tracker";

const statusIcons = {
  PENDING: Clock,
  PROCESSING: Package,
  SHIPPED: Truck,
  DELIVERED: CheckCircle,
  CANCELLED: Clock,
  RETURNED: Clock,
};

const statusLabels: Record<string, string> = {
  PENDING: "Placed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURNED: "Returned",
};

const paymentLabels: Record<string, string> = {
  PENDING: "Unpaid",
  PAID: "Paid",
  REFUNDED: "Refunded",
  FAILED: "Failed",
};

export default async function OrdersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/orders");

  const orders = await getOrdersAction();

  if (orders.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">No orders yet</h1>
        <Button asChild>
          <Link href="/products">Start Shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Orders</h1>
      <div className="space-y-6">
        {orders.map((order) => {
          const StatusIcon =
            statusIcons[order.status as keyof typeof statusIcons] ?? Clock;
          return (
            <div key={order.id} className="border rounded-xl p-6 bg-white">
              <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                <div>
                  <p className="font-bold">{order.orderNumber}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      order.paymentStatus === "PAID" ? "success" : "secondary"
                    }
                  >
                    {paymentLabels[order.paymentStatus] ?? order.paymentStatus}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <StatusIcon className="h-3 w-3" />
                    {statusLabels[order.status] ?? order.status}
                  </Badge>
                </div>
              </div>

              <OrderTracker status={order.status} />

              <div className="space-y-3 mt-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex gap-3 items-center">
                    <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-muted shrink-0">
                      {item.product.photos[0] && (
                        <Image
                          src={item.product.photos[0].url}
                          alt={item.title}
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {item.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-medium">
                      {formatPrice(Number(item.price) * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center mt-4 pt-4 border-t">
                <p className="font-bold">
                  Total: {formatPrice(Number(order.total))}
                </p>
                {order.trackingNumber && (
                  <p className="text-sm text-muted-foreground">
                    Tracking: {order.trackingNumber}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
