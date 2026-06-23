"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clearAllSellerDataAction } from "@/actions/products";

interface ClearAllButtonProps {
  hasProducts: boolean;
}

export function ClearAllButton({ hasProducts }: ClearAllButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleClearAll = () => {
    if (
      !confirm(
        "ARE YOU SURE? This will permanently delete ALL your products, reviews, and unused categories. This cannot be undone."
      )
    )
      return;
    if (
      !confirm(
        "Final confirmation: Delete everything and start fresh?"
      )
    )
      return;

    startTransition(async () => {
      await clearAllSellerDataAction();
      router.refresh();
    });
  };

  return (
    <Button
      variant="destructive"
      onClick={handleClearAll}
      disabled={isPending || !hasProducts}
      className="w-full"
    >
      {isPending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Clearing...
        </>
      ) : (
        <>
          <Trash2 className="mr-2 h-4 w-4" />
          Clear All Products & Categories
        </>
      )}
    </Button>
  );
}
