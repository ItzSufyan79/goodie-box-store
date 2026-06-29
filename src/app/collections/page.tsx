import Link from "next/link";
import Image from "next/image";
import { getCollectionsAction } from "@/actions/products";
import { CollectionsGrid } from "./collections-grid";

export const metadata = {
  title: "Gift Guides & Collections",
  description: "Browse our curated gift collections for every occasion.",
};

export default async function CollectionsPage() {
  const collections = await getCollectionsAction();

  return (
    <div className="min-h-screen">
      <section className="py-16 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-2">Gift Guides & Collections</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Curated collections for every occasion — find the perfect gift in minutes
          </p>
        </div>
      </section>

      <CollectionsGrid collections={collections} />
    </div>
  );
}
