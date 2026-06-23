import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { indexProduct } from "@/lib/algolia";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.ALGOLIA_SYNC_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const products = await db.product.findMany({
    where: { isActive: true },
    include: { photos: true, category: true },
  });

  for (const product of products) {
    await indexProduct({
      objectID: product.id,
      title: product.title,
      slug: product.slug,
      description: product.description,
      price: Number(product.price),
      compareAtPrice: product.compareAtPrice
        ? Number(product.compareAtPrice)
        : undefined,
      brand: product.brand ?? undefined,
      category: product.category.name,
      categorySlug: product.category.slug,
      tags: product.tags,
      image: product.photos[0]?.url ?? "",
      inventory: product.inventory,
      averageRating: product.averageRating,
      reviewCount: product.reviewCount,
      isFeatured: product.isFeatured,
    });

    await db.product.update({
      where: { id: product.id },
      data: { algoliaObjectId: product.id },
    });
  }

  return NextResponse.json({ synced: products.length });
}
