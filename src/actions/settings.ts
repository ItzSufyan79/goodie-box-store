"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { uploadImage } from "@/lib/cloudinary";

const defaultHero = {
  badge: "Curated with love for every occasion",
  heading: "Gift Boxes That Make Memories",
  headingHighlight: "Make Memories",
  subtitle:
    "From exam survival kits to birthday surprises — discover thoughtfully curated goodie boxes, college essentials, and snacks delivered to your doorstep.",
  image:
    "https://images.unsplash.com/photo-1549465220-1a0b9238e821?w=800&q=80",
  statNumber: "50+",
  statLabel: "Gift Collections",
};

export interface HeroSettings {
  badge: string;
  heading: string;
  headingHighlight: string;
  subtitle: string;
  image: string;
  statNumber: string;
  statLabel: string;
}

export async function getHeroSettings(): Promise<HeroSettings> {
  const setting = await db.siteSetting.findUnique({
    where: { key: "homepage_hero" },
  });
  if (!setting) return defaultHero;
  return { ...defaultHero, ...(setting.value as Partial<HeroSettings>) };
}

export async function updateHeroSettings(data: Partial<HeroSettings>) {
  try {
    const session = await auth();
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SELLER")) {
      return { success: false, error: "Unauthorized" };
    }

    if (data.image && data.image.startsWith("data:")) {
      const { url } = await uploadImage(data.image, "goodie-box/homepage");
      data.image = url;
    }

    const existing = await db.siteSetting.findUnique({
      where: { key: "homepage_hero" },
    });

    if (existing) {
      await db.siteSetting.update({
        where: { key: "homepage_hero" },
        data: { value: { ...(existing.value as object), ...data } },
      });
    } else {
      await db.siteSetting.create({
        data: { key: "homepage_hero", value: data },
      });
    }

    revalidatePath("/");
    return { success: true };
  } catch (err) {
    console.error("updateHeroSettings error:", err);
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
