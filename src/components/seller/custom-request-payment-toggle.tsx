"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateCustomRequestPaymentAction } from "@/actions/products";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface CustomRequestPaymentToggleProps {
  requestId: string;
  currentStatus: string;
}

const paymentLabels: Record<string, string> = {
  PENDING: "Unpaid",
  PAID: "Paid",
  FAILED: "Failed",
  REFUNDED: "Refunded",
};

const paymentColors: Record<string, "outline" | "secondary" | "default" | "destructive"> = {
  PENDING: "outline",
  PAID: "default",
  FAILED: "destructive",
  REFUNDED: "secondary",
};

export function CustomRequestPaymentToggle({
  requestId,
  currentStatus,
}: CustomRequestPaymentToggleProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const toggle = () => {
    const nextStatus = currentStatus === "PAID" ? "PENDING" : "PAID";
    startTransition(async () => {
      await updateCustomRequestPaymentAction(requestId, nextStatus);
      router.refresh();
    });
  };

  return (
    <div className="flex items-center gap-1">
      <Badge variant={paymentColors[currentStatus] ?? "outline"}>
        {paymentLabels[currentStatus] ?? currentStatus}
      </Badge>
      <Button
        size="sm"
        variant="ghost"
        className="h-6 px-1.5 text-xs"
        onClick={toggle}
        disabled={isPending}
      >
        {currentStatus === "PAID" ? "Unmark" : "Mark Paid"}
      </Button>
    </div>
  );
}
