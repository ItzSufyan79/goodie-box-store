"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatusAction, markOrderPaidAction } from "@/actions/orders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SellerOrderActionsProps {
  orderId: string;
  currentStatus: string;
  paymentStatus: string;
  paymentProvider?: string;
}

export function SellerOrderActions({
  orderId,
  currentStatus,
  paymentStatus,
  paymentProvider,
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

  const markPaid = () => {
    startTransition(async () => {
      await markOrderPaidAction(orderId);
      router.refresh();
    });
  };

  const isCodDelivered = status === "DELIVERED" && paymentProvider === "COD" && paymentStatus !== "PAID";

  if (status === "CANCELLED" || (status === "DELIVERED" && !isCodDelivered)) {
    return null;
  }

  const canProcess = paymentStatus === "PAID" || paymentProvider === "COD";

  if (isCodDelivered) {
    return (
      <Button
        size="sm"
        variant="default"
        onClick={markPaid}
        disabled={isPending}
      >
        Mark Paid
      </Button>
    );
  }

  return (
    <div className="flex gap-1">
      {status === "PENDING" && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => updateStatus("PROCESSING")}
          disabled={isPending || !canProcess}
          title={
            !canProcess
              ? "Payment not received yet"
              : paymentProvider === "COD"
                ? "Process COD order"
                : undefined
          }
        >
          Process
        </Button>
      )}
      {status === "PROCESSING" && (
        <div className="flex items-center gap-1">
          <Input
            placeholder="Tracking (optional)"
            className="h-7 w-24 text-xs"
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => updateStatus("SHIPPED")}
            disabled={isPending}
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
