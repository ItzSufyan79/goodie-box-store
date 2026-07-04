import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { ArrowLeft, Package, FileText, Info, AlertTriangle, Clock, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getSellerOrdersAction, clearUnpaidOrdersAction } from "@/actions/orders";
import { getSellerCustomRequestsAction } from "@/actions/products";
import { formatPrice } from "@/lib/utils";
import { auth } from "@/lib/auth";
import { SellerOrderActions } from "@/components/seller/order-actions";
import { ReceiptButton } from "@/components/orders/receipt-dialog";
import { CustomRequestPaymentToggle } from "@/components/seller/custom-request-payment-toggle";
import { DeleteOrderButton } from "@/components/seller/delete-order-button";
import { ClearUnpaidButton } from "@/components/seller/clear-unpaid-button";
import { estimateDeliveryDate, getDueDateLabel, deliveryLabels, formatEstimatedDelivery } from "@/lib/delivery";
import { sendDueOrderNotification } from "@/lib/email";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Seller Orders | GoodieBox Store",
  description: "View and manage customer orders.",
};

const statusLabels: Record<string, string> = {
  PENDING: "Placed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURNED: "Returned",
};

const statusColors: Record<string, "outline" | "secondary" | "default" | "destructive"> = {
  PENDING: "outline",
  PROCESSING: "secondary",
  SHIPPED: "default",
  DELIVERED: "default",
  CANCELLED: "destructive",
  RETURNED: "destructive",
};

const paymentLabels: Record<string, string> = {
  PENDING: "Unpaid",
  PAID: "Paid",
  FAILED: "Failed",
  REFUNDED: "Refunded",
};

const paymentColors: Record<string, "outline" | "secondary" | "default" | "destructive"> = {
  PENDING: "outline",
  PAID: "default",
  FAILED: "destructive",
  REFUNDED: "secondary",
};

const customStatusLabels: Record<string, string> = {
  SUBMITTED: "Submitted",
  IN_REVIEW: "In Review",
  QUOTED: "Quoted",
  APPROVED: "Approved",
  FULFILLED: "Fulfilled",
  REJECTED: "Rejected",
};

const customStatusColors: Record<string, "outline" | "secondary" | "default" | "destructive"> = {
  SUBMITTED: "outline",
  IN_REVIEW: "secondary",
  QUOTED: "default",
  APPROVED: "default",
  FULFILLED: "default",
  REJECTED: "destructive",
};

const urgencyColors: Record<string, string> = {
  urgent: "text-red-600 border-red-200 bg-red-50 dark:text-red-400 dark:border-red-800 dark:bg-red-950",
  soon: "text-amber-600 border-amber-200 bg-amber-50 dark:text-amber-400 dark:border-amber-800 dark:bg-amber-950",
  later: "text-muted-foreground border-muted bg-muted/30",
};

interface OrderItemData {
  id: string;
  orderId: string;
  title: string;
  quantity: number;
  price: number;
  status: string;
  sellerId: string;
  productId: string;
  product: {
    id: string;
    title: string;
    price: number;
    compareAtPrice: number | null;
    photos: { url: string; isPrimary: boolean }[];
  };
  order: {
    orderNumber: string;
    paymentId: string | null;
    status: string;
    paymentStatus: string;
    paymentProvider: string;
    total: number;
    subtotal: number;
    shipping: number;
    tax: number;
    discount: number;
    couponCode: string | null;
    trackingNumber: string | null;
    deliveryOption: string | null;
    deliveryDate: string | null;
    createdAt: string;
    user: { name: string | null; email: string };
    items: { title: string; quantity: number; price: number }[];
    address: {
      fullName: string;
      phone: string;
      line1: string;
      line2: string | null;
      city: string;
      state: string;
      postalCode: string;
    } | null;
  };
}

interface CustomRequestItem {
  id: string;
  title: string;
  status: string;
  paymentStatus: string;
  budget: number | null;
  quoteAmount: number | null;
  createdAt: string;
  paidAt: string | null;
  user: { name: string | null; email: string };
  name: string;
  phone: string;
  occasion: string | null;
  adminNotes: string | null;
}

function getDueDate(item: OrderItemData): Date {
  return estimateDeliveryDate(
    item.order.deliveryOption ?? "STANDARD",
    item.order.deliveryDate ?? undefined,
  );
}

