"use client";

import { useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";

interface GalleryPhoto {
  id: string;
  url: string;
  alt?: string | null;
  isPrimary: boolean;
}

interface ImageGalleryProps {
  photos: GalleryPhoto[];
  title: string;
  discount: number;
}

export function ImageGallery({ photos, title, discount }: ImageGalleryProps) {
  const [selected, setSelected] = useState<string>(
    photos.find((p) => p.isPrimary)?.url ?? photos[0]?.url ?? ""
  );

  const current = photos.find((p) => p.url === selected) ?? photos[0];

  return (
    <div className="space-y-4">
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted group">
        {current ? (
          <Image
            src={current.url}
            alt={current.alt ?? title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No image available
          </div>
        )}
        {discount > 0 && (
          <Badge variant="sale" className="absolute top-4 left-4 text-sm">
            {discount}% OFF
          </Badge>
        )}
      </div>
      {photos.length > 1 && (
        <div className="grid grid-cols-5 gap-2 sm:gap-3">
          {photos.map((photo) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => setSelected(photo.url)}
              className={`relative aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer transition-all ${
                selected === photo.url
                  ? "ring-2 ring-primary ring-offset-2"
                  : "hover:ring-2 hover:ring-primary/50 hover:ring-offset-1"
              }`}
            >
              <Image
                src={photo.url}
                alt={photo.alt ?? title}
                fill
                className="object-cover"
                sizes="100px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
