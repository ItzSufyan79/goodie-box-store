import Link from "next/link";
import { redirect } from "next/navigation";
import { Heart } from "lucide-react";
import { ProductCard } from "@/components/products/product-card";
import { getWishlistAction } from "@/actions/wishlist";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Wishlist | GoodieBox Store",
  description: "View and manage your saved wishlist items.",
};

export default async function WishlistPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/wishlist");

  const wishlist = await getWishlistAction();

  if (wishlist.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Your wishlist is empty</h1>
        <p className="text-muted-foreground mb-6">
          Save items you love for later!
        </p>
        <Button asChild>
          <Link href="/products">Browse Products</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Wishlist</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {wishlist.map((item) => (
          <ProductCard
            key={item.id}
            id={item.product.id}
            slug={item.product.slug}
            title={item.product.title}
            price={Number(item.product.price)}
            compareAtPrice={
              item.product.compareAtPrice
                ? Number(item.product.compareAtPrice)
                : null
            }
            image={
              item.product.photos.find((p) => p.isPrimary)?.url ??
              item.product.photos[0]?.url ??
              ""
            }
            brand={item.product.brand}
            averageRating={item.product.averageRating}
            reviewCount={item.product.reviewCount}
            inventory={item.product.inventory}
          />
        ))}
      </div>
    </div>
  );
}
