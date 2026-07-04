"use client";

import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";

interface SizeOption {
  id: string;
  label: string;
  price: number;
}

interface SizeSelectorProps {
  sizes: SizeOption[];
  selectedSizeId: string | null;
  onChange: (sizeId: string) => void;
}

export function SizeSelector({ sizes, selectedSizeId, onChange }: SizeSelectorProps) {
  if (sizes.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold">Size</p>
      <div className="grid grid-cols-2 gap-2">
        {sizes.map((size) => (
          <button
            key={size.id}
            type="button"
            onClick={() => onChange(size.id)}
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-lg border-2 px-3 py-2.5 text-sm transition-colors",
              selectedSizeId === size.id
                ? "border-primary bg-primary/5 text-primary"
                : "border-muted-foreground/20 hover:border-muted-foreground/40"
            )}
          >
            <span className="font-medium">{size.label}</span>
            <span className="text-xs text-muted-foreground">{formatPrice(size.price)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
