import { redirect } from "next/navigation";
import { getSellerStatsAction, getSellerOrdersAction } from "@/actions/orders";
import { auth } from "@/lib/auth";
import { SellerDashboardClient } from "@/components/seller/seller-dashboard-client";

export const dynamic = "force-dynamic";

export default async function SellerDashboardPage() {
  try {
    const session = await auth();
    if (!session?.user || !["SELLER", "ADMIN"].includes(session.user.role)) {
      redirect("/");
    }

    const [stats, orders] = await Promise.all([
      getSellerStatsAction(),
      getSellerOrdersAction(),
    ]);

    return (
      <SellerDashboardClient
        initialStats={{
          totalProducts: stats?.totalProducts ?? 0,
          totalOrders: stats?.totalOrders ?? 0,
          pendingOrders: stats?.pendingOrders ?? 0,
          revenue: stats?.revenue ?? 0,
        }}
        initialOrders={orders.slice(0, 10)}
      />
    );
  } catch (error) {
    console.error("SellerDashboardPage error:", error);
    throw error;
  }
}
