import { notFound } from "next/navigation";
import { Star, Truck, Shield, RotateCcw, MessageSquare, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ProductCard } from "@/components/products/product-card";
import { ProductCustomizer } from "@/components/products/product-customizer";
import { ReviewSection } from "@/components/products/review-section";
import { ImageGallery } from "@/components/products/image-gallery";
import { StockNotifyForm } from "@/components/products/stock-notify-form";
import { RecentlyViewed } from "@/components/products/recently-viewed";
import { TrackProductView } from "@/components/products/track-product-view";
import { SocialShare } from "@/components/products/social-share";
import { getProductBySlugAction, getCustomFieldsAction, getProductSizesAction } from "@/actions/products";
import { calculateDiscount } from "@/lib/utils";
import { auth } from "@/lib/auth";
import { ScrollReveal } from "@/components/animations/scroll-reveal";
import { HoverLift } from "@/components/animations/hover-lift";
import Link from "next/link";

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

  const [customFields, sizes] = await Promise.all([
    product.isCustomizable ? getCustomFieldsAction(product.id) : [],
    getProductSizesAction(product.id),
  ]);

  const discount = calculateDiscount(
    product.price,
    product.compareAtPrice
  );

  const productUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://goodieboxstore.online"}/products/${product.slug}`;
  const primaryImage = product.photos.find((p) => p.isPrimary)?.url ?? product.photos[0]?.url;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    image: primaryImage,
    sku: product.id,
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    offers: {
      "@type": "Offer",
      price: Number(product.price),
      priceCurrency: "INR",
      availability: product.inventory > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: productUrl,
    },
    aggregateRating: product.averageRating > 0 ? {
      "@type": "AggregateRating",
      ratingValue: product.averageRating,
      reviewCount: product.reviewCount,
    } : undefined,
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <TrackProductView
        slug={product.slug}
        title={product.title}
        image={primaryImage ?? ""}
        price={Number(product.price)}
      />
      <div className="grid lg:grid-cols-2 gap-10 mb-16">
        {/* Image gallery */}
        <ScrollReveal direction="left">
          <ImageGallery
            photos={product.photos.map((p) => ({
              id: p.id,
              url: p.url,
              alt: p.alt,
              isPrimary: p.isPrimary,
            }))}
            title={product.title}
            discount={discount}
          />
        </ScrollReveal>

        {/* Product info */}
        <ScrollReveal direction="right">
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

          <div className="text-muted-foreground mb-6 leading-relaxed whitespace-pre-line">
            {product.description}
          </div>

          <div className="flex items-center gap-2 mb-6 text-sm">
            {product.inventory > 0 ? (
              <Badge variant="success">In Stock ({product.inventory} left)</Badge>
            ) : (
              <>
                <Badge variant="destructive">Out of Stock</Badge>
              </>
            )}
          </div>

          {product.inventory === 0 && (
            <div className="mb-6">
              <StockNotifyForm productId={product.id} />
            </div>
          )}

          <ProductCustomizer
            productId={product.id}
            basePrice={Number(product.price)}
            inventory={product.inventory}
            isLoggedIn={!!session?.user}
            isCustomizable={product.isCustomizable}
            customFields={customFields}
            sizes={sizes}
          />

          {product.isCustomizable && product.customizationDelay && (
            <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm">
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-amber-800">
                    Made to order — estimated {product.customizationDelay}
                  </p>
                  {product.customizationDelayReason && (
                    <p className="text-amber-700 mt-0.5">{product.customizationDelayReason}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {product.isCustomizable && (
            <div className="mt-4">
              <Button variant="outline" className="w-full gap-2" asChild>
                <Link
                  href={`/custom-request?product=${product.slug}&title=${encodeURIComponent(product.title)}`}
                >
                  <MessageSquare className="h-4 w-4" />
                  Customize This Product
                </Link>
              </Button>
              <p className="text-xs text-muted-foreground mt-1.5 text-center">
                Want modifications or a personalized version? Let us know.
              </p>
            </div>
          )}

          <Separator className="my-6" />

          <SocialShare title={product.title} url={productUrl} />

          <Separator className="my-6" />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
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
        </ScrollReveal>
      </div>

      {/* Reviews */}
      <ScrollReveal>
        <ReviewSection
          productId={product.id}
          reviews={product.reviews}
          isLoggedIn={!!session?.user}
          userId={session?.user?.id}
        />
      </ScrollReveal>

      {/* Related products */}
      {product.related.length > 0 && (
        <ScrollReveal>
          <section>
            <h2 className="text-2xl font-bold mb-6">You Might Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {product.related.map((p, i) => (
                <ScrollReveal key={p.id} delay={i * 0.1} direction="up">
                  <HoverLift>
                    <ProductCard {...p} />
                  </HoverLift>
                </ScrollReveal>
              ))}
            </div>
          </section>
        </ScrollReveal>
      )}

      {/* Recently viewed */}
      <ScrollReveal>
        <div className="mt-16">
          <RecentlyViewed />
        </div>
      </ScrollReveal>
    </div>
  );
}
