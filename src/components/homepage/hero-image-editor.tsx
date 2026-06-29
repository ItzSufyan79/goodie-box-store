"use client";

import { useRef, useTransition } from "react";
import Image from "next/image";
import { Camera } from "lucide-react";
import { updateHeroSettings } from "@/actions/settings";
import type { HeroSettings } from "@/actions/settings";

interface HeroImageEditorProps {
  src: string;
  alt: string;
  settings: HeroSettings;
}

export function HeroImageEditor({ src, alt, settings }: HeroImageEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      startTransition(async () => {
        await updateHeroSettings({ ...settings, image: base64 });
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="relative aspect-square rounded-3xl overflow-hidden shadow-2xl group/image">
      <Image src={src} alt={alt} fill className="object-cover" priority />
      <div
        className="absolute inset-0 bg-black/0 group-hover/image:bg-black/20 transition-colors cursor-pointer flex items-center justify-center"
        onClick={() => inputRef.current?.click()}
      >
        <div className="opacity-0 group-hover/image:opacity-100 transition-opacity bg-white/90 text-foreground rounded-full p-3 shadow-lg">
          <Camera className="h-5 w-5" />
        </div>
      </div>
      {isPending && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-3xl">
          <div className="animate-spin h-8 w-8 border-4 border-white border-t-transparent rounded-full" />
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
}
