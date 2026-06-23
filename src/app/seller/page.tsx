import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Package,
  ShoppingCart,
  DollarSign,
  Clock,
  Plus,
  List,
  FileText,
  Truck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getSellerStatsAction, getSellerOrdersAction } from "@/actions/orders";
import { formatPrice } from "@/lib/utils";
import { auth } from "@/lib/auth";
import { SellerOrderActions } from "@/components/seller/order-actions";

export default async function SellerDashboardPage() {
  const session = await auth();
  if (
    !session?.user ||
    !["SELLER", "ADMIN"].includes(session.user.role)
  ) {
    redirect("/");
  }

  const [stats, orders] = await Promise.all([
    getSellerStatsAction(),
    getSellerOrdersAction(),
  ]);

  const statCards = [
    {
      title: "Total Products",
      value: stats?.totalProducts ?? 0,
      icon: Package,
    },
    {
      title: "Total Orders",
      value: stats?.totalOrders ?? 0,
      icon: ShoppingCart,
    },
    {
      title: "Pending Orders",
      value: stats?.pendingOrders ?? 0,
      icon: Clock,
    },
    {
      title: "Revenue",
      value: formatPrice(stats?.revenue ?? 0),
      icon: DollarSign,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Seller Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your products and orders
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/seller/orders">
              <Truck className="mr-2 h-4 w-4" /> Orders
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/seller/custom-requests">
              <FileText className="mr-2 h-4 w-4" /> Requests
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/seller/products">
              <List className="mr-2 h-4 w-4" /> My Products
            </Link>
          </Button>
          <Button asChild>
            <Link href="/seller/products/new">
              <Plus className="mr-2 h-4 w-4" /> Add Product
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No orders yet
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">Product</th>
                    <th className="text-left py-3 px-2">Customer</th>
                    <th className="text-left py-3 px-2">Qty</th>
                    <th className="text-left py-3 px-2">Amount</th>
                    <th className="text-left py-3 px-2">Status</th>
                    <th className="text-left py-3 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 10).map((item) => (
                    <tr key={item.id} className="border-b">
                      <td className="py-3 px-2 font-medium">
                        {item.product.title}
                      </td>
                      <td className="py-3 px-2">
                        {item.order.user.name ?? item.order.user.email}
                      </td>
                      <td className="py-3 px-2">{item.quantity}</td>
                      <td className="py-3 px-2">
                        {formatPrice(Number(item.price) * item.quantity)}
                      </td>
                      <td className="py-3 px-2">
                        <Badge variant="outline">{item.status}</Badge>
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
