import Link from "next/link";
import Image from "next/image";
import { getCollectionsAction } from "@/actions/products";

export default async function CollectionsPage() {
  const collections = await getCollectionsAction();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Gift Guides & Collections</h1>
      <p className="text-muted-foreground mb-8">
        Curated collections for every occasion
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {collections.map((collection) => (
          <Link
            key={collection.id}
            href={`/collections/${collection.slug}`}
            className="group border rounded-2xl overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="relative aspect-[16/10]">
              <Image
                src={
                  collection.image ??
                  "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=600"
                }
                alt={collection.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-5">
              <h2 className="text-lg font-bold group-hover:text-primary transition-colors">
                {collection.title}
              </h2>
              {collection.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {collection.description}
                </p>
              )}
              {collection.occasion && (
                <span className="inline-block mt-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                  {collection.occasion}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
