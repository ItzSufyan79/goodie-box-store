"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { reviewSchema, type ReviewInput } from "@/lib/validations";
import { updateReviewAction } from "@/actions/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ReviewEditFormProps {
  productId: string;
  review: {
    id: string;
    rating: number;
    title?: string;
    comment?: string;
  };
  onCancel: () => void;
  onDone: () => void;
  className?: string;
}

export function ReviewEditForm({ productId, review, onCancel, onDone, className }: ReviewEditFormProps) {
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: review.rating, title: review.title, comment: review.comment },
  });

  const onSubmit = (data: ReviewInput) => {
    startTransition(async () => {
      const result = await updateReviewAction(review.id, data);
      if (result.success) onDone();
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn("border rounded-xl p-6 space-y-4", className)}
    >
      <h3 className="font-semibold">Edit Your Review</h3>
      <div>
        <Label htmlFor="edit-rating">Rating</Label>
        <select
          id="edit-rating"
          {...register("rating")}
          className="mt-1 flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
        >
          {[5, 4, 3, 2, 1].map((r) => (
            <option key={r} value={r}>
              {r} Star{r !== 1 ? "s" : ""}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="edit-title">Title (optional)</Label>
        <Input id="edit-title" {...register("title")} className="mt-1" />
      </div>
      <div>
        <Label htmlFor="edit-comment">Review</Label>
        <textarea
          id="edit-comment"
          {...register("comment")}
          rows={3}
          className="mt-1 flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
        />
        {errors.comment && (
          <p className="text-sm text-destructive mt-1">{errors.comment.message}</p>
        )}
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
