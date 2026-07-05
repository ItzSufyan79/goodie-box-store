"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice, calculateDiscount } from "@/lib/utils";
import { addToCartAction } from "@/actions/cart";
import { toggleWishlistAction } from "@/actions/wishlist";
import { useCartStore } from "@/store/cart-store";
import { useTransition } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MoneyBackBadge } from "@/components/ui/money-back-badge";

export interface ProductCardProps {
  id: string;
  slug: string;
  title: string;
  price: number;
  compareAtPrice?: number | null;
  image: string;
  brand?: string | null;
  averageRating?: number;
  reviewCount?: number;
  inventory?: number;
}

export function ProductCard({
  id,
  slug,
  title,
  price,
  compareAtPrice,
  image,
  brand,
  averageRating = 0,
  reviewCount = 0,
  inventory = 0,
}: ProductCardProps) {
  const [isPending, startTransition] = useTransition();
  const increment = useCartStore((s) => s.increment);
  const { data: session } = useSession();
  const router = useRouter();
  const discount = calculateDiscount(price, compareAtPrice ?? null);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!session) {
      router.push("/login");
      return;
    }
    startTransition(async () => {
      await addToCartAction(id, 1);
      increment();
    });
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!session) {
      router.push("/login");
      return;
    }
    startTransition(async () => {
      await toggleWishlistAction(id);
    });
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Link href={`/products/${slug}`}>
        <Card className="group overflow-hidden border-0 shadow-md hover:shadow-xl transition-shadow">
          <div className="relative aspect-square overflow-hidden bg-muted">
            <Image
              src={image || "/placeholder-product.jpg"}
              alt={title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
            {discount > 0 && (
              <Badge variant="sale" className="absolute top-2 left-2">
                {discount}% OFF
              </Badge>
            )}
            {inventory <= 5 && inventory > 0 && (
              <Badge variant="secondary" className="absolute top-2 right-2">
                Only {inventory} left
              </Badge>
            )}
            <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8 rounded-full shadow"
                    onClick={handleWishlist}
                    disabled={isPending}
                  >
                    <Heart className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Add to Wishlist</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    className="h-8 w-8 rounded-full shadow"
                    onClick={handleAddToCart}
                    disabled={isPending || inventory === 0}
                  >
                    <ShoppingCart className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {inventory === 0 ? "Out of Stock" : "Add to Cart"}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
          <CardContent className="p-4">
            {brand && (
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                {brand}
              </p>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <h3 className="font-medium text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors cursor-default">
                  {title}
                </h3>
              </TooltipTrigger>
              <TooltipContent side="top">{title}</TooltipContent>
            </Tooltip>
            <div className="flex items-center gap-1 mb-2">
              {averageRating > 0 && (
                <>
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span className="text-xs font-medium">{averageRating.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground">({reviewCount})</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-primary">{formatPrice(price)}</span>
              {compareAtPrice && compareAtPrice > price && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatPrice(compareAtPrice)}
                </span>
              )}
            </div>
            <MoneyBackBadge className="mt-1.5" />
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
