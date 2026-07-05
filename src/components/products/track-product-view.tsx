"use client";

import { useEffect } from "react";
import { trackRecentlyViewed } from "./recently-viewed";

export function TrackProductView({
  slug, title, image, price,
}: {
  slug: string; title: string; image: string; price: number;
}) {
  useEffect(() => {
    trackRecentlyViewed(slug, title, image, price);
  }, [slug, title, image, price]);
  return null;
}
