import { redirect } from "next/navigation";
import { getCategoriesAction } from "@/actions/products";
import { NewProductForm } from "@/components/seller/new-product-form";
import { auth } from "@/lib/auth";

export default async function NewProductPage() {
  const session = await auth();
  if (
    !session?.user ||
    !["SELLER", "ADMIN"].includes(session.user.role)
  ) {
    redirect("/");
  }

  const categories = await getCategoriesAction();

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Add New Product</h1>
      <NewProductForm
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      />
    </div>
  );
}
