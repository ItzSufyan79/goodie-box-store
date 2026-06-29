import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { indexProduct } from "@/lib/algolia";
import { uploadImage } from "@/lib/cloudinary";
import { productSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !["SELLER", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const price = parseFloat(formData.get("price") as string);
    const compareAtPrice = formData.get("compareAtPrice")
      ? parseFloat(formData.get("compareAtPrice") as string)
      : null;
    const inventory = parseInt(formData.get("inventory") as string, 10);
    const categoryId = formData.get("categoryId") as string;
    const brand = (formData.get("brand") as string) || undefined;
    const tagsRaw = formData.get("tags") as string;
    const tags = tagsRaw ? JSON.parse(tagsRaw) : [];

    const parsed = productSchema.safeParse({
      title,
      description,
      price,
      compareAtPrice: compareAtPrice || null,
      inventory,
      categoryId,
      brand: brand || undefined,
      tags,
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const imageFiles: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (key.startsWith("image-") && value instanceof File && value.size > 0) {
        imageFiles.push(value);
      }
    }

    const uploadedPhotos: { url: string; cloudinaryId: string | null }[] = [];
    if (imageFiles.length > 0) {
      const uploadResults = await Promise.allSettled(
        imageFiles.map(async (file) => {
          const buffer = Buffer.from(await file.arrayBuffer());
          const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;
          return uploadImage(base64, "goodie-box/products");
        })
      );
      for (const result of uploadResults) {
        if (result.status === "fulfilled") {
          uploadedPhotos.push({
            url: result.value.url,
            cloudinaryId: result.value.publicId,
          });
        }
      }
    }

    const slug = slugify(title);
    const product = await db.product.create({
      data: {
        title,
        description,
        price,
        compareAtPrice: compareAtPrice ?? undefined,
        inventory,
        categoryId,
        brand: brand || undefined,
        tags,
        slug,
        sellerId: session.user.id,
        photos: {
          create: uploadedPhotos.map((photo, idx) => ({
            url: photo.url,
            cloudinaryId: photo.cloudinaryId,
            sortOrder: idx,
            isPrimary: idx === 0,
          })),
        },
      },
      include: { photos: { orderBy: { sortOrder: "asc" } }, category: true },
    });

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

    return NextResponse.json({ success: true, product: { id: product.id } });
  } catch (error) {
    console.error("Failed to create product via API:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
