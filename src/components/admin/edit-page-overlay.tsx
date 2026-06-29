"use client";

import { useSession } from "next-auth/react";
import { Pencil, PencilOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePageEdit } from "@/components/admin/page-editor";

interface EditPageOverlayProps {
  onSave: () => Promise<void>;
  saving: boolean;
}

export function EditPageOverlay({ onSave, saving }: EditPageOverlayProps) {
  const { data: session } = useSession();
  const { isEditing, toggleEditing } = usePageEdit();

  const canEdit = session?.user && ["SELLER", "ADMIN"].includes(session.user.role);
  if (!canEdit) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2">
      {isEditing && (
        <>
          <Button
            size="sm"
            variant="outline"
            onClick={() => { toggleEditing(); }}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={onSave}
            disabled={saving}
          >
            {saving && <Loader2 className="size-4 mr-1 animate-spin" />}
            Save Changes
          </Button>
        </>
      )}
      <Button
        size="icon"
        variant={isEditing ? "default" : "secondary"}
        onClick={toggleEditing}
        className="size-10 rounded-full shadow-lg"
      >
        {isEditing ? <PencilOff className="size-4" /> : <Pencil className="size-4" />}
      </Button>
    </div>
  );
}
