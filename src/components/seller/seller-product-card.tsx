"use client";

import Link from "next/link";
import Image from "next/image";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Edit, EyeOff, Eye, Trash2, Star, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import { toggleProductStatusAction, deleteProductAction, toggleFeaturedAction } from "@/actions/products";

interface SellerProduct {
  id: string;
  slug: string;
  title: string;
  price: number;
  compareAtPrice: number | null;
  image: string;
  brand: string | null;
  inventory: number;
  isActive: boolean;
  isFeatured: boolean;
  averageRating: number;
  reviewCount: number;
  orderCount: number;
  createdAt: Date;
  category: { id: string; name: string; slug: string };
}

interface SellerProductCardProps {
  product: SellerProduct;
}

export function SellerProductCard({ product }: SellerProductCardProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleToggleStatus = () => {
    startTransition(async () => {
      await toggleProductStatusAction(product.id, !product.isActive);
      router.refresh();
    });
  };

  const handleDelete = () => {
    if (!confirm(`Permanently delete "${product.title}"? This cannot be undone.`)) return;
    startTransition(async () => {
      await deleteProductAction(product.id);
      router.refresh();
    });
  };

  const handleToggleFeatured = () => {
    startTransition(async () => {
      await toggleFeaturedAction(product.id, !product.isFeatured);
      router.refresh();
    });
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-4">
        <div className="relative h-20 w-20 shrink-0 rounded-lg overflow-hidden bg-muted">
          <Image
            src={product.image || "/placeholder-product.jpg"}
            alt={product.title}
            fill
            className="object-cover"
            sizes="80px"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Link
              href={`/products/${product.slug}`}
              className="font-semibold hover:text-primary truncate"
            >
              {product.title}
            </Link>
            <Badge variant={product.isActive ? "success" : "secondary"} className="shrink-0">
              {product.isActive ? "Active" : "Inactive"}
            </Badge>
            {product.isFeatured && (
              <Badge variant="default" className="shrink-0">Featured</Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{formatPrice(product.price)}</span>
            <Badge variant="outline" className="text-xs">{product.category.name}</Badge>
            <span>Stock: {product.inventory}</span>
            {product.averageRating > 0 && (
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {product.averageRating.toFixed(1)} ({product.reviewCount})
              </span>
            )}
            <span className="flex items-center gap-1">
              <ShoppingCart className="h-3 w-3" />
              {product.orderCount} sold
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            asChild
          >
            <Link href={`/seller/products/${product.slug}/edit`}>
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggleStatus}
            disabled={isPending}
            aria-label={product.isActive ? "Deactivate product" : "Activate product"}
          >
            {product.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggleFeatured}
            disabled={isPending}
            aria-label={product.isFeatured ? "Remove from featured" : "Mark as featured"}
          >
            <Star className={`h-4 w-4 ${product.isFeatured ? "fill-amber-400 text-amber-400" : ""}`} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            disabled={isPending}
            className="text-destructive hover:text-destructive"
            aria-label="Remove product"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
