"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { cacheDel, cacheGet, cacheSet, CACHE_KEYS } from "@/lib/redis";
import { logger } from "@/lib/logger";
import { slugify } from "@/lib/utils";
import { productSchema, categorySchema, reviewSchema, customRequestSchema } from "@/lib/validations";
import { indexProduct, removeProductFromIndex } from "@/lib/algolia";
import { uploadImage } from "@/lib/cloudinary";
import { sendCustomRequestUpdate } from "@/lib/email";
import { revalidatePath } from "next/cache";
import type { Prisma, CustomRequestStatus } from "@prisma/client";

export async function uploadProductImageAction(formData: FormData) {
  const session = await auth();
  if (!session?.user || !["SELLER", "ADMIN"].includes(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const file = formData.get("file") as File;
  if (!file) throw new Error("No file provided");

  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  const MAX_SIZE = 5 * 1024 * 1024;

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Invalid file type. Allowed: JPEG, PNG, WebP, GIF");
  }
  if (file.size > MAX_SIZE) {
    throw new Error("File too large. Maximum size is 5MB");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

  const result = await uploadImage(base64, "goodie-box/products");
  return { url: result.url, publicId: result.publicId };
}

export async function getProductsAction(options: {
  page?: number;
  limit?: number;
  categorySlug?: string;
  search?: string;
  featured?: boolean;
  sort?: "price_asc" | "price_desc" | "name_asc" | "newest";
  customizable?: boolean;
} = {}) {
  const { page = 1, limit = 12, categorySlug, search, featured, sort = "newest", customizable } = options;
  const skip = (page - 1) * limit;

  const where: Prisma.ProductWhereInput = {
    isActive: true,
    ...(customizable === undefined && { isCustomizable: false }),
    ...(customizable !== undefined && { isCustomizable: customizable }),
    ...(featured && { isFeatured: true }),
    ...(categorySlug && { category: { slug: categorySlug } }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { brand: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    sort === "price_asc" ? { price: "asc" }
    : sort === "price_desc" ? { price: "desc" }
    : sort === "name_asc" ? { title: "asc" }
    : { createdAt: "desc" };

  try {
    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        include: {
          photos: { orderBy: { sortOrder: "asc" } },
          category: true,
        },
        orderBy,
        skip,
        take: limit,
      }),
      db.product.count({ where }),
    ]);

    return {
      products: products.map((p) => ({
        ...p,
        price: Number(p.price),
        compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
        image: p.photos.find((ph) => ph.isPrimary)?.url ?? p.photos[0]?.url ?? "",
      })),
      total,
      pages: Math.ceil(total / limit),
      page,
    };
  } catch (error) {
    logger.error("Failed to fetch products", error);
    return { products: [], total: 0, pages: 1, page };
  }
}

export async function getProductBySlugAction(slug: string) {
  const cached = await cacheGet<Awaited<ReturnType<typeof fetchProduct>>>(
    CACHE_KEYS.product(slug)
  );
  if (cached) return cached;

  const product = await fetchProduct(slug);
  if (product) {
    await cacheSet(CACHE_KEYS.product(slug), product, 600);
  }
  return product;
}

async function fetchProduct(slug: string) {
  const product = await db.product.findUnique({
    where: { slug },
    include: {
      photos: { orderBy: { sortOrder: "asc" } },
      category: true,
      seller: { include: { profile: true } },
      reviews: {
        where: { isApproved: true },
        select: {
          id: true,
          userId: true,
          rating: true,
          title: true,
          comment: true,
          createdAt: true,
          user: { select: { name: true, image: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!product) return null;

  const related = await db.product.findMany({
    where: {
      categoryId: product.categoryId,
      isActive: true,
      id: { not: product.id },
    },
    include: { photos: { where: { isPrimary: true }, take: 1 } },
    take: 4,
  });

  return {
    ...product,
    price: Number(product.price),
    compareAtPrice: product.compareAtPrice
      ? Number(product.compareAtPrice)
      : null,
    related: related.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      price: Number(p.price),
      compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
      image: p.photos[0]?.url ?? "",
      brand: p.brand,
      averageRating: p.averageRating,
      reviewCount: p.reviewCount,
    })),
  };
}

export async function createProductAction(data: unknown) {
  const session = await auth();
  if (!session?.user || !["SELLER", "ADMIN"].includes(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const parsed = productSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { images, ...productData } = parsed.data;
  const slug = slugify(productData.title);

  let uploadedPhotos: { url: string; cloudinaryId: string | null }[] = [];
  if (images && images.length > 0) {
    uploadedPhotos = (
      await Promise.allSettled(
        images.map(async (image) => {
          if (image.startsWith("http")) {
            return { url: image, publicId: null };
          }
          return uploadImage(image);
        })
      )
    )
      .filter(
        (r): r is PromiseFulfilledResult<{ url: string; publicId: string | null }> =>
          r.status === "fulfilled"
      )
      .map((r) => ({ url: r.value.url, cloudinaryId: r.value.publicId }));
  }

  const product = await db.product.create({
    data: {
      ...productData,
      slug,
      sellerId: session.user.id,
      compareAtPrice: productData.compareAtPrice ?? undefined,
      photos: {
        create: uploadedPhotos.map((photo, idx) => ({
          url: photo.url,
          cloudinaryId: photo.cloudinaryId,
          sortOrder: idx,
          isPrimary: idx === 0,
        })),
      },
    },
    include: { photos: true, category: true },
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
    isCustomizable: product.isCustomizable,
  });

  revalidatePath("/seller/products");
  revalidatePath("/products");
  return {
    success: true,
    product: {
      id: product.id,
      title: product.title,
      slug: product.slug,
      price: Number(product.price),
      inventory: product.inventory,
      categoryId: product.categoryId,
      photos: product.photos.map((p) => ({
        id: p.id,
        url: p.url,
        isPrimary: p.isPrimary,
      })),
    },
  };
}

export async function updateProductAction(id: string, data: unknown) {
  const session = await auth();
  if (!session?.user || !["SELLER", "ADMIN"].includes(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const existing = await db.product.findUnique({
    where: { id },
    select: { sellerId: true },
  });
  if (!existing) throw new Error("Product not found");
  if (existing.sellerId !== session.user.id && session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const parsed = productSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { images, ...productData } = parsed.data;

  let uploadedPhotos: { url: string; cloudinaryId: string | null }[] | undefined;
  if (images && images.length > 0) {
    const uploadResults = await Promise.allSettled(
      images.map((image) => uploadImage(image))
    );
    uploadedPhotos = uploadResults
      .filter(
        (r): r is PromiseFulfilledResult<{ url: string; publicId: string }> =>
          r.status === "fulfilled"
      )
      .map((r) => ({ url: r.value.url, cloudinaryId: r.value.publicId }));
  }

  const product = await db.product.update({
    where: { id },
    data: {
      ...productData,
      compareAtPrice: productData.compareAtPrice ?? undefined,
      ...(uploadedPhotos && {
        photos: {
          deleteMany: {},
          create: uploadedPhotos.map((photo, idx) => ({
            url: photo.url,
            cloudinaryId: photo.cloudinaryId,
            sortOrder: idx,
            isPrimary: idx === 0,
          })),
        },
      }),
    },
    include: { photos: true, category: true },
  });

  revalidatePath("/seller/products");
  revalidatePath(`/products/${product.slug}`);
  revalidatePath("/products");
  return { success: true, product };
}

export async function deleteProductAction(id: string) {
  const session = await auth();
  if (!session?.user || !["SELLER", "ADMIN"].includes(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const existing = await db.product.findUnique({
    where: { id },
    select: { sellerId: true },
  });
  if (!existing) throw new Error("Product not found");
  if (existing.sellerId !== session.user.id && session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  await db.product.delete({ where: { id } });
  await removeProductFromIndex(id);
  revalidatePath("/seller/products");
  revalidatePath("/products");
  return { success: true };
}

export async function getSellerProductsAction() {
  const session = await auth();
  if (!session?.user || !["SELLER", "ADMIN"].includes(session.user.role)) {
    return [];
  }

  try {
    const products = await db.product.findMany({
      where: { sellerId: session.user.id },
      include: {
        photos: { orderBy: { sortOrder: "asc" }, take: 1 },
        category: true,
        _count: { select: { reviews: true, orderItems: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return products.map((p) => ({
      ...p,
      price: Number(p.price),
      compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
      image: p.photos[0]?.url ?? "",
      orderCount: p._count.orderItems,
      reviewCount: p._count.reviews,
    }));
  } catch (error) {
    logger.error("Failed to fetch seller products", error, { userId: session.user.id });
    return [];
  }
}

export async function toggleProductStatusAction(id: string, isActive: boolean) {
  const session = await auth();
  if (!session?.user || !["SELLER", "ADMIN"].includes(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const product = await db.product.findUnique({
    where: { id },
    select: { id: true, slug: true, sellerId: true },
  });
  if (!product) throw new Error("Product not found");
  if (product.sellerId !== session.user.id && session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const updated = await db.product.update({
    where: { id },
    data: { isActive },
  });

  if (!isActive) {
    await removeProductFromIndex(id);
  }

  revalidatePath("/seller/products");
  revalidatePath(`/products/${product.slug}`);
  revalidatePath("/products");
  return { success: true, isActive: updated.isActive };
}

export async function toggleFeaturedAction(id: string, isFeatured: boolean) {
  const session = await auth();
  if (!session?.user || !["SELLER", "ADMIN"].includes(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const product = await db.product.findUnique({
    where: { id },
    select: { id: true, slug: true, sellerId: true },
  });
  if (!product) throw new Error("Product not found");
  if (product.sellerId !== session.user.id && session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  await db.product.update({
    where: { id },
    data: { isFeatured },
  });

  revalidatePath("/seller/products");
  revalidatePath("/");
  revalidatePath("/products");
  return { success: true, isFeatured };
}

export async function createReviewAction(productId: string, data: unknown) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const parsed = reviewSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const existing = await db.review.findUnique({
    where: {
      userId_productId: { userId: session.user.id, productId },
    },
  });
  if (existing) return { error: { root: ["You already reviewed this product"] } };

  await db.review.create({
    data: {
      userId: session.user.id,
      productId,
      ...parsed.data,
    },
  });

  const stats = await db.review.aggregate({
    where: { productId, isApproved: true },
    _avg: { rating: true },
    _count: true,
  });

  await db.product.update({
    where: { id: productId },
    data: {
      averageRating: stats._avg.rating ?? 0,
      reviewCount: stats._count,
    },
  });

  const product = await db.product.findUnique({
    where: { id: productId },
    select: { slug: true },
  });
  if (product) {
    await cacheDel(CACHE_KEYS.product(product.slug));
    revalidatePath(`/products/${product.slug}`);
  }
  revalidatePath("/products");
  return { success: true };
}

async function recalcProductStats(productId: string) {
  const stats = await db.review.aggregate({
    where: { productId, isApproved: true },
    _avg: { rating: true },
    _count: true,
  });
  await db.product.update({
    where: { id: productId },
    data: {
      averageRating: stats._avg.rating ?? 0,
      reviewCount: stats._count,
    },
  });
}

async function invalidateProductCache(productId: string) {
  const product = await db.product.findUnique({
    where: { id: productId },
    select: { slug: true },
  });
  if (product) {
    await cacheDel(CACHE_KEYS.product(product.slug));
    revalidatePath(`/products/${product.slug}`);
  }
}

export async function updateReviewAction(reviewId: string, data: unknown) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const review = await db.review.findUnique({ where: { id: reviewId } });
  if (!review) return { error: { root: ["Review not found"] } };
  if (review.userId !== session.user.id) throw new Error("Unauthorized");

  const parsed = reviewSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  await db.review.update({
    where: { id: reviewId },
    data: parsed.data,
  });

  await recalcProductStats(review.productId);
  await invalidateProductCache(review.productId);
  revalidatePath("/products");
  return { success: true };
}

export async function deleteReviewAction(reviewId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const review = await db.review.findUnique({ where: { id: reviewId } });
  if (!review) return { error: { root: ["Review not found"] } };
  if (review.userId !== session.user.id) throw new Error("Unauthorized");

  await db.review.delete({ where: { id: reviewId } });

  await recalcProductStats(review.productId);
  await invalidateProductCache(review.productId);
  revalidatePath("/products");
  return { success: true };
}

export async function createCustomRequestAction(data: unknown) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const parsed = customRequestSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const request = await db.customRequest.create({
    data: {
      userId: session.user.id,
      name: parsed.data.name,
      phone: parsed.data.phone,
      title: parsed.data.title,
      description: parsed.data.description,
      budget: parsed.data.budget ?? undefined,
      occasion: parsed.data.occasion,
      productId: parsed.data.productId,
      productTitle: parsed.data.productTitle,
    },
  });

  revalidatePath("/custom-request");
  return { success: true, request };
}

export async function createCategoryAction(data: unknown) {
  const session = await auth();
  if (!session?.user || !["SELLER", "ADMIN"].includes(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const parsed = categorySchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const slug = slugify(parsed.data.name);
  const existing = await db.category.findUnique({ where: { slug } });
  if (existing) {
    return { error: { name: ["Category already exists"] } };
  }

  const category = await db.category.create({
    data: { name: parsed.data.name, slug },
  });

  revalidatePath("/seller/products/new");
  revalidatePath("/products");
  return { success: true, category: { id: category.id, name: category.name } };
}

export async function getCollectionsAction() {
  try {
    return await db.collection.findMany({
      where: { isActive: true },
      include: {
        products: {
          include: {
            product: {
              include: { photos: { where: { isPrimary: true }, take: 1 } },
            },
          },
          take: 4,
        },
      },
      orderBy: { sortOrder: "asc" },
    });
  } catch (error) {
    logger.error("Failed to fetch collections", error);
    return [];
  }
}

export async function getCategoriesAction() {
  try {
    return await db.category.findMany({
      where: { parentId: null },
      include: { children: true },
      orderBy: { name: "asc" },
    });
  } catch (error) {
    logger.error("Failed to fetch categories", error);
    return [];
  }
}

export async function deleteCategoryAction(id: string) {
  const session = await auth();
  if (!session?.user || !["SELLER", "ADMIN"].includes(session.user.role)) {
    throw new Error("Unauthorized");
  }

  await db.category.delete({ where: { id } });
  revalidatePath("/seller/products");
  revalidatePath("/seller/products/new");
  revalidatePath("/products");
  return { success: true };
}

export async function clearAllSellerDataAction() {
  const session = await auth();
  if (!session?.user || !["SELLER", "ADMIN"].includes(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const sellerId = session.user.id;

  await db.$transaction([
    db.productPhoto.deleteMany({ where: { product: { sellerId } } }),
    db.review.deleteMany({ where: { product: { sellerId } } }),
    db.cartItem.deleteMany({ where: { product: { sellerId } } }),
    db.orderItem.deleteMany({ where: { sellerId } }),
    db.product.deleteMany({ where: { sellerId } }),
    db.category.deleteMany({
      where: {
        products: { none: { sellerId } },
      },
    }),
  ]);

  revalidatePath("/seller/products");
  revalidatePath("/seller");
  revalidatePath("/products");
  return { success: true };
}

export async function getCustomerCustomRequestsAction() {
  const session = await auth();
  if (!session?.user) return [];

  try {
    const requests = await db.customRequest.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });
    return requests.map((r) => ({
      ...r,
      budget: r.budget ? Number(r.budget) : null,
      quoteAmount: r.quoteAmount ? Number(r.quoteAmount) : null,
      paidAt: r.paidAt ? r.paidAt.toISOString() : null,
    }));
  } catch (error) {
    logger.error("Failed to fetch customer custom requests", error);
    return [];
  }
}

export async function getCustomRequestsAction() {
  const session = await auth();
  if (!session?.user || !["SELLER", "ADMIN"].includes(session.user.role)) {
    return [];
  }

  try {
    const requests = await db.customRequest.findMany({
      include: {
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return requests.map((r) => ({
      ...r,
      budget: r.budget ? Number(r.budget) : null,
      quoteAmount: r.quoteAmount ? Number(r.quoteAmount) : null,
      paidAt: r.paidAt ? r.paidAt.toISOString() : null,
    }));
  } catch (error) {
    logger.error("Failed to fetch custom requests", error);
    return [];
  }
}

export async function getSellerCustomRequestsAction() {
  const session = await auth();
  if (!session?.user || !["SELLER", "ADMIN"].includes(session.user.role)) {
    return [];
  }

  try {
    const requests = await db.customRequest.findMany({
      include: {
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return requests.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      status: r.status,
      paymentStatus: r.paymentStatus,
      budget: r.budget ? Number(r.budget) : null,
      quoteAmount: r.quoteAmount ? Number(r.quoteAmount) : null,
      createdAt: r.createdAt.toISOString(),
      paidAt: r.paidAt ? r.paidAt.toISOString() : null,
      user: r.user,
      name: r.name,
      phone: r.phone,
      occasion: r.occasion,
      adminNotes: r.adminNotes,
      userId: r.userId,
    }));
  } catch (error) {
    logger.error("Failed to fetch seller custom requests", error);
    return [];
  }
}

export async function updateCustomRequestStatusAction(
  id: string,
  status: CustomRequestStatus
) {
  const session = await auth();
  if (!session?.user || !["SELLER", "ADMIN"].includes(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const request = await db.customRequest.update({
    where: { id },
    data: { status },
    include: { user: { select: { name: true, email: true } } },
  });

  sendCustomRequestUpdate({
    email: request.user.email,
    name: request.user.name ?? "Customer",
    title: request.title,
    status: request.status,
  });

  revalidatePath("/seller/custom-requests");
  revalidatePath("/seller/orders");
  revalidatePath("/seller");
  return { success: true, status: request.status };
}

export async function updateCustomRequestPaymentAction(
  id: string,
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED"
) {
  const session = await auth();
  if (!session?.user || !["SELLER", "ADMIN"].includes(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const request = await db.customRequest.update({
    where: { id },
    data: {
      paymentStatus,
      paidAt: paymentStatus === "PAID" ? new Date() : null,
    },
    include: { user: { select: { name: true, email: true } } },
  });

  sendCustomRequestUpdate({
    email: request.user.email,
    name: request.user.name ?? "Customer",
    title: request.title,
    status: `PAYMENT_${paymentStatus}`,
  });

  revalidatePath("/seller/custom-requests");
  revalidatePath("/seller/orders");
  revalidatePath("/seller");
  return { success: true, paymentStatus: request.paymentStatus };
}

export async function saveCustomFieldsAction(
  productId: string,
  fields: { id?: string; label: string; type: string; options: string[]; required: boolean; sortOrder: number }[]
) {
  const session = await auth();
  if (!session?.user || !["SELLER", "ADMIN"].includes(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const product = await db.product.findUnique({
    where: { id: productId },
    select: { sellerId: true },
  });
  if (!product) throw new Error("Product not found");
  if (product.sellerId !== session.user.id && session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  await db.$transaction(async (tx) => {
    await tx.customProductField.deleteMany({ where: { productId } });

    if (fields.length > 0) {
      await tx.customProductField.createMany({
        data: fields.map((f) => ({
          productId,
          label: f.label,
          type: f.type,
          options: f.options,
          required: f.required,
          sortOrder: f.sortOrder,
        })),
      });
    }
  });

  revalidatePath(`/products/${productId}`);
  return { success: true };
}

export async function getCustomFieldsAction(productId: string) {
  const fields = await db.customProductField.findMany({
    where: { productId },
    orderBy: { sortOrder: "asc" },
  });
  return fields;
}

export async function getAdminProductsAction(options: {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  isActive?: boolean;
} = {}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return null;

  const { page = 1, limit = 20, search, categoryId, isActive } = options;
  const skip = (page - 1) * limit;

  const where: Prisma.ProductWhereInput = {
    ...(search && {
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { brand: { contains: search, mode: "insensitive" } },
        { seller: { name: { contains: search, mode: "insensitive" } } },
        { seller: { email: { contains: search, mode: "insensitive" } } },
      ],
    }),
    ...(categoryId && { categoryId }),
    ...(isActive !== undefined && { isActive }),
  };

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      include: {
        photos: { take: 1, orderBy: { sortOrder: "asc" } },
        category: true,
        seller: { select: { id: true, name: true, email: true } },
        _count: { select: { reviews: true, orderItems: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.product.count({ where }),
  ]);

  return {
    products: products.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      price: Number(p.price),
      inventory: p.inventory,
      isActive: p.isActive,
      isFeatured: p.isFeatured,
      isCustomizable: p.isCustomizable,
      image: p.photos[0]?.url ?? "",
      category: p.category.name,
      seller: p.seller.name ?? p.seller.email,
      sellerId: p.sellerId,
      orderCount: p._count.orderItems,
      reviewCount: p._count.reviews,
      createdAt: p.createdAt.toISOString(),
    })),
    total,
    pages: Math.ceil(total / limit),
    page,
  };
}

export async function saveProductSizesAction(productId: string, sizes: { label: string; price: number; sortOrder: number }[]) {
  const session = await auth();
  if (!session?.user || !["SELLER", "ADMIN"].includes(session.user.role)) throw new Error("Unauthorized");

  const product = await db.product.findUnique({
    where: { id: productId },
    select: { sellerId: true },
  });
  if (!product) throw new Error("Product not found");
  if (product.sellerId !== session.user.id && session.user.role !== "ADMIN") throw new Error("Unauthorized");

  await db.$transaction(async (tx) => {
    await tx.productSize.deleteMany({ where: { productId } });
    if (sizes.length > 0) {
      await tx.productSize.createMany({
        data: sizes.map((s) => ({
          productId,
          label: s.label,
          price: s.price,
          sortOrder: s.sortOrder,
        })),
      });
    }
  });

  revalidatePath(`/seller/products/${productId}/edit`);
  return { success: true };
}

export async function getProductSizesAction(productId: string) {
  const sizes = await db.productSize.findMany({
    where: { productId },
    orderBy: { sortOrder: "asc" },
  });
  return sizes.map((s) => ({ ...s, price: Number(s.price) }));
}
