"use client";

import { useState, useTransition } from "react";
import { Pencil, X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateHeroSettings } from "@/actions/settings";
import type { HeroSettings } from "@/actions/settings";

interface HeroEditorProps {
  settings: HeroSettings;
}

export function HeroEditor({ settings }: HeroEditorProps) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({ ...settings });

  const handleSave = () => {
    startTransition(async () => {
      await updateHeroSettings(form);
      setEditing(false);
    });
  };

  if (!editing) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => setEditing(true)}
      >
        <Pencil className="h-4 w-4 mr-1" />
        Edit Cover
      </Button>
    );
  }

  return (
    <div className="absolute inset-0 z-20 bg-background/95 backdrop-blur-sm p-6 overflow-y-auto">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Edit Hero Section</h3>
          <Button variant="ghost" size="icon" onClick={() => setEditing(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div>
          <Label>Badge Text</Label>
          <Input value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} />
        </div>
        <div>
          <Label>Heading</Label>
          <Input value={form.heading} onChange={(e) => setForm({ ...form, heading: e.target.value })} />
        </div>
        <div>
          <Label>Heading Highlight</Label>
          <Input value={form.headingHighlight} onChange={(e) => setForm({ ...form, headingHighlight: e.target.value })} />
        </div>
        <div>
          <Label>Subtitle</Label>
          <textarea
            value={form.subtitle}
            onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
            rows={3}
            className="mt-1 flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <Label>Image URL</Label>
          <Input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
        </div>
        <div>
          <Label>Stat Number</Label>
          <Input value={form.statNumber} onChange={(e) => setForm({ ...form, statNumber: e.target.value })} />
        </div>
        <div>
          <Label>Stat Label</Label>
          <Input value={form.statLabel} onChange={(e) => setForm({ ...form, statLabel: e.target.value })} />
        </div>

        <Button onClick={handleSave} disabled={isPending} className="w-full">
          <Save className="h-4 w-4 mr-1" />
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
