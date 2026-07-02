import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getCouponsAction } from "@/actions/coupons";
import { CouponManager } from "@/components/admin/coupon-manager";

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/");

  const coupons = await getCouponsAction();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Coupon Management</h1>
      <p className="text-muted-foreground mb-8">Create and manage discount coupons</p>
      <CouponManager coupons={coupons} />
    </div>
  );
}
