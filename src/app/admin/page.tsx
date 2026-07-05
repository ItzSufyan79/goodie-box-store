import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Users, Package, ShoppingCart, DollarSign, FileText,
  Ticket, Layers, AlertTriangle, CreditCard, UserPlus, Clock, MessageSquare, RotateCcw,
} from "lucide-react";
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

  const providerColors: Record<string, string> = {
    RAZORPAY: "text-violet-600",
    STRIPE: "text-blue-600",
    COD: "text-emerald-600",
  };

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

      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={stats?.revenueChartData} />
          </CardContent>
        </Card>

        {/* #2 — Pending Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Unshipped Orders</span>
              <Badge variant={stats?.pendingActions.unshippedOrders ? "default" : "outline"}>
                {stats?.pendingActions.unshippedOrders ?? 0}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Pending Custom Requests</span>
              <Badge variant={stats?.pendingActions.pendingCustomRequests ? "default" : "outline"}>
                {stats?.pendingActions.pendingCustomRequests ?? 0}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Low-Stock Products</span>
              <Badge
                variant={(stats?.pendingActions.lowStockCount ?? 0) > 0 ? "destructive" : "outline"}
              >
                {stats?.pendingActions.lowStockCount ?? 0}
              </Badge>
            </div>
            <div className="pt-2">
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href="/admin/orders?status=PENDING">
                  View Unshipped Orders →
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* #4 — Payment Method Breakdown + #5 — Low-Stock + #6 — Recent Signups */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* #4 — Sales by Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Sales by Payment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats?.paymentMethodBreakdown.length ? (
              stats.paymentMethodBreakdown.map((entry) => (
                <div
                  key={entry.provider}
                  className="flex items-center justify-between"
                >
                  <span className={`text-sm font-medium ${providerColors[entry.provider] ?? ""}`}>
                    {entry.provider === "COD" ? "COD" : entry.provider === "RAZORPAY" ? "Razorpay" : "Stripe"}
                  </span>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatPrice(entry.revenue)}</p>
                    <p className="text-xs text-muted-foreground">{entry.count} orders</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No paid orders yet</p>
            )}
          </CardContent>
        </Card>

        {/* #5 — Low-Stock Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Low-Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.lowStockProducts.length ? (
              <div className="space-y-2">
                {stats.lowStockProducts.slice(0, 5).map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="truncate">{product.title}</span>
                    <Badge variant="destructive" className="shrink-0 ml-2">
                      {product.inventory}
                    </Badge>
                  </div>
                ))}
                {stats.lowStockProducts.length > 5 && (
                  <p className="text-xs text-muted-foreground pt-1">
                    +{stats.lowStockProducts.length - 5} more
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">All products well-stocked</p>
            )}
          </CardContent>
        </Card>

        {/* #6 — Recent Signups */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Recent Signups
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.recentSignups.length ? (
              <div className="space-y-3">
                {stats.recentSignups.map((user) => (
                  <div key={user.id} className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {user.name ?? user.email}
                      </p>
                      {user.name && (
                        <p className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 ml-2">
                      {user.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No users yet</p>
            )}
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
            <Button asChild variant="outline" className="gap-2">
              <Link href="/admin/orders">
                <ShoppingCart className="h-4 w-4" />
                All Orders
              </Link>
            </Button>
            <Button asChild variant="outline" className="gap-2">
              <Link href="/admin/users">
                <Users className="h-4 w-4" />
                Users
              </Link>
            </Button>
            <Button asChild variant="outline" className="gap-2">
              <Link href="/admin/products">
                <Package className="h-4 w-4" />
                Products
              </Link>
            </Button>
            <Button asChild variant="outline" className="gap-2">
              <Link href="/admin/contacts">
                <MessageSquare className="h-4 w-4" />
                Contacts
              </Link>
            </Button>
            <Button asChild variant="outline" className="gap-2">
              <Link href="/admin/returns">
                <RotateCcw className="h-4 w-4" />
                Returns
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
