import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getCartAction } from "@/actions/cart";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout | GoodieBox Store",
  description: "Complete your purchase with secure checkout.",
};

export default async function CheckoutPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/checkout");

  const cart = await getCartAction();
  const items = cart?.items ?? [];

  if (items.length === 0) redirect("/cart");

  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>
      <CheckoutForm subtotal={subtotal} />
    </div>
  );
}
