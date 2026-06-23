"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addToCartAction } from "@/actions/cart";
import { toggleWishlistAction } from "@/actions/wishlist";
import { useCartStore } from "@/store/cart-store";

interface ProductActionsProps {
  productId: string;
  inventory: number;
  isLoggedIn: boolean;
}

export function ProductActions({
  productId,
  inventory,
  isLoggedIn,
}: ProductActionsProps) {
  const [isPending, startTransition] = useTransition();
  const increment = useCartStore((s) => s.increment);
  const router = useRouter();

  const handleAddToCart = () => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    startTransition(async () => {
      await addToCartAction(productId, 1);
      increment();
    });
  };

  const handleWishlist = () => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    startTransition(async () => {
      await toggleWishlistAction(productId);
    });
  };

  return (
    <div className="flex gap-3">
      <Button
        size="lg"
        className="flex-1"
        onClick={handleAddToCart}
        disabled={isPending || inventory === 0}
      >
        <ShoppingCart className="mr-2 h-5 w-5" />
        {inventory === 0 ? "Out of Stock" : "Add to Cart"}
      </Button>
      <Button
        size="lg"
        variant="outline"
        onClick={handleWishlist}
        disabled={isPending}
      >
        <Heart className="h-5 w-5" />
      </Button>
    </div>
  );
}
