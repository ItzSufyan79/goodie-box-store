"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Power, PowerOff, Edit3, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  createCollectionAction,
  updateCollectionAction,
  deleteCollectionAction,
  toggleCollectionAction,
} from "@/actions/collections";

interface CollectionProduct {
  product: { title: string };
}

interface Collection {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  image: string | null;
  type: string;
  occasion: string | null;
  isActive: boolean;
  sortOrder: number;
  products: CollectionProduct[];
}

interface Props {
  collections: Collection[];
}

const typeLabels: Record<string, string> = {
  GIFT_GUIDE: "Gift Guide",
  CURATED: "Curated",
  OCCASION: "Occasion",
};

export function CollectionManager({ collections }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Collection | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const data = {
      title: form.get("title") as string,
      description: form.get("description") as string,
      image: form.get("image") as string,
      type: form.get("type") as "GIFT_GUIDE" | "CURATED" | "OCCASION",
      occasion: form.get("occasion") as string,
      sortOrder: Number(form.get("sortOrder")) || 0,
    };

    startTransition(async () => {
      if (editing) {
        await updateCollectionAction(editing.id, data);
      } else {
        await createCollectionAction(data);
      }
      setShowForm(false);
      setEditing(null);
      router.refresh();
    });
  }

  function startEdit(c: Collection) {
    setEditing(c);
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditing(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => { cancelForm(); setShowForm(!showForm); }}>
          {showForm ? <><X className="h-4 w-4 mr-2" />Cancel</> : <><Plus className="h-4 w-4 mr-2" />New Collection</>}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editing ? "Edit Collection" : "Create Collection"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" required defaultValue={editing?.title ?? ""} />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" name="description" defaultValue={editing?.description ?? ""} />
              </div>
              <div>
                <Label htmlFor="image">Image URL</Label>
                <Input id="image" name="image" defaultValue={editing?.image ?? ""} />
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <select id="type" name="type" defaultValue={editing?.type ?? "CURATED"} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="GIFT_GUIDE">Gift Guide</option>
                  <option value="CURATED">Curated</option>
                  <option value="OCCASION">Occasion</option>
                </select>
              </div>
              <div>
                <Label htmlFor="occasion">Occasion (for Occasion type)</Label>
                <Input id="occasion" name="occasion" defaultValue={editing?.occasion ?? ""} />
              </div>
              <div>
                <Label htmlFor="sortOrder">Sort Order</Label>
                <Input id="sortOrder" name="sortOrder" type="number" defaultValue={editing?.sortOrder ?? 0} />
              </div>
              <div className="sm:col-span-2 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={cancelForm}>Cancel</Button>
                <Button type="submit" disabled={isPending}>{editing ? "Update" : "Create"}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {collections.length === 0 && (
          <p className="text-muted-foreground text-center py-12">No collections yet. Create one!</p>
        )}
        {collections.map((c) => (
          <Card key={c.id}>
            <CardContent className="flex items-center justify-between py-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{c.title}</span>
                  <Badge variant={c.isActive ? "success" : "secondary"}>
                    {c.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <Badge variant="outline">{typeLabels[c.type] ?? c.type}</Badge>
                </div>
                <div className="text-xs text-muted-foreground space-x-4">
                  <span>/{c.slug}</span>
                  {c.occasion && <span>Occasion: {c.occasion}</span>}
                  <span>Sort: {c.sortOrder}</span>
                  <span>{c.products.length} products</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => startEdit(c)} disabled={isPending}>
                  <Edit3 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => startTransition(async () => { await toggleCollectionAction(c.id, !c.isActive); router.refresh(); })} disabled={isPending}>
                  {c.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => { if (confirm(`Delete "${c.title}"?`)) startTransition(async () => { await deleteCollectionAction(c.id); router.refresh(); }); }} disabled={isPending}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
