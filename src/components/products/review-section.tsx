"use client";

import { useState } from "react";
import { ReviewForm } from "./review-form";
import { ReviewItem } from "./review-item";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

interface ReviewSectionProps {
  productId: string;
  reviews: {
    id: string;
    userId: string;
    rating: number;
    title: string | null;
    comment: string | null;
    user: { name: string | null; image: string | null };
  }[];
  isLoggedIn: boolean;
  userId?: string;
}

export function ReviewSection({
  productId,
  reviews,
  isLoggedIn,
  userId,
}: ReviewSectionProps) {
  const [showForm, setShowForm] = useState(false);

  return (
    <section className="mb-16">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Customer Reviews ({reviews.length})</h2>
        {isLoggedIn && !showForm && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowForm(true)}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Write a Review
          </Button>
        )}
      </div>

      {isLoggedIn && showForm && (
        <div className="mb-8">
          <ReviewForm
            productId={productId}
            onSuccess={() => setShowForm(false)}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {reviews.length === 0 ? (
        <p className="text-muted-foreground">No reviews yet. Be the first!</p>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
              <ReviewItem
                  key={review.id}
                  review={review}
                  isOwner={userId === review.userId}
                  productId={productId}
                />
          ))}
        </div>
      )}
    </section>
  );
}
