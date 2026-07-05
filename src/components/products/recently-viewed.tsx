"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface RecentProduct {
  slug: string;
  title: string;
  image: string;
  price: number;
}

export function RecentlyViewed() {
  const [products, setProducts] = useState<RecentProduct[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("gbs-recently-viewed");
      if (stored) setProducts(JSON.parse(stored));
    } catch {}
  }, []);

  if (products.length === 0) return null;

  return (
    <section>
      <h2 className="text-2xl font-bold mb-6">Recently Viewed</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {products.map((p) => (
          <Link
            key={p.slug}
            href={`/products/${p.slug}`}
            className="group rounded-xl border overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="relative aspect-square bg-muted">
              {p.image && (
                <Image
                  src={p.image}
                  alt={p.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform"
                />
              )}
            </div>
            <div className="p-3">
              <p className="text-sm font-medium truncate">{p.title}</p>
              <p className="text-sm text-muted-foreground">₹{p.price}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function trackRecentlyViewed(slug: string, title: string, image: string, price: number) {
  try {
    const stored = JSON.parse(localStorage.getItem("gbs-recently-viewed") ?? "[]");
    const filtered = stored.filter((p: RecentProduct) => p.slug !== slug);
    const updated = [{ slug, title, image, price }, ...filtered].slice(0, 8);
    localStorage.setItem("gbs-recently-viewed", JSON.stringify(updated));
  } catch {}
}
