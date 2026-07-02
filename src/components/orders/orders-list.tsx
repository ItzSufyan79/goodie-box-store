"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Package,
  Clock,
  CheckCircle,
  Truck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollReveal } from "@/components/animations/scroll-reveal";
import { HoverLift } from "@/components/animations/hover-lift";
import { Button } from "@/components/ui/button";
import { OrderTracker } from "@/components/orders/order-tracker";
import { ReceiptButton } from "@/components/orders/receipt-dialog";
import { TrackingStatus } from "@/components/orders/tracking-status";
import { formatPrice } from "@/lib/utils";

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

interface OrderItemData {
  id: string;
  title: string;
  quantity: number;
  price: number;
  product: {
    photos: { url: string }[];
  };
}

interface OrderData {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentId: string | null;
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  couponCode: string | null;
  trackingNumber: string | null;
  deliveryOption: string | null;
  deliveryDate: string | null;
  resinRelated: boolean | null;
  giftOption: boolean | null;
  giftMessage: string | null;
  createdAt: string;
  items: OrderItemData[];
}

type StatusIconKey = keyof typeof statusIcons;

export function OrdersList({ initialOrders }: { initialOrders: OrderData[] }) {
  const [orders, setOrders] = useState(initialOrders);

  const poll = useCallback(async () => {
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        if (JSON.stringify(data) !== JSON.stringify(orders)) {
          setOrders(data);
        }
      }
    } catch {
    }
  }, [orders]);

  useEffect(() => {
    const interval = setInterval(poll, 10000);
    return () => clearInterval(interval);
  }, [poll]);

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
      <ScrollReveal>
      <h1 className="text-3xl font-bold mb-8">My Orders</h1>
      </ScrollReveal>
      <div className="space-y-6">
        {orders.map((order) => {
          const StatusIcon =
            statusIcons[order.status as StatusIconKey] ?? Clock;
          return (
            <ScrollReveal key={order.id} direction="up">
            <HoverLift>
            <div className="border rounded-xl p-6 bg-card">
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
                      order.paymentStatus === "PAID" ? "default" : "secondary"
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
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap justify-between items-center mt-4 pt-4 border-t gap-2">
                <div className="space-y-1 text-sm">
                  <div className="flex gap-4">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span>{formatPrice(order.subtotal)}</span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-muted-foreground">Shipping:</span>
                    <span>{formatPrice(order.shipping)}</span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-muted-foreground">Tax:</span>
                    <span>{formatPrice(order.tax)}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex gap-4 text-emerald-600">
                      <span className="text-muted-foreground">Discount{order.couponCode ? ` (${order.couponCode})` : ""}:</span>
                      <span>-{formatPrice(order.discount)}</span>
                    </div>
                  )}
                  <div className="flex gap-4 font-bold">
                    <span>Total:</span>
                    <span>{formatPrice(order.total)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {order.paymentStatus === "PAID" && (
                    <ReceiptButton
                      orderNumber={order.orderNumber}
                      paymentId={order.paymentId}
                      items={order.items.map((i) => ({
                        title: i.title,
                        quantity: i.quantity,
                        price: i.price,
                      }))}
                      subtotal={order.subtotal}
                      shipping={order.shipping}
                      tax={order.tax}
                      discount={order.discount}
                      couponCode={order.couponCode}
                      total={order.total}
                      deliveryOption={order.deliveryOption}
                      deliveryDate={order.deliveryDate}
                      resinRelated={order.resinRelated}
                      giftOption={order.giftOption}
                      giftMessage={order.giftMessage}
                    />
                  )}
                  {order.trackingNumber && (
                    <TrackingStatus awb={order.trackingNumber} />
                  )}
                </div>
              </div>
            </div>
            </HoverLift>
            </ScrollReveal>
          );
        })}
      </div>
    </div>
  );
}
