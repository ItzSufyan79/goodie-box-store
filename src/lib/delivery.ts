function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    if (result.getDay() !== 0 && result.getDay() !== 6) added++;
  }
  return result;
}

const DELIVERY_TIMELINES: Record<string, number> = {
  URGENT: 2,
  STANDARD: 4,
  FLEXIBLE: 7,
};

export function estimateDeliveryDate(deliveryOption: string, preferredDate?: string): Date {
  if (deliveryOption === "FLEXIBLE" && preferredDate) {
    return new Date(preferredDate);
  }
  const days = DELIVERY_TIMELINES[deliveryOption] ?? 4;
  return addBusinessDays(new Date(), days);
}

export function formatEstimatedDelivery(date: Date): string {
  const now = new Date();
  const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const options: Intl.DateTimeFormatOptions = {
    weekday: "short",
    month: "short",
    day: "numeric",
  };
  const formatted = date.toLocaleDateString("en-IN", options);

  if (diff <= 0) return `Arrives today`;
  if (diff === 1) return `Arrives tomorrow (${formatted})`;
  return `Arrives by ${formatted}`;
}

export function getDueDateLabel(date: Date): { label: string; urgency: "urgent" | "soon" | "later" } {
  const now = new Date();
  const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff <= 2) return { label: "Due Soon", urgency: "urgent" };
  if (diff <= 7) return { label: "Due This Week", urgency: "soon" };
  return { label: "Due Later", urgency: "later" };
}

export const deliveryLabels: Record<string, string> = {
  URGENT: "Urgent",
  STANDARD: "Standard",
  FLEXIBLE: "Flexible",
};
