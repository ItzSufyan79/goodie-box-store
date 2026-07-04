"use client";

import Image from "next/image";
import Link from "next/link";
import { CartItemControls } from "./cart-item-controls";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatPrice } from "@/lib/utils";

type CartItem = {
  id: string;
  quantity: number;
  customizations: Record<string, string> | null;
  product: {
    slug: string;
    title: string;
    price: string | { toString(): string };
    photos: { url: string }[];
  };
};

export function CartItemsList({ items }: { items: CartItem[] }) {
  if (items.length <= 3) {
    return (
      <div className="space-y-4">
        {items.map((item) => (
          <CartItem key={item.id} item={item} />
        ))}
      </div>
    );
  }

  return (
    <ScrollArea className="max-h-[600px] pr-4">
      <div className="space-y-4">
        {items.map((item) => (
          <CartItem key={item.id} item={item} />
        ))}
      </div>
    </ScrollArea>
  );
}

function CartItem({ item }: { item: CartItem }) {
  const image = item.product.photos[0]?.url ?? "/placeholder-product.jpg";
  const customEntries = item.customizations
    ? Object.entries(item.customizations).filter(([, v]) => v?.trim())
    : [];

  return (
    <div className="flex gap-4 p-4 border rounded-xl bg-card">
      <Link
        href={`/products/${item.product.slug}`}
        className="relative h-24 w-24 shrink-0 rounded-lg overflow-hidden bg-muted"
      >
        <Image src={image} alt={item.product.title} fill className="object-cover" />
      </Link>
      <div className="flex-1 min-w-0">
        <Link
          href={`/products/${item.product.slug}`}
          className="font-medium hover:text-primary line-clamp-2"
        >
          {item.product.title}
        </Link>
        {customEntries.length > 0 && (
          <div className="mt-1 text-xs text-muted-foreground space-y-0.5">
            {customEntries.map(([, value]) => (
              <span key={value} className="block truncate">{value}</span>
            ))}
          </div>
        )}
        <p className="text-primary font-bold mt-1">
          {formatPrice(Number(item.product.price))}
        </p>
        <CartItemControls itemId={item.id} quantity={item.quantity} />
      </div>
      <div className="text-right shrink-0">
        <p className="font-bold">
          {formatPrice(Number(item.product.price) * item.quantity)}
        </p>
      </div>
    </div>
  );
}
