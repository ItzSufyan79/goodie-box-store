import { redirect } from "next/navigation";
import { getAdminOrdersAction } from "@/actions/orders";
import { auth } from "@/lib/auth";
import { AdminOrdersClient } from "./admin-orders-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Orders | Admin",
  description: "Manage all orders across the store.",
};

export default async function AdminOrdersPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/");
  }

  const orders = await getAdminOrdersAction();
  return <AdminOrdersClient orders={orders} />;
}
