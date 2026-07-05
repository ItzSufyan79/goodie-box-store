"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Clock, AlertTriangle, X } from "lucide-react";
import { updateOrderStatusAction, markOrderPaidAction, delayOrderAction } from "@/actions/orders";
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
  const [showDelayForm, setShowDelayForm] = useState(false);
  const [delayReason, setDelayReason] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (showDelayForm) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [showDelayForm]);

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

  const handleDelay = () => {
    if (!delayReason.trim()) return;
    setShowDelayForm(false);
    startTransition(async () => {
      await delayOrderAction(orderId, delayReason);
      setStatus("DELAYED");
      router.refresh();
    });
  };

  const isCodDelivered = status === "DELIVERED" && paymentProvider === "COD" && paymentStatus !== "PAID";

  if (status === "CANCELLED" || (status === "DELIVERED" && !isCodDelivered)) {
    return null;
  }

  const canProcess = paymentStatus === "PAID" || paymentProvider === "COD";
  const canDelay = status === "PENDING" || status === "PROCESSING";

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
    <>
      {showDelayForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowDelayForm(false)}>
          <div className="bg-background rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Delay Order</h3>
              <button onClick={() => setShowDelayForm(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Mark this order as delayed and notify the customer with a reason.
            </p>
            <textarea
              ref={textareaRef}
              value={delayReason}
              onChange={(e) => setDelayReason(e.target.value)}
              placeholder="e.g. Waiting for materials, custom work in progress..."
              rows={3}
              className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-y mb-4"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDelayForm(false)}>
                Cancel
              </Button>
              <Button onClick={handleDelay} disabled={!delayReason.trim() || isPending}>
                {isPending ? "Delaying..." : "Confirm Delay"}
              </Button>
            </div>
          </div>
        </div>
      )}
      <div className="flex gap-1 flex-wrap">
        {status === "DELAYED" && (
          <div className="flex items-center gap-1 w-full">
            <span className="text-xs text-amber-600 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> Delayed
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => updateStatus("PROCESSING")}
              disabled={isPending}
            >
              Resume
            </Button>
          </div>
        )}
        {canDelay && (
          <Button size="sm" variant="outline" className="text-amber-600 border-amber-300" onClick={() => setShowDelayForm(true)}>
            <Clock className="h-3 w-3 mr-1" /> Delay
          </Button>
        )}
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
    </>
  );
}
