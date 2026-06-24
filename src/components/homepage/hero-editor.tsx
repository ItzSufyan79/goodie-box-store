"use client";

import { useState, useRef, useTransition } from "react";
import Image from "next/image";
import { Pencil, X, Save, Upload, Trash2 } from "lucide-react";
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setSelectedFile(null);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleSave = () => {
    startTransition(async () => {
      const payload = { ...form };
      if (preview && preview.startsWith("data:")) {
        payload.image = preview;
      }
      await updateHeroSettings(payload);
      setSelectedFile(null);
      setPreview(null);
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
          <Label>Hero Image</Label>
          <div className="mt-1">
            {(preview || form.image) && (
              <div className="relative aspect-video rounded-lg overflow-hidden mb-2 bg-muted">
                <Image
                  src={preview || form.image}
                  alt="Hero preview"
                  fill
                  className="object-cover"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7"
                  onClick={clearImage}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
            <label className="flex items-center justify-center gap-2 border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 cursor-pointer hover:border-primary/50 transition-colors">
              <Upload className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {preview || form.image ? "Change image" : "Upload hero image"}
              </span>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </label>
          </div>
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
