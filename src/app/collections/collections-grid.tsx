"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { ScrollReveal } from "@/components/animations/scroll-reveal";

type Collection = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  image: string | null;
  occasion: string | null;
};

export function CollectionsGrid({ collections }: { collections: Collection[] }) {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {collections.map((collection, i) => (
          <ScrollReveal key={collection.id} direction={i % 2 === 0 ? "left" : "right"}>
            <motion.div
              whileHover={{ y: -6 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Link
                href={`/collections/${collection.slug}`}
                className="group block border rounded-2xl overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={
                      collection.image ??
                      "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=600"
                    }
                    alt={collection.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
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
            </motion.div>
          </ScrollReveal>
        ))}
      </div>
    </div>
  );
}
