"use client";

import { useState, useTransition } from "react";
import { Star, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReviewEditForm } from "./review-edit-form";
import { deleteReviewAction } from "@/actions/products";
import type { ReviewInput } from "@/lib/validations";

interface ReviewItemProps {
  review: {
    id: string;
    userId: string;
    rating: number;
    title: string | null;
    comment: string | null;
    user: { name: string | null; image: string | null };
  };
  isOwner: boolean;
  productId: string;
}

export function ReviewItem({ review, isOwner, productId }: ReviewItemProps) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm("Are you sure you want to delete this review?")) return;
    startTransition(async () => {
      await deleteReviewAction(review.id);
      window.location.reload();
    });
  };

  if (editing) {
    return (
      <ReviewEditForm
        productId={productId}
        review={{ id: review.id, rating: review.rating, title: review.title ?? undefined, comment: review.comment ?? undefined }}
        onCancel={() => setEditing(false)}
        onDone={() => { setEditing(false); window.location.reload(); }}
      />
    );
  }

  return (
    <div className="border rounded-xl p-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i < review.rating
                    ? "fill-amber-400 text-amber-400"
                    : "text-muted"
                }`}
              />
            ))}
          </div>
          <span className="font-medium">{review.user.name}</span>
        </div>
        {isOwner && (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setEditing(true)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      {review.title && (
        <p className="font-semibold mb-1">{review.title}</p>
      )}
      {review.comment && (
        <p className="text-muted-foreground">{review.comment}</p>
      )}
    </div>
  );
}
