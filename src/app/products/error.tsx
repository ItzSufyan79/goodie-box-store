"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ProductsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Products page error:", error);
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h2 className="text-2xl font-bold mb-4">Failed to load products</h2>
      <p className="text-muted-foreground mb-8">
        {error.message || "Something went wrong while fetching products."}
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
