import { ProductCard, type ProductCardProps } from "@/components/products/product-card";
import { getProductsAction, getCategoriesAction } from "@/actions/products";
import { searchProducts } from "@/lib/algolia";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ProductsPageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    page?: string;
    brand?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const page = parseInt(params.page ?? "1", 10);
  const query = params.q ?? "";
  const categorySlug = params.category;

  const [categories] = await Promise.all([getCategoriesAction()]);

  let products: ProductCardProps[] = [];
  let total = 0;
  let pages = 1;

  if (query && process.env.NEXT_PUBLIC_ALGOLIA_APP_ID) {
    const algoliaResult = await searchProducts(query, {
      page: page - 1,
      facetFilters: categorySlug
        ? [[`categorySlug:${categorySlug}`]]
        : undefined,
    });
    products = algoliaResult.hits.map((hit) => ({
      id: hit.objectID,
      slug: hit.slug,
      title: hit.title,
      price: hit.price,
      compareAtPrice: hit.compareAtPrice ?? null,
      image: hit.image,
      brand: hit.brand ?? null,
      averageRating: hit.averageRating,
      reviewCount: hit.reviewCount,
      inventory: hit.inventory,
    }));
    total = algoliaResult.nbHits;
    pages = algoliaResult.nbPages;
  } else {
    const result = await getProductsAction({
      page,
      categorySlug,
      search: query || undefined,
    });
    products = result.products.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      image: p.image,
      brand: p.brand,
      averageRating: p.averageRating,
      reviewCount: p.reviewCount,
      inventory: p.inventory,
    }));
    total = result.total;
    pages = result.pages;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {query ? `Results for "${query}"` : "All Products"}
        </h1>
        <p className="text-muted-foreground">{total} products found</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters sidebar */}
        <aside className="lg:w-64 shrink-0">
          <div className="sticky top-24 space-y-6">
            <div>
              <h3 className="font-semibold mb-3">Categories</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/products"
                    className={cn(
                      "text-sm hover:text-primary transition-colors",
                      !categorySlug && "text-primary font-medium"
                    )}
                  >
                    All Categories
                  </Link>
                </li>
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <Link
                      href={`/products?category=${cat.slug}`}
                      className={cn(
                        "text-sm hover:text-primary transition-colors",
                        categorySlug === cat.slug && "text-primary font-medium"
                      )}
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>

        {/* Product grid */}
        <div className="flex-1">
          {products.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-lg text-muted-foreground mb-4">
                No products found
              </p>
              <Link href="/products" className="text-primary hover:underline">
                Browse all products
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} {...product} />
                ))}
              </div>

              {pages > 1 && (
                <div className="flex justify-center gap-2 mt-10">
                  {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                    <Link
                      key={p}
                      href={`/products?page=${p}${query ? `&q=${query}` : ""}${categorySlug ? `&category=${categorySlug}` : ""}`}
                      className={cn(
                        "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                        p === page
                          ? "bg-primary text-white"
                          : "bg-muted hover:bg-muted/80"
                      )}
                    >
                      {p}
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
