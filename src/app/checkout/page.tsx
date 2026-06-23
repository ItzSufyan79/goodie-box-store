import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getCartAction } from "@/actions/cart";
import { CheckoutForm } from "@/components/checkout/checkout-form";

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
  const shipping = subtotal >= 999 ? 0 : 49;
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + shipping + tax;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>
      <CheckoutForm
        subtotal={subtotal}
        shipping={shipping}
        tax={tax}
        total={total}
      />
    </div>
  );
}