function OrderCard({ item }: { item: OrderItemData }) {
  const dueDate = getDueDate(item);
  const { label: dueLabel, urgency } = getDueDateLabel(dueDate);
  const isCompleted = item.status === "DELIVERED" || item.status === "CANCELLED" || item.status === "RETURNED";

  return (
    <div className={`rounded-lg border p-4 space-y-3 ${isCompleted ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">Order</Badge>
          <span className="font-mono text-xs text-muted-foreground">{item.order.orderNumber}</span>
        </div>
        {!isCompleted && (
          <Badge className={`text-xs ${urgencyColors[urgency]}`}>{dueLabel}</Badge>
        )}
      </div>

      <div className="flex items-center gap-2">
        {item.product.photos[0] && (
          <div className="relative h-10 w-10 rounded overflow-hidden bg-muted shrink-0">
            <Image
              src={item.product.photos[0].url}
              alt={item.title}
              fill
              className="object-cover"
            />
          </div>
        )}
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{item.title}</p>
          <p className="text-xs text-muted-foreground">Qty: {item.quantity} · {formatPrice(item.price * item.quantity)}</p>
        </div>
      </div>

      <div className="text-xs">
        <p className="font-medium">{item.order.address?.fullName ?? item.order.user.name ?? item.order.user.email}</p>
        <p className="text-muted-foreground">{item.order.user.email}</p>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant={statusColors[item.status] ?? "outline"} className="text-xs">
          {statusLabels[item.status] ?? item.status}
        </Badge>
        <Badge
          variant={
            item.status === "CANCELLED"
              ? "destructive"
              : item.order.paymentProvider === "COD"
                ? "secondary"
                : paymentColors[item.order.paymentStatus] ?? "outline"
          }
          className="text-xs"
        >
          {item.status === "CANCELLED"
            ? "Cancelled"
            : item.order.paymentProvider === "COD"
              ? "Cash on Delivery"
              : paymentLabels[item.order.paymentStatus] ?? item.order.paymentStatus}
        </Badge>
        {item.order.deliveryOption && (
          <Badge variant="outline" className="text-xs border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-400">
            {deliveryLabels[item.order.deliveryOption] ?? item.order.deliveryOption}
          </Badge>
        )}
      </div>

      {!isCompleted && dueDate && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>Due {dueDate.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</span>
        </div>
      )}

      <div className="flex items-center gap-2 pt-1">
        <SellerOrderActions
          orderId={item.orderId}
          currentStatus={item.status}
          paymentStatus={item.order.paymentStatus}
          paymentProvider={item.order.paymentProvider}
        />
        {item.order.paymentStatus === "PAID" || item.order.paymentProvider === "COD" ? (
          <ReceiptButton
            orderNumber={item.order.orderNumber}
            paymentId={item.order.paymentId}
            items={item.order.items ?? [{ title: item.title, quantity: item.quantity, price: item.price }]}
            subtotal={item.order.subtotal}
            shipping={item.order.shipping}
            tax={item.order.tax}
            discount={Number(item.order.discount ?? 0)}
            couponCode={item.order.couponCode ?? null}
            total={item.order.total}
          />
        ) : null}
        {item.order.paymentStatus === "PENDING" && item.order.paymentProvider !== "COD" && (
          <DeleteOrderButton orderItemId={item.orderId} />
        )}
        {item.order.address && (
          <TooltipProvider>
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="end" className="w-72">
                <div className="space-y-1.5">
                  <p className="font-medium">{item.order.address.fullName}</p>
                  <div className="text-muted-foreground text-xs space-y-0.5">
                    <p>{item.order.address.phone}</p>
                    <p>{item.order.address.line1}</p>
                    {item.order.address.line2 && <p>{item.order.address.line2}</p>}
                    <p>{item.order.address.city}, {item.order.address.state} — {item.order.address.postalCode}</p>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
}

export default async function SellerOrdersPage() {
  const session = await auth();
  if (!session?.user || !["SELLER", "ADMIN"].includes(session.user.role)) {
    redirect("/");
  }

  const [orders, customRequests] = await Promise.all([
    getSellerOrdersAction(),
    getSellerCustomRequestsAction(),
  ]);

  const unpaidCount = orders.filter(
    (o) => o.order.paymentStatus === "PENDING" && o.order.paymentProvider !== "COD"
  ).length;

  const activeOrdersForDue = orders.filter(
    (o) => o.status !== "DELIVERED" && o.status !== "CANCELLED" && o.status !== "RETURNED"
  );
  const dueSoonOrders = activeOrdersForDue.filter(
    (o) => getDueDateLabel(getDueDate(o)).urgency === "urgent"
  );
  if (dueSoonOrders.length > 0 && session.user.email) {
    sendDueOrderNotification({
      email: session.user.email,
      orders: dueSoonOrders.map((o) => ({
        orderNumber: o.order.orderNumber,
        title: o.title,
        customer: o.order.address?.fullName ?? o.order.user.name ?? o.order.user.email,
        dueDate: formatEstimatedDelivery(getDueDate(o)),
        deliveryOption: o.order.deliveryOption ?? "STANDARD",
      })),
    });
  }

  const activeOrders = orders.filter(
    (o) => o.status !== "DELIVERED" && o.status !== "CANCELLED" && o.status !== "RETURNED"
  );

  const dueSoon = activeOrders.filter((o) => getDueDateLabel(getDueDate(o)).urgency === "urgent");
  const dueThisWeek = activeOrders.filter((o) => getDueDateLabel(getDueDate(o)).urgency === "soon");
  const dueLater = activeOrders.filter((o) => getDueDateLabel(getDueDate(o)).urgency === "later");

  const completedOrders = orders.filter(
    (o) => o.status === "DELIVERED" || o.status === "CANCELLED" || o.status === "RETURNED"
  );

  const columns = [
    {
      title: "Due Soon",
      icon: AlertTriangle,
      color: "text-red-500",
      border: "border-red-200 dark:border-red-900",
      headerBg: "bg-red-50 dark:bg-red-950/50",
      items: dueSoon,
    },
    {
      title: "Due This Week",
      icon: Clock,
      color: "text-amber-500",
      border: "border-amber-200 dark:border-amber-900",
      headerBg: "bg-amber-50 dark:bg-amber-950/50",
      items: dueThisWeek,
    },
    {
      title: "Due Later",
      icon: Calendar,
      color: "text-muted-foreground",
      border: "border-muted",
      headerBg: "bg-muted/30",
      items: dueLater,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/seller">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="text-muted-foreground">
            {orders.length} order{orders.length !== 1 && "s"}, {activeOrders.length} active
          </p>
        </div>
        <ClearUnpaidButton count={unpaidCount} />
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-1">No orders yet</p>
            <p className="text-sm text-muted-foreground">
              Orders and custom requests will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Active orders grouped by due date */}
          {activeOrders.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {columns.map((col) => (
                <div key={col.title} className={`rounded-lg border ${col.border}`}>
                  <div className={`flex items-center gap-2 px-4 py-3 rounded-t-lg ${col.headerBg}`}>
                    <col.icon className={`h-4 w-4 ${col.color}`} />
                    <span className={`font-semibold text-sm ${col.color}`}>{col.title}</span>
                    <Badge variant="outline" className="ml-auto text-xs">{col.items.length}</Badge>
                  </div>
                  <div className="p-3 space-y-3 max-h-[600px] overflow-y-auto">
                    {col.items.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">No orders</p>
                    ) : (
                      col.items.map((item) => (
                        <OrderCard key={item.id} item={item} />
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Completed orders */}
          {completedOrders.length > 0 && (
            <details className="group">
              <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground font-medium mb-3">
                Completed Orders ({completedOrders.length})
              </summary>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {completedOrders.map((item) => (
                  <OrderCard key={item.id} item={item} />
                ))}
              </div>
            </details>
          )}

          {/* Custom requests */}
          {customRequests.length > 0 && (
            <details className="group">
              <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground font-medium mb-3">
                Custom Requests ({customRequests.length})
              </summary>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {customRequests.map((cr) => (
                  <div key={cr.id} className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        <FileText className="h-3 w-3 mr-1" />
                        Custom
                      </Badge>
                      <span className="font-mono text-xs text-muted-foreground">CR-{cr.id.slice(0, 8)}</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{cr.title}</p>
                      <p className="text-xs text-muted-foreground">{cr.user.name ?? cr.user.email}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant={customStatusColors[cr.status] ?? "outline"} className="text-xs">
                        {customStatusLabels[cr.status] ?? cr.status}
                      </Badge>
                      <CustomRequestPaymentToggle
                        requestId={cr.id}
                        currentStatus={cr.paymentStatus}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {cr.quoteAmount
                        ? formatPrice(cr.quoteAmount)
                        : cr.budget
                          ? formatPrice(cr.budget) + " (est.)"
                          : "No price set"}
                    </div>
                    <div className="flex items-center gap-2">
                      {cr.paymentStatus === "PAID" && cr.quoteAmount && (
                        <ReceiptButton
                          orderNumber={`CR-${cr.id.slice(0, 8)}`}
                          paymentId={null}
                          items={[{ title: cr.title, quantity: 1, price: cr.quoteAmount }]}
                          subtotal={cr.quoteAmount}
                          shipping={0}
                          tax={0}
                          discount={0}
                          couponCode={null}
                          total={cr.quoteAmount}
                        />
                      )}
                      <Button size="sm" variant="ghost" className="h-7 text-xs" asChild>
                        <Link href="/seller/custom-requests">View</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
