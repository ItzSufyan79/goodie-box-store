"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addToCartAction } from "@/actions/cart";
import { toggleWishlistAction } from "@/actions/wishlist";
import { useCartStore } from "@/store/cart-store";

interface CustomField {
  id: string;
  label: string;
  type: string;
  options: string[];
  required: boolean;
  sortOrder: number;
}

interface ProductCustomizerProps {
  productId: string;
  inventory: number;
  isLoggedIn: boolean;
  isCustomizable: boolean;
  customFields: CustomField[];
}

export function ProductCustomizer({
  productId,
  inventory,
  isLoggedIn,
  isCustomizable,
  customFields,
}: ProductCustomizerProps) {
  const [isPending, startTransition] = useTransition();
  const [customizations, setCustomizations] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const increment = useCartStore((s) => s.increment);
  const router = useRouter();

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
      await addToCartAction(productId, 1, customizations);
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

      <div className="flex gap-3">
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
    </div>
  );
}
