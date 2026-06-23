import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { ArrowLeft, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSellerOrdersAction } from "@/actions/orders";
import { formatPrice } from "@/lib/utils";
import { auth } from "@/lib/auth";
import { SellerOrderActions } from "@/components/seller/order-actions";

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

export default async function SellerOrdersPage() {
  const session = await auth();
  if (!session?.user || !["SELLER", "ADMIN"].includes(session.user.role)) {
    redirect("/");
  }

  const orders = await getSellerOrdersAction();

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
            Manage all customer orders
          </p>
        </div>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-1">No orders yet</p>
            <p className="text-sm text-muted-foreground">
              Orders will appear here once customers start purchasing.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Orders ({orders.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">Order</th>
                    <th className="text-left py-3 px-2">Date</th>
                    <th className="text-left py-3 px-2">Customer</th>
                    <th className="text-left py-3 px-2">Product</th>
                    <th className="text-left py-3 px-2">Qty</th>
                    <th className="text-left py-3 px-2">Amount</th>
                    <th className="text-left py-3 px-2">Status</th>
                    <th className="text-left py-3 px-2">Tracking</th>
                    <th className="text-left py-3 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-muted/50">
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
                          {item.order.user.name ?? item.order.user.email}
                        </div>
                        {item.order.user.name && (
                          <div className="text-xs text-muted-foreground">
                            {item.order.user.email}
                          </div>
                        )}
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
                        {formatPrice(Number(item.price) * item.quantity)}
                      </td>
                      <td className="py-3 px-2">
                        <Badge
                          variant={statusColors[item.status] ?? "outline"}
                        >
                          {statusLabels[item.status] ?? item.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-xs text-muted-foreground max-w-[120px] truncate">
                        {item.order.trackingNumber ?? "—"}
                      </td>
                      <td className="py-3 px-2">
                        <SellerOrderActions
                          orderId={item.orderId}
                          currentStatus={item.status}
                        />
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
