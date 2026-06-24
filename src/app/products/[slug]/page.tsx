import { notFound } from "next/navigation";
import Image from "next/image";
import { Star, Truck, Shield, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ProductCard } from "@/components/products/product-card";
import { ProductActions } from "@/components/products/product-actions";
import { ReviewForm } from "@/components/products/review-form";
import { ReviewItem } from "@/components/products/review-item";
import { getProductBySlugAction } from "@/actions/products";
import { formatPrice, calculateDiscount } from "@/lib/utils";
import { auth } from "@/lib/auth";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlugAction(slug);
  if (!product) return { title: "Product Not Found" };
  return {
    title: product.title,
    description: product.description.slice(0, 160),
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const [product, session] = await Promise.all([
    getProductBySlugAction(slug),
    auth(),
  ]);

  if (!product || !product.isActive) notFound();

  const discount = calculateDiscount(
    product.price,
    product.compareAtPrice
  );
  const primaryImage =
    product.photos.find((p) => p.isPrimary)?.url ?? product.photos[0]?.url;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid lg:grid-cols-2 gap-10 mb-16">
        {/* Image gallery */}
        <div className="space-y-4">
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted group">
            <Image
              src={primaryImage ?? "/placeholder-product.jpg"}
              alt={product.title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            {discount > 0 && (
              <Badge variant="sale" className="absolute top-4 left-4 text-sm">
                {discount}% OFF
              </Badge>
            )}
          </div>
          {product.photos.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {product.photos.slice(0, 4).map((photo) => (
                <div
                  key={photo.id}
                  className="relative aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer hover:ring-2 hover:ring-primary"
                >
                  <Image
                    src={photo.url}
                    alt={photo.alt ?? product.title}
                    fill
                    className="object-cover"
                    sizes="100px"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product info */}
        <div>
          {product.brand && (
            <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2">
              {product.brand}
            </p>
          )}
          <h1 className="text-3xl font-bold mb-4">{product.title}</h1>

          <div className="flex items-center gap-3 mb-4">
            {product.averageRating > 0 && (
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.round(product.averageRating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted"
                    }`}
                  />
                ))}
                <span className="text-sm ml-1">
                  ({product.reviewCount} reviews)
                </span>
              </div>
            )}
            <Badge variant="outline">{product.category.name}</Badge>
          </div>

          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-3xl font-bold text-primary">
              {formatPrice(product.price)}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-xl text-muted-foreground line-through">
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
          </div>

          <p className="text-muted-foreground mb-6 leading-relaxed">
            {product.description}
          </p>

          <div className="flex items-center gap-2 mb-6 text-sm">
            {product.inventory > 0 ? (
              <Badge variant="success">In Stock ({product.inventory} left)</Badge>
            ) : (
              <Badge variant="destructive">Out of Stock</Badge>
            )}
          </div>

          <ProductActions
            productId={product.id}
            inventory={product.inventory}
            isLoggedIn={!!session?.user}
          />

          <Separator className="my-6" />

          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="flex flex-col items-center text-center gap-2 p-3 rounded-lg bg-muted/50">
              <Truck className="h-5 w-5 text-primary" />
              <span>Free shipping over ₹999</span>
            </div>
            <div className="flex flex-col items-center text-center gap-2 p-3 rounded-lg bg-muted/50">
              <Shield className="h-5 w-5 text-primary" />
              <span>Secure payment</span>
            </div>
            <div className="flex flex-col items-center text-center gap-2 p-3 rounded-lg bg-muted/50">
              <RotateCcw className="h-5 w-5 text-primary" />
              <span>Easy returns</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>
        {session?.user && (
          <ReviewForm productId={product.id} className="mb-8" />
        )}
        {product.reviews.length === 0 ? (
          <p className="text-muted-foreground">No reviews yet. Be the first!</p>
        ) : (
          <div className="space-y-6">
            {product.reviews.map((review) => (
              <ReviewItem
                key={review.id}
                review={review}
                isOwner={session?.user?.id === review.userId}
                productId={product.id}
              />
            ))}
          </div>
        )}
      </section>

      {/* Related products */}
      {product.related.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-6">You Might Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {product.related.map((p) => (
              <ProductCard key={p.id} {...p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
