"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatusAction } from "@/actions/orders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SellerOrderActionsProps {
  orderId: string;
  currentStatus: string;
  paymentStatus: string;
}

export function SellerOrderActions({
  orderId,
  currentStatus,
  paymentStatus,
}: SellerOrderActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [tracking, setTracking] = useState("");
  const [status, setStatus] = useState(currentStatus);

  const updateStatus = (newStatus: "PROCESSING" | "SHIPPED" | "DELIVERED") => {
    setStatus(newStatus);
    startTransition(async () => {
      await updateOrderStatusAction(orderId, newStatus, tracking || undefined);
      router.refresh();
    });
  };

  if (status === "DELIVERED" || status === "CANCELLED") {
    return null;
  }

  return (
    <div className="flex gap-1">
      {status === "PENDING" && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => updateStatus("PROCESSING")}
          disabled={isPending || paymentStatus !== "PAID"}
          title={paymentStatus !== "PAID" ? "Payment not received yet" : undefined}
        >
          Process
        </Button>
      )}
      {status === "PROCESSING" && (
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
      {status === "SHIPPED" && (
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
