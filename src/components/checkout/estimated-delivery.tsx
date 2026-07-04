"use client";

import { useMemo } from "react";
import { estimateDeliveryDate, formatEstimatedDelivery } from "@/lib/delivery";
import { Truck } from "lucide-react";

export function EstimatedDelivery({
  deliveryOption,
  deliveryDate,
}: {
  deliveryOption: string;
  deliveryDate?: string;
}) {
  const estimate = useMemo(() => {
    const date = estimateDeliveryDate(deliveryOption, deliveryDate);
    return formatEstimatedDelivery(date);
  }, [deliveryOption, deliveryDate]);

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-primary/5 rounded-lg px-3 py-2 mt-2">
      <Truck className="h-4 w-4 text-primary shrink-0" />
      <span>{estimate}</span>
    </div>
  );
}
