import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getCartAction } from "@/actions/cart";
import { formatPrice } from "@/lib/utils";
import { CartItemsList } from "@/components/cart/cart-items-list";
import { CartPageWrapper } from "@/components/cart/cart-page-wrapper";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shopping Cart | GoodieBox Store",
  description: "Review your items and proceed to checkout.",
};

export default async function CartPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/cart");

  const cart = await getCartAction();
  const items = (cart?.items ?? []).map((item) => ({
    ...item,
    customizations: item.customizations as Record<string, string> | null,
  }));

  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0
  );
  const shipping = subtotal >= 999 ? 0 : 49;

  if (items.length === 0) {
    return (
      <CartPageWrapper>
      <div className="container mx-auto px-4 py-16 text-center">
        <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
        <p className="text-muted-foreground mb-6">
          Add some goodies to get started!
        </p>
        <Button asChild>
          <Link href="/products">Continue Shopping</Link>
        </Button>
      </div>
      </CartPageWrapper>
    );
  }

  return (
    <CartPageWrapper>
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <CartItemsList items={items} />
        </div>

        <div className="lg:col-span-1">
          <div className="border rounded-xl p-6 sticky top-24 space-y-4">
            <h2 className="text-lg font-bold">Order Summary</h2>
            <Separator />
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Shipping</span>
              <span>{shipping === 0 ? "FREE" : formatPrice(shipping)}</span>
            </div>
            {subtotal < 999 && (
              <p className="text-xs text-muted-foreground">
                Add {formatPrice(999 - subtotal)} more for free shipping
              </p>
            )}
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-primary">
                {formatPrice(subtotal + shipping)}
              </span>
            </div>
            <Button size="lg" className="w-full" asChild>
              <Link href="/checkout">Proceed to Checkout</Link>
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/products">Continue Shopping</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
    </CartPageWrapper>
  );
}
