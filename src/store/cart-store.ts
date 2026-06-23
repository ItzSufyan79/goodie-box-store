"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CartStore {
  itemCount: number;
  setItemCount: (count: number) => void;
  increment: () => void;
  decrement: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      itemCount: 0,
      setItemCount: (count) => set({ itemCount: count }),
      increment: () => set((s) => ({ itemCount: s.itemCount + 1 })),
      decrement: () =>
        set((s) => ({ itemCount: Math.max(0, s.itemCount - 1) })),
    }),
    { name: "gbs-cart" }
  )
);

interface UIStore {
  searchOpen: boolean;
  mobileMenuOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  setMobileMenuOpen: (open: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  searchOpen: false,
  mobileMenuOpen: false,
  setSearchOpen: (open) => set({ searchOpen: open }),
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
}));
