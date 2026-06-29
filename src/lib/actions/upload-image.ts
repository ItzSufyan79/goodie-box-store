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

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

  const result = await uploadImage(base64, "goodie-box/pages");
  return result.url;
}
