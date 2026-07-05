import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AdminReturnsClient } from "./admin-returns-client";

export const metadata = { title: "Return Requests | Admin | GoodieBox Store" };

export default async function AdminReturnsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/");

  const requests = await db.returnRequest.findMany({
    include: {
      order: {
        select: {
          orderNumber: true,
          total: true,
          paymentStatus: true,
          user: { select: { name: true, email: true } },
        },
      },
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const data = requests.map((r) => ({
    id: r.id,
    orderNumber: r.order.orderNumber,
    customerName: r.user.name ?? r.user.email,
    customerEmail: r.user.email,
    reason: r.reason,
    status: r.status,
    sellerNotes: r.sellerNotes,
    total: Number(r.order.total),
    paymentStatus: r.order.paymentStatus,
    createdAt: r.createdAt.toISOString(),
    reviewedAt: r.reviewedAt?.toISOString() ?? null,
    refundedAt: r.refundedAt?.toISOString() ?? null,
  }));

  return <AdminReturnsClient requests={data} />;
}
