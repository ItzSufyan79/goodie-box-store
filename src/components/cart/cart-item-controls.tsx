"use client";

import { useTransition } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateCartItemAction, removeFromCartAction } from "@/actions/cart";
import { useCartStore } from "@/store/cart-store";

interface CartItemControlsProps {
  itemId: string;
  quantity: number;
}

export function CartItemControls({ itemId, quantity }: CartItemControlsProps) {
  const [isPending, startTransition] = useTransition();
  const { increment, decrement } = useCartStore();

  const update = (newQty: number) => {
    startTransition(async () => {
      await updateCartItemAction(itemId, newQty);
      if (newQty > quantity) increment();
      else if (newQty < quantity) decrement();
    });
  };

  const remove = () => {
    startTransition(async () => {
      await removeFromCartAction(itemId);
      for (let i = 0; i < quantity; i++) decrement();
    });
  };

  return (
    <div className="flex items-center gap-2 mt-3">
      <Button
        size="icon"
        variant="outline"
        className="h-8 w-8"
        onClick={() => update(Math.max(1, quantity - 1))}
        disabled={isPending || quantity <= 1}
      >
        <Minus className="h-3 w-3" />
      </Button>
      <span className="w-8 text-center text-sm font-medium">{quantity}</span>
      <Button
        size="icon"
        variant="outline"
        className="h-8 w-8"
        onClick={() => update(quantity + 1)}
        disabled={isPending}
      >
        <Plus className="h-3 w-3" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8 text-destructive ml-2"
        onClick={remove}
        disabled={isPending}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
