"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Heart, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addToCartAction } from "@/actions/cart";
import { toggleWishlistAction } from "@/actions/wishlist";
import { useCartStore } from "@/store/cart-store";
import { SizeSelector } from "./size-selector";
import { formatPrice } from "@/lib/utils";

interface CustomField {
  id: string;
  label: string;
  type: string;
  options: string[];
  required: boolean;
  sortOrder: number;
}

interface SizeOption {
  id: string;
  label: string;
  price: number;
}

interface ProductCustomizerProps {
  productId: string;
  basePrice: number;
  inventory: number;
  isLoggedIn: boolean;
  isCustomizable: boolean;
  customFields: CustomField[];
  sizes: SizeOption[];
}

export function ProductCustomizer({
  productId,
  basePrice,
  inventory,
  isLoggedIn,
  isCustomizable,
  customFields,
  sizes,
}: ProductCustomizerProps) {
  const [isPending, startTransition] = useTransition();
  const [customizations, setCustomizations] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedSizeId, setSelectedSizeId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showSticky, setShowSticky] = useState(false);
  const increment = useCartStore((s) => s.increment);
  const router = useRouter();
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowSticky(!entry.isIntersecting),
      { threshold: 0, rootMargin: "-80px 0px 0px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const selectedSize = sizes.find((s) => s.id === selectedSizeId);
  const displayPrice = selectedSize ? selectedSize.price : basePrice;

  const setValue = (fieldId: string, value: string) => {
    setCustomizations((prev) => ({ ...prev, [fieldId]: value }));
    if (errors[fieldId]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    for (const field of customFields) {
      if (field.required && !customizations[field.id]?.trim()) {
        newErrors[field.id] = `${field.label} is required`;
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddToCart = () => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    if (isCustomizable && !validate()) return;

    startTransition(async () => {
      await addToCartAction(productId, quantity, customizations, selectedSizeId ?? undefined);
      increment();
    });
  };

  const handleWishlist = () => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    startTransition(async () => {
      await toggleWishlistAction(productId);
    });
  };

  return (
    <div className="space-y-4">
      {sizes.length > 0 && (
        <SizeSelector
          sizes={sizes}
          selectedSizeId={selectedSizeId}
          onChange={setSelectedSizeId}
        />
      )}

      <div className="flex items-baseline gap-3">
        <span className="text-2xl font-bold text-primary">
          {formatPrice(displayPrice)}
        </span>
        {(!selectedSize && basePrice !== displayPrice) && (
          <span className="text-sm text-muted-foreground">
            Select a size to see price
          </span>
        )}
      </div>

      {isCustomizable && customFields.length > 0 && (
        <div className="border rounded-lg p-4 space-y-4 bg-muted/20">
          <p className="text-sm font-semibold">Customize Your Order</p>
          {customFields.map((field) => (
            <div key={field.id}>
              <Label className="text-sm">
                {field.label}
                {field.required && <span className="text-destructive ml-0.5">*</span>}
              </Label>
              {field.type === "textarea" ? (
                <textarea
                  value={customizations[field.id] ?? ""}
                  onChange={(e) => setValue(field.id, e.target.value)}
                  rows={3}
                  className="mt-1 flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-y"
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                />
              ) : field.type === "select" ? (
                <select
                  value={customizations[field.id] ?? ""}
                  onChange={(e) => setValue(field.id, e.target.value)}
                  className="mt-1 flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select...</option>
                  {field.options.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <Input
                  value={customizations[field.id] ?? ""}
                  onChange={(e) => setValue(field.id, e.target.value)}
                  className="mt-1"
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                />
              )}
              {errors[field.id] && (
                <p className="text-xs text-destructive mt-1">{errors[field.id]}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <div ref={ctaRef} className="flex gap-3">
        <Button
          size="lg"
          className="flex-1"
          onClick={handleAddToCart}
          disabled={isPending || inventory === 0}
        >
          <ShoppingCart className="mr-2 h-5 w-5" />
          {inventory === 0 ? "Out of Stock" : "Add to Cart"}
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={handleWishlist}
          disabled={isPending}
        >
          <Heart className="h-5 w-5" />
        </Button>
      </div>

      {/* Sticky mobile add-to-cart bar */}
      {showSticky && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur p-3 md:hidden flex items-center gap-3 shadow-lg">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-primary text-lg">{formatPrice(displayPrice)}</p>
          </div>
          <div className="flex items-center gap-1 border rounded-lg">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="h-9 w-9 flex items-center justify-center text-muted-foreground hover:text-foreground"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-8 text-center text-sm font-medium">{quantity}</span>
            <button
              onClick={() => setQuantity(Math.min(inventory || 99, quantity + 1))}
              className="h-9 w-9 flex items-center justify-center text-muted-foreground hover:text-foreground"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <Button
            size="sm"
            className="shrink-0"
            onClick={handleAddToCart}
            disabled={isPending || inventory === 0}
          >
            {isPending ? "..." : inventory === 0 ? "Sold Out" : "Add"}
          </Button>
        </div>
      )}
    </div>
  );
}
