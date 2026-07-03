"use client";

import { useActionState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clearUnpaidOrdersAction } from "@/actions/orders";

export function ClearUnpaidButton({ count }: { count: number }) {
  const [state, formAction, pending] = useActionState(
    clearUnpaidOrdersAction,
    null,
  );

  if (count === 0) return null;

  return (
    <form action={formAction} className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">
        {count} unpaid
      </span>
      <Button
        type="submit"
        size="sm"
        variant="outline"
        className="gap-1.5 text-destructive"
        disabled={pending}
      >
        <Trash2 className="h-3.5 w-3.5" />
        {pending ? "Clearing..." : "Clear all"}
      </Button>
      {state?.count !== undefined && (
        <span className="text-xs text-muted-foreground">
          Removed {state.count}
        </span>
      )}
    </form>
  );
}
