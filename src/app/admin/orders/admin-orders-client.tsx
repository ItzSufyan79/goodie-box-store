"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ShoppingCart,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { SellerOrderActions } from "@/components/seller/order-actions";
import { ReceiptButton } from "@/components/orders/receipt-dialog";
import { DeleteOrderButton } from "@/components/seller/delete-order-button";
import { formatPrice } from "@/lib/utils";

const statusLabels: Record<string, string> = {
  PENDING: "Pending",
  PROCESSING: "Processing",
  DELAYED: "Delayed",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURNED: "Returned",
};

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  PROCESSING: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  DELAYED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  SHIPPED: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  DELIVERED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  RETURNED: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
};

const paymentLabels: Record<string, string> = {
  PENDING: "Unpaid",
  PAID: "Paid",
  REFUNDED: "Refunded",
  FAILED: "Failed",
};

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
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string | null; email: string };
  items: Array<{
    id: string;
    title: string;
    quantity: number;
    price: number;
    product: { title: string; slug: string; photos: { url: string }[] };
  }>;
  address: {
    fullName: string;
    phone: string;
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    postalCode: string;
  } | null;
}

export function AdminOrdersClient({ orders: initial }: { orders: OrderData[] }) {
  const [orders, setOrders] = useState(initial);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = orders.filter((o) => {
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.user.name?.toLowerCase().includes(search.toLowerCase()) ||
      o.user.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "ALL" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "PENDING").length,
    processing: orders.filter((o) => o.status === "PROCESSING").length,
    shipped: orders.filter((o) => o.status === "SHIPPED").length,
    delivered: orders.filter((o) => o.status === "DELIVERED").length,
    returned: orders.filter((o) => o.status === "RETURNED").length,
    cancelled: orders.filter((o) => o.status === "CANCELLED").length,
    revenue: orders
      .filter((o) => o.paymentStatus === "PAID")
      .reduce((sum, o) => sum + o.total, 0),
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ShoppingCart className="h-7 w-7 text-primary" />
            All Orders
          </h1>
          <p className="text-muted-foreground mt-1">{orders.length} total</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        {[
          { label: "Total", count: stats.total, active: statusFilter === "ALL", color: "" },
          { label: "Pending", count: stats.pending, active: statusFilter === "PENDING", color: "bg-yellow-100 dark:bg-yellow-900/30" },
          { label: "Processing", count: stats.processing, active: statusFilter === "PROCESSING", color: "bg-blue-100 dark:bg-blue-900/30" },
          { label: "Shipped", count: stats.shipped, active: statusFilter === "SHIPPED", color: "bg-purple-100 dark:bg-purple-900/30" },
          { label: "Delivered", count: stats.delivered, active: statusFilter === "DELIVERED", color: "bg-green-100 dark:bg-green-900/30" },
          { label: "Returned", count: stats.returned, active: statusFilter === "RETURNED", color: "bg-orange-100 dark:bg-orange-900/30" },
          { label: "Cancelled", count: stats.cancelled, active: statusFilter === "CANCELLED", color: "bg-red-100 dark:bg-red-900/30" },
        ].map((s) => (
          <button
            key={s.label}
            onClick={() => setStatusFilter(s.label === "Total" ? "ALL" : s.label.toUpperCase())}
            className={`rounded-lg border p-3 text-left transition-colors ${
              s.active
                ? "border-primary bg-primary/5"
                : "hover:bg-muted/50"
            }`}
          >
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-lg font-bold">{s.count}</p>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by order #, name, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          Revenue: {formatPrice(stats.revenue)}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((order) => (
          <Card key={order.id}>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{order.orderNumber}</span>
                    <Badge
                      className={`text-xs ${
                        statusColors[order.status] ?? ""
                      }`}
                    >
                      {statusLabels[order.status] ?? order.status}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {paymentLabels[order.paymentStatus] ??
                        order.paymentStatus}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {order.user.name ?? order.user.email} •{" "}
                    {new Date(order.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    • {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                    {order.address && (
                      <span>
                        {order.address.city}, {order.address.state}
                      </span>
                    )}
                    {order.deliveryOption && (
                      <>
                        <span>•</span>
                        <span>{order.deliveryOption}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-bold">{formatPrice(order.total)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                <SellerOrderActions
                  orderId={order.id}
                  currentStatus={order.status}
                  paymentStatus={order.paymentStatus}
                  paymentProvider={order.paymentProvider}
                />
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
                />
                {order.paymentStatus !== "PAID" &&
                  order.paymentProvider !== "COD" && (
                    <DeleteOrderButton orderItemId={order.items[0]?.id ?? ""} />
                  )}
              </div>

              <button
                onClick={() =>
                  setExpandedId(expandedId === order.id ? null : order.id)
                }
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-2 transition-colors"
              >
                {expandedId === order.id ? (
                  <>
                    <ChevronUp className="h-3 w-3" /> Hide items
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3" /> Show items
                  </>
                )}
              </button>

              {expandedId === order.id && (
                <div className="mt-3 pt-3 border-t space-y-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 text-sm">
                      <div className="relative h-10 w-10 rounded overflow-hidden bg-muted shrink-0">
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
                        <p className="truncate font-medium">{item.title}</p>
                        <p className="text-xs text-muted-foreground">
                          Qty: {item.quantity} × {formatPrice(item.price)}
                        </p>
                      </div>
                      <p className="font-medium">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No orders found</p>
        </div>
      )}
    </div>
  );
}
