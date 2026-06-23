"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { reviewSchema, type ReviewInput } from "@/lib/validations";
import { createReviewAction } from "@/actions/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ReviewFormProps {
  productId: string;
  className?: string;
}

export function ReviewForm({ productId, className }: ReviewFormProps) {
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 5 },
  });

  const onSubmit = (data: ReviewInput) => {
    startTransition(async () => {
      const result = await createReviewAction(productId, data);
      if (result.success) {
        reset();
        window.location.reload();
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn("border rounded-xl p-6 space-y-4", className)}
    >
      <h3 className="font-semibold">Write a Review</h3>
      <div>
        <Label htmlFor="rating">Rating</Label>
        <select
          id="rating"
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
        <Label htmlFor="title">Title (optional)</Label>
        <Input id="title" {...register("title")} className="mt-1" />
      </div>
      <div>
        <Label htmlFor="comment">Review</Label>
        <textarea
          id="comment"
          {...register("comment")}
          rows={3}
          className="mt-1 flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
        />
        {errors.comment && (
          <p className="text-sm text-destructive mt-1">
            {errors.comment.message}
          </p>
        )}
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Submitting..." : "Submit Review"}
      </Button>
    </form>
  );
}
