import { ShieldCheck } from "lucide-react";

export function MoneyBackBadge({ className }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 ${className ?? ""}`}
    >
      <ShieldCheck className="h-3.5 w-3.5" />
      7-Day Money-Back Guarantee
    </span>
  );
}
