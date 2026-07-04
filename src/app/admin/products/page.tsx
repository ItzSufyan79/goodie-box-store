import { redirect } from "next/navigation";
import { getAdminProductsAction } from "@/actions/products";
import { auth } from "@/lib/auth";
import { AdminProductsClient } from "./admin-products-client";

interface Props {
  searchParams: Promise<{ search?: string; page?: string }>;
}

export default async function AdminProductsPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/");

  const { search, page: pageStr } = await searchParams;
  const page = parseInt(pageStr ?? "1", 10) || 1;

  const result = await getAdminProductsAction({ search, page });

  if (!result) redirect("/");

  return (
    <AdminProductsClient
      products={result.products}
      total={result.total}
      pages={result.pages}
      page={result.page}
      search={search ?? ""}
    />
  );
}
