import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { ArrowLeft, Package, FileText, Info } from "lucide-react";
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

export default async function SellerOrdersPage() {
  const session = await auth();
  if (!session?.user || !["SELLER", "ADMIN"].includes(session.user.role)) {
    redirect("/");
  }

  const [orders, customRequests] = await Promise.all([
    getSellerOrdersAction(),
    getSellerCustomRequestsAction(),
  ]);

  const totalItems = orders.length + customRequests.length;
  const unpaidCount = orders.filter(
    (o) => o.order.paymentStatus === "PENDING" && o.order.paymentProvider !== "COD"
  ).length;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/seller">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="text-muted-foreground">
            Manage all customer orders &amp; custom requests
          </p>
        </div>
      </div>

      {totalItems === 0 ? (
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
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Items ({totalItems})</CardTitle>
              <ClearUnpaidButton count={unpaidCount} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">Type</th>
                    <th className="text-left py-3 px-2">ID</th>
                    <th className="text-left py-3 px-2">Date</th>
                    <th className="text-left py-3 px-2">Customer</th>
                    <th className="text-left py-3 px-2">Product</th>
                    <th className="text-left py-3 px-2">Qty</th>
                    <th className="text-left py-3 px-2">Amount</th>
                    <th className="text-left py-3 px-2">Shipping</th>
                    <th className="text-left py-3 px-2">Tax</th>
                    <th className="text-left py-3 px-2">Total</th>
                    <th className="text-left py-3 px-2">Status</th>
                    <th className="text-left py-3 px-2">Payment</th>
                    <th className="text-left py-3 px-2">Tracking</th>
                    <th className="text-left py-3 px-2">Receipt</th>
                    <th className="text-left py-3 px-2">Contact</th>
                    <th className="text-left py-3 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-2">
                        <Badge variant="outline" className="text-xs">Order</Badge>
                      </td>
                      <td className="py-3 px-2 font-mono text-xs">
                        {item.order.orderNumber}
                      </td>
                      <td className="py-3 px-2 text-muted-foreground whitespace-nowrap">
                        {new Date(item.order.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3 px-2">
                        <div className="text-sm font-medium">
                          {item.order.address?.fullName ?? item.order.user.name ?? item.order.user.email}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item.order.address?.phone ? (
                            <span>{item.order.address.phone} · </span>
                          ) : null}
                          {item.order.user.email}
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          {item.product.photos[0] && (
                            <div className="relative h-8 w-8 rounded overflow-hidden bg-muted shrink-0">
                              <Image
                                src={item.product.photos[0].url}
                                alt={item.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <span className="font-medium truncate max-w-[150px]">
                            {item.title}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-2">{item.quantity}</td>
                      <td className="py-3 px-2 font-medium">
                        {formatPrice(item.price * item.quantity)}
                      </td>
                      <td className="py-3 px-2 text-muted-foreground">
                        {formatPrice(item.order.shipping)}
                      </td>
                      <td className="py-3 px-2 text-muted-foreground">
                        {formatPrice(item.order.tax)}
                      </td>
                      <td className="py-3 px-2 font-medium">
                        {formatPrice(item.order.total)}
                      </td>
                      <td className="py-3 px-2">
                        <Badge
                          variant={statusColors[item.status] ?? "outline"}
                        >
                          {statusLabels[item.status] ?? item.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-2">
                        <Badge
                          variant={
                            item.status === "CANCELLED"
                              ? "destructive"
                              : item.order.paymentProvider === "COD"
                                ? "secondary"
                                : paymentColors[item.order.paymentStatus] ?? "outline"
                          }
                        >
                          {item.status === "CANCELLED"
                            ? "Cancelled"
                            : item.order.paymentProvider === "COD"
                              ? "Cash on Delivery"
                              : paymentLabels[item.order.paymentStatus] ?? item.order.paymentStatus}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-xs text-muted-foreground max-w-[120px] truncate">
                        {item.order.trackingNumber ?? "—"}
                      </td>
                      <td className="py-3 px-2">
                        {item.order.paymentStatus === "PAID" || item.order.paymentProvider === "COD" ? (
                          <ReceiptButton
                            orderNumber={item.order.orderNumber}
                            paymentId={item.order.paymentId}
                            items={item.order.items?.map((i: { title: string; quantity: number; price: number }) => ({
                              title: i.title,
                              quantity: i.quantity,
                              price: i.price,
                            })) ?? [{ title: item.title, quantity: item.quantity, price: item.price }]}
                            subtotal={item.order.subtotal}
                            shipping={item.order.shipping}
                            tax={item.order.tax}
                            discount={Number(item.order.discount ?? 0)}
                            couponCode={item.order.couponCode ?? null}
                            total={item.order.total}
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        {item.order.address ? (
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
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-1">
                          <SellerOrderActions
                            orderId={item.orderId}
                            currentStatus={item.status}
                            paymentStatus={item.order.paymentStatus}
                            paymentProvider={item.order.paymentProvider}
                          />
                          {item.order.paymentStatus === "PENDING" && item.order.paymentProvider !== "COD" && (
                            <DeleteOrderButton orderItemId={item.orderId} />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {customRequests.map((cr) => (
                    <tr key={cr.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-2">
                        <Badge variant="secondary" className="text-xs">
                          <FileText className="h-3 w-3 mr-1" />
                          Custom
                        </Badge>
                      </td>
                      <td className="py-3 px-2 font-mono text-xs text-muted-foreground">
                        CR-{cr.id.slice(0, 8)}
                      </td>
                      <td className="py-3 px-2 text-muted-foreground whitespace-nowrap">
                        {new Date(cr.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3 px-2">
                        <div className="text-sm font-medium">
                          {cr.user.name ?? cr.user.email}
                        </div>
                        {cr.user.name && (
                          <div className="text-xs text-muted-foreground">
                            {cr.user.email}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        <span className="font-medium truncate max-w-[150px] block">
                          {cr.title}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-muted-foreground">1</td>
                      <td className="py-3 px-2 text-muted-foreground">
                        {cr.quoteAmount
                          ? formatPrice(cr.quoteAmount)
                          : cr.budget
                            ? formatPrice(cr.budget)
                            : "—"}
                      </td>
                      <td className="py-3 px-2 text-muted-foreground">—</td>
                      <td className="py-3 px-2 text-muted-foreground">—</td>
                      <td className="py-3 px-2 font-medium">
                        {cr.quoteAmount
                          ? formatPrice(cr.quoteAmount)
                          : cr.budget
                            ? formatPrice(cr.budget) + " (est.)"
                            : "—"}
                      </td>
                      <td className="py-3 px-2">
                        <Badge
                          variant={customStatusColors[cr.status] ?? "outline"}
                        >
                          {customStatusLabels[cr.status] ?? cr.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-2">
                        <CustomRequestPaymentToggle
                          requestId={cr.id}
                          currentStatus={cr.paymentStatus}
                        />
                      </td>
                      <td className="py-3 px-2 text-xs text-muted-foreground">—</td>
                      <td className="py-3 px-2">
                        {cr.paymentStatus === "PAID" && cr.quoteAmount ? (
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
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          asChild
                        >
                          <Link href={`/seller/custom-requests`}>
                            View
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
