"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { updateCustomRequestStatusAction } from "@/actions/products";
import type { CustomRequestStatus } from "@prisma/client";

interface Props {
  requestId: string;
  currentStatus: CustomRequestStatus;
}

const statusOptions: { value: CustomRequestStatus; label: string }[] = [
  { value: "SUBMITTED", label: "Submitted" },
  { value: "IN_REVIEW", label: "In Review" },
  { value: "QUOTED", label: "Quoted" },
  { value: "APPROVED", label: "Approved" },
  { value: "FULFILLED", label: "Fulfilled" },
  { value: "REJECTED", label: "Rejected" },
];

export function CustomRequestActions({ requestId, currentStatus }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as CustomRequestStatus;
    startTransition(async () => {
      await updateCustomRequestStatusAction(requestId, value);
      router.refresh();
    });
  };

  return (
    <div className="flex items-center gap-2 shrink-0">
      <select
        defaultValue={currentStatus}
        onChange={handleStatusChange}
        disabled={isPending}
        className="h-9 rounded-lg border border-input bg-background px-3 py-1 text-sm disabled:opacity-50"
      >
        {statusOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
    </div>
  );
}
