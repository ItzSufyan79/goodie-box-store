import { db } from "@/lib/db";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://goodieboxstore.com";

export default async function sitemap() {
  const staticRoutes = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 1 },
    { url: `${BASE_URL}/products`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.9 },
    { url: `${BASE_URL}/collections`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 },
    { url: `${BASE_URL}/cart`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.3 },
    { url: `${BASE_URL}/login`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.2 },
    { url: `${BASE_URL}/signup`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.2 },
    { url: `${BASE_URL}/custom-request`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.6 },
  ];

  if (!process.env.DATABASE_URL) {
    return staticRoutes;
  }

  try {
    const [products, collections] = await Promise.all([
      db.product.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true },
      }),
      db.collection.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true },
      }),
    ]);

    const productRoutes = products.map((p) => ({
      url: `${BASE_URL}/products/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.7,
    }));

    const collectionRoutes = collections.map((c) => ({
      url: `${BASE_URL}/collections/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

    return [...staticRoutes, ...productRoutes, ...collectionRoutes];
  } catch {
    return staticRoutes;
  }
}
