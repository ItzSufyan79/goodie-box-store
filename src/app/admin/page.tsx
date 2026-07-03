import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, Package, ShoppingCart, DollarSign, FileText, Ticket, Layers } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAdminStatsAction } from "@/actions/orders";
import { formatPrice } from "@/lib/utils";
import { auth } from "@/lib/auth";
import { RevenueChart } from "@/components/admin/revenue-chart";

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/");
  }

  const stats = await getAdminStatsAction();

  const statCards = [
    { title: "Total Users", value: stats?.totalUsers ?? 0, icon: Users },
    { title: "Active Products", value: stats?.totalProducts ?? 0, icon: Package },
    { title: "Total Orders", value: stats?.totalOrders ?? 0, icon: ShoppingCart },
    {
      title: "Total Revenue",
      value: formatPrice(stats?.totalRevenue ?? 0),
      icon: DollarSign,
    },
    {
      title: "Pending Requests",
      value: stats?.pendingCustomRequests ?? 0,
      icon: FileText,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
      <p className="text-muted-foreground mb-8">
        System overview and management
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
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

      <div className="grid lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex justify-between items-center py-2 border-b last:border-0"
                >
                  <div>
                    <p className="font-medium text-sm">{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.user.name ?? order.user.email}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">
                      {formatPrice(Number(order.total))}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild variant="outline" className="gap-2">
              <Link href="/admin/coupons">
                <Ticket className="h-4 w-4" />
                Coupons
              </Link>
            </Button>
            <Button asChild variant="outline" className="gap-2">
              <Link href="/admin/collections">
                <Layers className="h-4 w-4" />
                Collections
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
