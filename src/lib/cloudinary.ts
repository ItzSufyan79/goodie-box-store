import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };

export function getOptimizedImageUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string | number;
  } = {}
) {
  const { width = 600, height, crop = "fill", quality = "auto" } = options;

  if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
    return publicId.startsWith("http") ? publicId : `/placeholder-product.jpg`;
  }

  return cloudinary.url(publicId, {
    width,
    height,
    crop,
    quality,
    fetch_format: "auto",
  });
}

export async function uploadImage(
  file: string,
  folder = "goodie-box/products"
): Promise<{ url: string; publicId: string }> {
  if (!process.env.CLOUDINARY_API_KEY) {
    throw new Error("Cloudinary is not configured");
  }

  const result = await cloudinary.uploader.upload(file, {
    folder,
    resource_type: "image",
  });

  return { url: result.secure_url, publicId: result.public_id };
}
