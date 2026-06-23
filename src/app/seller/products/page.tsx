import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import {
  getSellerProductsAction,
  getCategoriesAction,
} from "@/actions/products";
import { SellerProductCard } from "@/components/seller/seller-product-card";
import { SellerCategoryManager } from "@/components/seller/seller-category-manager";
import { ClearAllButton } from "@/components/seller/clear-all-button";

export default async function SellerProductsPage() {
  const session = await auth();
  if (!session?.user || !["SELLER", "ADMIN"].includes(session.user.role)) {
    redirect("/");
  }

  const [products, categories] = await Promise.all([
    getSellerProductsAction(),
    getCategoriesAction(),
  ]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Products</h1>
          <p className="text-muted-foreground">
            {products.length} product{products.length !== 1 && "s"} listed
          </p>
        </div>
        <Button asChild>
          <Link href="/seller/products/new">
            <Plus className="mr-2 h-4 w-4" /> Add Product
          </Link>
        </Button>
      </div>

      {products.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No products yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first product to start selling on Goodie Box.
            </p>
            <Button asChild>
              <Link href="/seller/products/new">
                <Plus className="mr-2 h-4 w-4" /> Add Your First Product
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {products.map((product) => (
            <SellerProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      <div className="mt-12 grid lg:grid-cols-2 gap-8">
        <SellerCategoryManager categories={categories} />

        <Card>
          <CardContent className="py-6">
            <h3 className="text-lg font-semibold mb-2">Clear All Data</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Permanently delete all your products and unused categories. This
              action cannot be undone.
            </p>
            <ClearAllButton hasProducts={products.length > 0} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
