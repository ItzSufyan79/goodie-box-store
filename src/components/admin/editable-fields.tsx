"use client";

import { useRef, useEffect, useState, useTransition, type ElementType } from "react";
import { Pencil, Upload, Loader2 } from "lucide-react";
import { usePageEdit } from "@/components/admin/page-editor";
import { uploadPageImage } from "@/lib/actions/upload-image";

interface EditableTextProps {
  value: string;
  onChange: (val: string) => void;
  as?: ElementType;
  className?: string;
}

export function EditableText({ value, onChange, as: Tag = "p", className }: EditableTextProps) {
  const { isEditing } = usePageEdit();
  const [editing, setEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [editing]);

  if (editing) {
    return (
      <div className="relative">
        <textarea
          ref={textareaRef}
          defaultValue={value}
          onBlur={(e) => {
            onChange(e.target.value);
            setEditing(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              onChange((e.target as HTMLTextAreaElement).value);
              setEditing(false);
            }
          }}
          className="w-full rounded-lg border-2 border-primary/40 bg-background p-2 text-sm focus:outline-none focus:border-primary min-h-[60px]"
          rows={3}
        />
        <span className="absolute -top-3 left-2 text-[10px] text-muted-foreground bg-background px-1">
          Press Esc or click outside to save
        </span>
      </div>
    );
  }

  return (
    <div className="group relative">
      <Tag className={className}>{value}</Tag>
      {isEditing && (
        <button
          onClick={() => setEditing(true)}
          className="absolute -top-2 -right-2 size-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
        >
          <Pencil className="size-3" />
        </button>
      )}
    </div>
  );
}

interface EditableImageProps {
  src: string;
  alt: string;
  onChange: (src: string) => void;
  className?: string;
  fallback?: React.ReactNode;
}

export function EditableImage({ src, alt, onChange, className, fallback }: EditableImageProps) {
  const { isEditing } = usePageEdit();
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    startTransition(async () => {
      const url = await uploadPageImage(formData);
      onChange(url);
    });
  };

  return (
    <div className="group relative">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className={className} />
      ) : (
        fallback
      )}
      {isEditing && (
        <div className="absolute top-2 right-2 flex gap-1">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={isPending}
            className="size-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-sm hover:bg-primary/90 transition-colors"
          >
            {isPending ? <Loader2 className="size-3 animate-spin" /> : <Upload className="size-3" />}
          </button>
          {src && (
            <button
              onClick={() => onChange("")}
              className="size-7 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-sm hover:bg-destructive/90 transition-colors text-xs"
            >
              ✕
            </button>
          )}
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
