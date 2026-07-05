"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Package,
  Clock,
  CheckCircle,
  Truck,
  MapPin,
  CreditCard,
  Gift,
  FileText,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ReceiptButton } from "@/components/orders/receipt-dialog";
import { OrderTracker } from "@/components/orders/order-tracker";
import { TrackingStatus } from "@/components/orders/tracking-status";
import { formatPrice } from "@/lib/utils";

interface OrderItemData {
  id: string;
  title: string;
  quantity: number;
  price: number;
  status: string;
  sizeId: string | null;
  sizeLabel: string | null;
  customizations: Record<string, string> | null;
  product: {
    id: string;
    slug: string;
    photos: { url: string }[];
  };
}

interface AddressData {
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string | null;
  label: string | null;
}

interface OrderData {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentProvider: string;
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
  delayReason: string | null;
  delayedAt: string | null;
  revisedDeliveryDate: string | null;
  resinRelated: boolean | null;
  giftOption: boolean | null;
  giftMessage: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItemData[];
  address: AddressData | null;
}

const statusLabels: Record<string, string> = {
  PENDING: "Placed",
  PROCESSING: "Processing",
  DELAYED: "Delayed",
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

const deliveryLabels: Record<string, string> = {
  URGENT: "Urgent (1-2 days)",
  STANDARD: "Standard (3-4 days)",
  FLEXIBLE: "Flexible",
};

const deliveryColors: Record<string, string> = {
  URGENT: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  STANDARD: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  FLEXIBLE: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
};

export function OrderDetailClient({ order }: { order: OrderData }) {
  const [showTimeline, setShowTimeline] = useState(false);
  const [returning, setReturning] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [returnReason, setReturnReason] = useState("");

  const canReturn =
    order.status === "DELIVERED" &&
    order.paymentStatus !== "REFUNDED";

  const handleReturnRequest = async () => {
    if (!returnReason.trim()) {
      alert("Please enter a reason for the return.");
      return;
    }
    setReturning(true);
    try {
      const res = await fetch("/api/orders/return", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, reason: returnReason.trim() }),
      });
      if (res.ok) {
        alert("Return request submitted! We'll contact you within 2 business days.");
        setReturnReason("");
      } else {
        const data = await res.json();
        alert(data.error ?? "Failed to submit return request.");
      }
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setReturning(false);
    }
  };

  const statusSteps = [
    { key: "PENDING", label: "Placed", icon: Clock, date: order.createdAt },
    { key: "PROCESSING", label: "Processing", icon: Package, date: null },
    { key: "SHIPPED", label: "Shipped", icon: Truck, date: null },
    { key: "DELIVERED", label: "Delivered", icon: CheckCircle, date: null },
  ];

  return (
    <div className="max-w-4xl">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">{order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">
            Placed on{" "}
            {new Date(order.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={order.paymentStatus === "PAID" ? "default" : "secondary"}
          >
            {paymentLabels[order.paymentStatus] ?? order.paymentStatus}
          </Badge>
          <Badge variant="outline">
            {statusLabels[order.status] ?? order.status}
          </Badge>
        </div>
      </div>

      <OrderTracker status={order.status} />

      {order.status === "DELAYED" && order.delayReason && (
        <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-amber-800">Order Delayed</p>
              <p className="text-amber-700 text-sm mt-1">{order.delayReason}</p>
              {order.revisedDeliveryDate && (
                <p className="text-xs text-amber-700 mt-1.5 font-medium">
                  New expected delivery:{" "}
                  {new Date(order.revisedDeliveryDate + "T00:00:00").toLocaleDateString("en-IN", {
                    day: "numeric", month: "long", year: "numeric",
                  })}
                </p>
              )}
              {order.delayedAt && (
                <p className="text-xs text-amber-600 mt-1">
                  Updated {new Date(order.delayedAt).toLocaleDateString("en-IN", {
                    day: "numeric", month: "long", year: "numeric",
                  })}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="border rounded-xl p-6 bg-card">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              Items ({order.items.length})
            </h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className="relative h-20 w-20 rounded-lg overflow-hidden bg-muted shrink-0">
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
                    <Link
                      href={`/products/${item.product.slug}`}
                      className="font-medium hover:text-primary transition-colors line-clamp-1"
                    >
                      {item.title}
                    </Link>
                    {item.sizeLabel && (
                      <p className="text-xs text-muted-foreground mt-0.5">{item.sizeLabel}</p>
                    )}
                    {item.customizations && Object.keys(item.customizations).length > 0 && (
                      <div className="mt-1 text-xs text-muted-foreground space-y-0.5">
                        {Object.entries(item.customizations).map(([, value]) => (
                          <span key={value} className="block truncate">{value}</span>
                        ))}
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground mt-1">
                      Qty: {item.quantity} × {formatPrice(item.price)}
                    </p>
                    <p className="text-sm font-medium mt-1">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {order.trackingNumber && (
            <div className="border rounded-xl p-6 bg-card">
              <h2 className="font-semibold mb-3 flex items-center gap-2">
                <Truck className="h-4 w-4 text-primary" />
                Tracking
              </h2>
              <p className="text-xs text-muted-foreground mb-2">
                AWB: {order.trackingNumber}
              </p>
              <TrackingStatus awb={order.trackingNumber} />
            </div>
          )}

          <div className="border rounded-xl p-6 bg-card">
            <button
              onClick={() => setShowTimeline(!showTimeline)}
              className="flex items-center justify-between w-full"
            >
              <h2 className="font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Status Timeline
              </h2>
              {showTimeline ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
            {showTimeline && (
              <div className="mt-4 space-y-4">
                {statusSteps.map((step, i) => (
                  <div key={step.key} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`h-8 w-8 rounded-full flex items-center justify-center ${
                          i === 0
                            ? "bg-primary text-white"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <step.icon className="h-4 w-4" />
                      </div>
                      {i < statusSteps.length - 1 && (
                        <div className="w-0.5 h-8 bg-muted" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{step.label}</p>
                      {step.date && (
                        <p className="text-xs text-muted-foreground">
                          {new Date(step.date).toLocaleString("en-IN")}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {canReturn && (
            <div className="border rounded-xl p-6 bg-card">
              <h2 className="font-semibold mb-3 flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-primary" />
                Need to Return?
              </h2>
              <p className="text-sm text-muted-foreground mb-3">
                You can request a return within 7 days of delivery. Items must be
                unused and in original packaging.
              </p>
              <textarea
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                placeholder="Tell us why you're returning this item..."
                className="w-full min-h-[80px] rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none mb-3"
              />
              <Button
                variant="outline"
                onClick={handleReturnRequest}
                disabled={returning || !returnReason.trim()}
              >
                {returning ? "Submitting..." : "Request Return"}
              </Button>
            </div>
          )}

          {order.status === "PENDING" && (
            <div className="border rounded-xl p-6 bg-card">
              <h2 className="font-semibold mb-3 flex items-center gap-2 text-red-600">
                Cancel Order
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                You can cancel this order as long as it hasn&apos;t been processed yet.
              </p>
              <Button
                variant="destructive"
                size="sm"
                onClick={async () => {
                  if (!confirm("Are you sure you want to cancel this order? This cannot be undone.")) return;
                  setCancelling(true);
                  try {
                    const { cancelOrderByCustomerAction } = await import("@/actions/orders");
                    await cancelOrderByCustomerAction(order.id);
                    window.location.reload();
                  } catch {
                    alert("Failed to cancel order. Please contact support.");
                  } finally {
                    setCancelling(false);
                  }
                }}
                disabled={cancelling}
              >
                {cancelling ? "Cancelling..." : "Cancel Order"}
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="border rounded-xl p-6 bg-card">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Delivery Address
            </h2>
            {order.address && (
              <div className="text-sm space-y-1">
                <p className="font-medium">{order.address.fullName}</p>
                <p className="text-muted-foreground">{order.address.phone}</p>
                <p className="text-muted-foreground">{order.address.line1}</p>
                {order.address.line2 && (
                  <p className="text-muted-foreground">{order.address.line2}</p>
                )}
                <p className="text-muted-foreground">
                  {order.address.city}, {order.address.state}{" "}
                  {order.address.postalCode}
                </p>
              </div>
            )}
          </div>

          <div className="border rounded-xl p-6 bg-card">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary" />
              Delivery
            </h2>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Option</span>
                <span>
                  {order.deliveryOption
                    ? (deliveryLabels[order.deliveryOption] ??
                      order.deliveryOption)
                    : "Standard"}
                </span>
              </div>
              {order.deliveryDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Deliver by</span>
                  <span className="font-medium">
                    {new Date(order.deliveryDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="border rounded-xl p-6 bg-card">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              Payment
            </h2>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>{formatPrice(order.shipping)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatPrice(order.tax)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span className="text-muted-foreground">
                    Discount{order.couponCode ? ` (${order.couponCode})` : ""}
                  </span>
                  <span>-{formatPrice(order.discount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-base">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>Method</span>
                <span>{order.paymentProvider}</span>
              </div>
            </div>
          </div>

          {order.giftOption && order.giftMessage && (
            <div className="border rounded-xl p-6 bg-card">
              <h2 className="font-semibold mb-3 flex items-center gap-2">
                <Gift className="h-4 w-4 text-primary" />
                Gift Message
              </h2>
              <p className="text-sm text-muted-foreground italic">
                &ldquo;{order.giftMessage}&rdquo;
              </p>
            </div>
          )}

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
        </div>
      </div>
    </div>
  );
}
