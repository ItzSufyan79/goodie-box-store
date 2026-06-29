"use client";

import { FadeIn, StaggerFadeIn, StaggerItem } from "@/components/animations/fade-in";
import type { ReactNode } from "react";

export function CartPageWrapper({ children }: { children: ReactNode }) {
  return <FadeIn>{children}</FadeIn>;
}

export function CartItemsWrapper({ children }: { children: ReactNode }) {
  return <StaggerFadeIn className="space-y-3">{children}</StaggerFadeIn>;
}

export function CartItemWrapper({ children }: { children: ReactNode }) {
  return <StaggerItem>{children}</StaggerItem>;
}
