"use client";

import { useActionState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteOrderAction } from "@/actions/orders";

export function DeleteOrderButton({ orderItemId }: { orderItemId: string }) {
  const [state, formAction, pending] = useActionState(
    deleteOrderAction.bind(null, orderItemId),
    null,
  );

  return (
    <form action={formAction}>
      <Button
        type="submit"
        size="sm"
        variant="ghost"
        className="h-7 w-7 text-destructive hover:text-destructive"
        disabled={pending}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      {state?.error && (
        <p className="text-xs text-destructive mt-1">{state.error}</p>
      )}
    </form>
  );
}
