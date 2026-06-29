"use client";

import { motion, useInView, useSpring, useTransform } from "framer-motion";
import { Gift, Heart, Users, Package, Truck, Award } from "lucide-react";
import { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/animations/scroll-reveal";
import { HoverExpand_001 } from "@/components/ui/skiper-ui/skiper52";
import { PageEditProvider, usePageEdit } from "@/components/admin/page-editor";
import { EditableText, EditableImage } from "@/components/admin/editable-fields";
import { EditPageOverlay } from "@/components/admin/edit-page-overlay";
import { getPageContent, updatePageContent } from "@/lib/actions/page-content";

const DEFAULT_CONTENT = {
  heroTitle: "About Goodie Box",
  heroSubtitle: "Curated gift boxes, college essentials, and snacks — delivered with love.",
  stats: [
    { value: 1000, suffix: "+", label: "Happy Customers" },
    { value: 50, suffix: "+", label: "Collections" },
    { value: 7, suffix: "", label: "Day Returns" },
    { value: 999, prefix: "₹", suffix: "+", label: "Free Shipping" },
  ],
  storyTitle: "Our Story",
  storyParagraphs: [
    "Goodie Box was born from a simple idea — thoughtful gifting should be easy, affordable, and delightful. We curate gift boxes for every occasion, from exam survival kits to birthday surprises, ensuring every box is packed with love.",
    "What started as a small college initiative has grown into a trusted destination for thousands of happy customers across India.",
  ],
  storyImage: "",
  galleryTitle: "Our Boxes in Action",
  gallerySubtitle: "Hover over each image to explore",
  galleryImages: [
    { src: "https://picsum.photos/seed/giftbox1/400/600", alt: "Gift box 1", code: "Birthday" },
    { src: "https://picsum.photos/seed/giftbox2/400/600", alt: "Gift box 2", code: "Exam Kit" },
    { src: "https://picsum.photos/seed/giftbox3/400/600", alt: "Gift box 3", code: "Anniversary" },
    { src: "https://picsum.photos/seed/giftbox4/400/600", alt: "Gift box 4", code: "Snack Box" },
    { src: "https://picsum.photos/seed/giftbox5/400/600", alt: "Gift box 5", code: "Custom" },
    { src: "https://picsum.photos/seed/giftbox6/400/600", alt: "Gift box 6", code: "Festival" },
    { src: "https://picsum.photos/seed/giftbox7/400/600", alt: "Gift box 7", code: "College" },
    { src: "https://picsum.photos/seed/giftbox8/400/600", alt: "Gift box 8", code: "Special" },
    { src: "https://picsum.photos/seed/giftbox9/400/600", alt: "Gift box 9", code: "Surprise" },
  ],
  valuesTitle: "Why Choose Us",
  valuesSubtitle: "Everything you need for the perfect gift",
  values: [
    { icon: "Heart", title: "Thoughtfully Curated", description: "Every box is handpicked with care to create memorable gifting experiences." },
    { icon: "Package", title: "Custom Requests", description: "Can't find what you're looking for? We'll build a custom box just for you." },
    { icon: "Truck", title: "Free Shipping", description: "Free delivery on orders over ₹999, with easy returns within 7 days." },
    { icon: "Users", title: "1000+ Happy Customers", description: "Trusted by customers across India for quality and timely delivery." },
    { icon: "Award", title: "Quality Guaranteed", description: "We stand behind every product. Your satisfaction is our priority." },
    { icon: "Gift", title: "Perfect for Every Occasion", description: "From birthdays to exams, we have the perfect box for every moment." },
  ],
  ctaTitle: "Ready to Find the Perfect Gift?",
  ctaSubtitle: "Browse our collections or make a custom request — we've got you covered.",
};

const ICON_MAP: Record<string, any> = { Gift, Heart, Users, Package, Truck, Award };

function AnimatedStat({ value: initialValue, prefix, suffix, label, onChange, editing }: {
  value: number; prefix?: string; suffix?: string; label: string;
  onChange?: (val: { value: number; label: string }) => void; editing?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const spring = useSpring(0, { stiffness: 50, damping: 20 });
  const display = useTransform(spring, (v) => `${prefix ?? ""}${Math.round(v)}${suffix ?? ""}`);
  if (inView) spring.set(initialValue);
  const [editLabel, setEditLabel] = useState(label);
  const [editValue, setEditValue] = useState(initialValue);
  useEffect(() => { setEditLabel(label); setEditValue(initialValue); }, [label, initialValue]);

  if (editing) {
    return (
      <div className="text-center space-y-2">
        <input
          type="number"
          value={editValue}
          onChange={(e) => setEditValue(Number(e.target.value))}
          onBlur={() => onChange?.({ value: editValue, label: editLabel })}
          className="w-24 mx-auto text-center text-4xl font-bold text-primary bg-transparent border-b-2 border-primary/40 focus:outline-none focus:border-primary"
        />
        <input
          value={editLabel}
          onChange={(e) => setEditLabel(e.target.value)}
          onBlur={() => onChange?.({ value: editValue, label: editLabel })}
          className="w-full text-center text-sm text-muted-foreground bg-transparent border-b border-dashed border-muted-foreground/30 focus:outline-none"
        />
      </div>
    );
  }

  return (
    <div ref={ref} className="text-center">
      <motion.div className="text-4xl font-bold text-primary">{display}</motion.div>
      <p className="text-sm text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

function ValueCard({ icon, title, description, onEdit, editing }: {
  icon: string; title: string; description: string;
  onEdit?: (val: { title: string; description: string }) => void; editing?: boolean;
}) {
  const Icon = ICON_MAP[icon] ?? Gift;
  const [editTitle, setEditTitle] = useState(title);
  const [editDesc, setEditDesc] = useState(description);
  useEffect(() => { setEditTitle(title); setEditDesc(description); }, [title, description]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5 }}
      className="group border rounded-2xl p-6 hover:shadow-lg hover:border-primary/20 transition-all relative"
    >
      <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      {editing ? (
        <div className="space-y-2">
          <input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={() => onEdit?.({ title: editTitle, description: editDesc })}
            className="w-full font-semibold bg-transparent border-b border-dashed border-primary/40 focus:outline-none focus:border-primary"
          />
          <textarea
            value={editDesc}
            onChange={(e) => setEditDesc(e.target.value)}
            onBlur={() => onEdit?.({ title: editTitle, description: editDesc })}
            rows={2}
            className="w-full text-sm text-muted-foreground bg-transparent border border-dashed border-muted-foreground/20 rounded p-1 focus:outline-none focus:border-primary"
          />
        </div>
      ) : (
        <>
          <h3 className="font-semibold mb-2">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </>
      )}
    </motion.div>
  );
}

function AboutContentInner() {
  const { isEditing } = usePageEdit();
  const [saving, setSaving] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [content, setContent] = useState(DEFAULT_CONTENT);

  useEffect(() => {
    getPageContent("about-page").then((saved) => {
      if (saved) {
        const merged: any = { ...DEFAULT_CONTENT, ...saved };
        if (saved.stats) merged.stats = saved.stats;
        if (saved.values) merged.values = saved.values;
        if (saved.galleryImages) merged.galleryImages = saved.galleryImages;
        setContent(merged);
      }
      setInitialLoaded(true);
    });
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await updatePageContent("about-page", content);
    } finally {
      setSaving(false);
    }
  }, [content]);

  const update = useCallback((path: string, val: any) => {
    setContent((prev) => {
      const next = structuredClone(prev);
      const keys = path.split(".");
      let obj: any = next;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = val;
      return next;
    });
  }, []);

  if (!initialLoaded) return null;

  return (
    <div className="min-h-screen">
      <EditPageOverlay onSave={handleSave} saving={saving} />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-primary/5 py-24">
        <div className="container mx-auto px-4 text-center">
          <EditableText
            value={content.heroTitle}
            onChange={(v) => update("heroTitle", v)}
            as="h1"
            className="text-4xl md:text-5xl font-bold mb-4"
          />
          <EditableText
            value={content.heroSubtitle}
            onChange={(v) => update("heroSubtitle", v)}
            as="p"
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
          />
          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto"
          >
            {content.stats.map((stat, i) => (
              <AnimatedStat
                key={i}
                value={stat.value}
                prefix={stat.prefix}
                suffix={stat.suffix}
                label={stat.label}
                editing={isEditing}
                onChange={(v) => {
                  const next = [...content.stats];
                  next[i] = { ...next[i], value: v.value, label: v.label };
                  update("stats", next);
                }}
              />
            ))}
          </motion.div>
        </div>
      </section>

      {/* Our Story */}
      <ScrollReveal direction="left" className="container mx-auto px-4 py-20 max-w-4xl">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-4">
            <EditableText
              value={content.storyTitle}
              onChange={(v) => update("storyTitle", v)}
              as="h2"
              className="text-3xl font-bold"
            />
            {content.storyParagraphs.map((p, i) => (
              <EditableText
                key={i}
                value={p}
                onChange={(v) => {
                  const next = [...content.storyParagraphs];
                  next[i] = v;
                  update("storyParagraphs", next);
                }}
                className="text-muted-foreground leading-relaxed"
              />
            ))}
          </div>
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <EditableImage
              src={content.storyImage}
              alt="Our story"
              onChange={(src) => update("storyImage", src)}
              className="size-full object-cover"
              fallback={<Gift className="h-32 w-32 text-primary/40" />}
            />
          </div>
        </div>
      </ScrollReveal>

      {/* Gallery */}
      <section className="py-20 bg-muted/20">
        <ScrollReveal className="container mx-auto px-4 text-center mb-12 space-y-2">
          <EditableText
            value={content.galleryTitle}
            onChange={(v) => update("galleryTitle", v)}
            as="h2"
            className="text-3xl font-bold"
          />
          <EditableText
            value={content.gallerySubtitle}
            onChange={(v) => update("gallerySubtitle", v)}
            className="text-muted-foreground"
          />
        </ScrollReveal>
        <div className="flex justify-center">
          <EditableGallery
            images={content.galleryImages}
            editing={isEditing}
            onChange={(images) => update("galleryImages", images)}
          />
        </div>
      </section>

      {/* Values */}
      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <ScrollReveal className="text-center mb-12 space-y-2">
            <EditableText
              value={content.valuesTitle}
              onChange={(v) => update("valuesTitle", v)}
              as="h2"
              className="text-3xl font-bold"
            />
            <EditableText
              value={content.valuesSubtitle}
              onChange={(v) => update("valuesSubtitle", v)}
              className="text-muted-foreground"
            />
          </ScrollReveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {content.values.map((v, i) => (
              <ValueCard
                key={i}
                icon={v.icon}
                title={v.title}
                description={v.description}
                editing={isEditing}
                onEdit={(val) => {
                  const next = [...content.values];
                  next[i] = { ...next[i], ...val };
                  update("values", next);
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <ScrollReveal className="container mx-auto px-4 text-center space-y-4">
          <EditableText
            value={content.ctaTitle}
            onChange={(v) => update("ctaTitle", v)}
            as="h2"
            className="text-3xl font-bold"
          />
          <EditableText
            value={content.ctaSubtitle}
            onChange={(v) => update("ctaSubtitle", v)}
            className="text-muted-foreground max-w-xl mx-auto"
          />
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/collections">Browse Collections</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/custom-request">Custom Request</Link>
            </Button>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}

function EditableGallery({ images, editing, onChange }: {
  images: { src: string; alt: string; code: string }[];
  editing: boolean;
  onChange: (images: { src: string; alt: string; code: string }[]) => void;
}) {
  const [activeImage, setActiveImage] = useState<number | null>(null);

  if (editing) {
    return (
      <div className="w-full max-w-6xl px-5 space-y-4">
        <p className="text-sm text-muted-foreground text-center">
          Click image URL to edit. Press Enter to confirm.
        </p>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
          {images.map((img, i) => (
            <div key={i} className="relative group">
              <div className="aspect-[2/3] rounded-xl overflow-hidden bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.src} alt={img.alt} className="size-full object-cover" />
              </div>
              <div className="mt-1 space-y-1">
                <input
                  defaultValue={img.code}
                  onBlur={(e) => {
                    const next = [...images];
                    next[i] = { ...next[i], code: e.target.value };
                    onChange(next);
                  }}
                  className="w-full text-xs text-center bg-transparent border-b border-dashed border-primary/30 focus:outline-none focus:border-primary"
                />
                <button
                  onClick={() => setActiveImage(activeImage === i ? null : i)}
                  className="text-[10px] text-primary underline underline-offset-2 hover:text-primary/80"
                >
                  {activeImage === i ? "done" : "edit url"}
                </button>
                {activeImage === i && (
                  <input
                    defaultValue={img.src}
                    onBlur={(e) => {
                      const next = [...images];
                      next[i] = { ...next[i], src: e.target.value };
                      onChange(next);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const next = [...images];
                        next[i] = { ...next[i], src: (e.target as HTMLInputElement).value };
                        onChange(next);
                        setActiveImage(null);
                      }
                    }}
                    className="w-full text-[10px] bg-muted rounded p-1 focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Image URL..."
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return <HoverExpand_001 images={images} />;
}

export function AboutContent() {
  return (
    <PageEditProvider>
      <AboutContentInner />
    </PageEditProvider>
  );
}
