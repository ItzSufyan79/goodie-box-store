import { redirect, notFound } from "next/navigation";
import { getProductBySlugAction, getCategoriesAction } from "@/actions/products";
import { auth } from "@/lib/auth";
import { EditProductForm } from "@/components/seller/edit-product-form";

interface EditProductPageProps {
  params: Promise<{ slug: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user || !["SELLER", "ADMIN"].includes(session.user.role)) {
    redirect("/");
  }

  const [product, categories] = await Promise.all([
    getProductBySlugAction(slug),
    getCategoriesAction(),
  ]);

  if (!product) notFound();
  if (product.seller.id !== session.user.id && session.user.role !== "ADMIN") {
    redirect("/seller");
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-2">Edit Product</h1>
      <p className="text-muted-foreground mb-8">{product.title}</p>
      <EditProductForm
        product={{
          id: product.id,
          title: product.title,
          description: product.description,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          inventory: product.inventory,
          categoryId: product.category.id,
          brand: product.brand ?? "",
          photos: product.photos.map((p: { url: string; isPrimary: boolean; alt: string | null }) => ({
            url: p.url,
            isPrimary: p.isPrimary,
            alt: p.alt,
          })),
        }}
        categories={categories.map((c: { id: string; name: string }) => ({ id: c.id, name: c.name }))}
      />
    </div>
  );
}
