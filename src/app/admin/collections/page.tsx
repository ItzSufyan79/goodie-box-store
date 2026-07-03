import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getAllCollectionsAction } from "@/actions/collections";
import { CollectionManager } from "@/components/admin/collection-manager";

export const dynamic = "force-dynamic";

export default async function AdminCollectionsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/");

  const collections = await getAllCollectionsAction();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Collections & Gift Guides</h1>
      <p className="text-muted-foreground mb-8">Create and manage collections shown on the storefront</p>
      <CollectionManager collections={collections} />
    </div>
  );
}
