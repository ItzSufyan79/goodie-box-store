"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatusAction } from "@/actions/orders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SellerOrderActionsProps {
  orderId: string;
  currentStatus: string;
}

export function SellerOrderActions({
  orderId,
  currentStatus,
}: SellerOrderActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [tracking, setTracking] = useState("");

  const updateStatus = (status: "PROCESSING" | "SHIPPED" | "DELIVERED") => {
    startTransition(async () => {
      await updateOrderStatusAction(orderId, status, tracking || undefined);
      router.refresh();
    });
  };

  if (currentStatus === "DELIVERED" || currentStatus === "CANCELLED") {
    return null;
  }

  return (
    <div className="flex gap-1">
      {currentStatus === "PENDING" && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => updateStatus("PROCESSING")}
          disabled={isPending}
        >
          Process
        </Button>
      )}
      {currentStatus === "PROCESSING" && (
        <div className="flex items-center gap-1">
          <Input
            placeholder="Tracking #"
            className="h-7 w-24 text-xs"
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => updateStatus("SHIPPED")}
            disabled={isPending || !tracking.trim()}
          >
            Ship
          </Button>
        </div>
      )}
      {currentStatus === "SHIPPED" && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => updateStatus("DELIVERED")}
          disabled={isPending}
        >
          Deliver
        </Button>
      )}
    </div>
  );
}
