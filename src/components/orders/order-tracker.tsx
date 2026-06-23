"use client";

import { CheckCircle, Package, Truck, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  { key: "PENDING", label: "Placed", icon: Clock },
  { key: "PROCESSING", label: "Processing", icon: Package },
  { key: "SHIPPED", label: "Shipped", icon: Truck },
  { key: "DELIVERED", label: "Delivered", icon: CheckCircle },
];

const statusOrder = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED"];

interface OrderTrackerProps {
  status: string;
}

export function OrderTracker({ status }: OrderTrackerProps) {
  const currentIndex = statusOrder.indexOf(status);

  return (
    <div className="flex items-center justify-between max-w-md">
      {steps.map((step, i) => {
        const Icon = step.icon;
        const isComplete = i <= currentIndex;
        const isCurrent = i === currentIndex;

        return (
          <div key={step.key} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center",
                  isComplete
                    ? "bg-primary text-white"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span
                className={cn(
                  "text-xs mt-1",
                  isCurrent ? "font-medium text-primary" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-0.5 mx-1",
                  i < currentIndex ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
