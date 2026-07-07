"use server";

import { auth } from "@/lib/auth";
import { uploadImage } from "@/lib/cloudinary";

export async function uploadPageImage(formData: FormData) {
  const session = await auth();
  if (!session?.user || !["SELLER", "ADMIN"].includes(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const file = formData.get("file") as File;
  if (!file) throw new Error("No file provided");

  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif"];
  const MAX_SIZE = 5 * 1024 * 1024;

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Invalid file type. Allowed: JPEG, PNG, WebP, GIF, HEIC");
  }
  if (file.size > MAX_SIZE) {
    throw new Error("File too large. Maximum size is 5MB");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

  const result = await uploadImage(base64, "goodie-box/pages");
  return result.url;
}
