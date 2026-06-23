"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { deleteCategoryAction } from "@/actions/products";
import type { Prisma } from "@prisma/client";

type CategoryWithChildren = Prisma.CategoryGetPayload<{
  include: { children: true };
}>;

interface SellerCategoryManagerProps {
  categories: CategoryWithChildren[];
}

export function SellerCategoryManager({ categories }: SellerCategoryManagerProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Delete category "${name}"? Products in this category will lose their category assignment.`)) return;
    startTransition(async () => {
      await deleteCategoryAction(id);
      router.refresh();
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Categories</CardTitle>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">No categories yet.</p>
        ) : (
          <div className="space-y-2">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <div>
                  <p className="font-medium text-sm">{cat.name}</p>
                  {cat.children.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {cat.children.length} sub-categor{cat.children.length === 1 ? "y" : "ies"}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive shrink-0"
                  onClick={() => handleDelete(cat.id, cat.name)}
                  disabled={isPending}
                  aria-label={`Delete category ${cat.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
