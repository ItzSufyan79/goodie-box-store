"use client";

import { motion, useInView, useSpring, useTransform } from "framer-motion";
import { Gift, Heart, Users, Package, Truck, Award } from "lucide-react";
import { useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/animations/scroll-reveal";
import { HoverExpand_001 } from "@/components/ui/skiper-ui/skiper52";

function AnimatedStat({ value, prefix, suffix, label }: { value: number; prefix?: string; suffix?: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const spring = useSpring(0, { stiffness: 50, damping: 20 });
  const display = useTransform(spring, (v) => `${prefix ?? ""}${Math.round(v)}${suffix ?? ""}`);

  if (inView) spring.set(value);

  return (
    <div ref={ref} className="text-center">
      <motion.div className="text-4xl font-bold text-primary">
        {display}
      </motion.div>
      <p className="text-sm text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

function ValueCard({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5 }}
      className="group border rounded-2xl p-6 hover:shadow-lg hover:border-primary/20 transition-all"
    >
      <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </motion.div>
  );
}

export function AboutContent() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-primary/5 py-24">
        <div className="container mx-auto px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            About Goodie Box
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            Curated gift boxes, college essentials, and snacks — delivered with love.
          </motion.p>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto"
          >
            <AnimatedStat value={1000} suffix="+" label="Happy Customers" />
            <AnimatedStat value={50} suffix="+" label="Collections" />
            <AnimatedStat value={7} label="Day Returns" />
            <AnimatedStat value={999} prefix="₹" suffix="+" label="Free Shipping" />
          </motion.div>
        </div>
      </section>

      {/* Our Story */}
      <ScrollReveal direction="left" className="container mx-auto px-4 py-20 max-w-4xl">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-4">Our Story</h2>
            <p className="text-muted-foreground leading-relaxed">
              Goodie Box was born from a simple idea — thoughtful gifting should
              be easy, affordable, and delightful. We curate gift boxes for every
              occasion, from exam survival kits to birthday surprises, ensuring
              every box is packed with love.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              What started as a small college initiative has grown into a trusted
              destination for thousands of happy customers across India.
            </p>
          </div>
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Gift className="h-32 w-32 text-primary/40" />
          </div>
        </div>
      </ScrollReveal>

      {/* Gallery */}
      <section className="py-20 bg-muted/20">
        <ScrollReveal className="container mx-auto px-4 text-center mb-12">
          <h2 className="text-3xl font-bold mb-2">Our Boxes in Action</h2>
          <p className="text-muted-foreground">Hover over each image to explore</p>
        </ScrollReveal>
        <div className="flex justify-center">
          <HoverExpand_001
            images={[
              { src: "https://picsum.photos/seed/giftbox1/400/600", alt: "Gift box 1", code: "Birthday" },
              { src: "https://picsum.photos/seed/giftbox2/400/600", alt: "Gift box 2", code: "Exam Kit" },
              { src: "https://picsum.photos/seed/giftbox3/400/600", alt: "Gift box 3", code: "Anniversary" },
              { src: "https://picsum.photos/seed/giftbox4/400/600", alt: "Gift box 4", code: "Snack Box" },
              { src: "https://picsum.photos/seed/giftbox5/400/600", alt: "Gift box 5", code: "Custom" },
              { src: "https://picsum.photos/seed/giftbox6/400/600", alt: "Gift box 6", code: "Festival" },
              { src: "https://picsum.photos/seed/giftbox7/400/600", alt: "Gift box 7", code: "College" },
              { src: "https://picsum.photos/seed/giftbox8/400/600", alt: "Gift box 8", code: "Special" },
              { src: "https://picsum.photos/seed/giftbox9/400/600", alt: "Gift box 9", code: "Surprise" },
            ]}
          />
        </div>
      </section>

      {/* Values */}
      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <ScrollReveal className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-2">Why Choose Us</h2>
            <p className="text-muted-foreground">Everything you need for the perfect gift</p>
          </ScrollReveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <ValueCard
              icon={Heart}
              title="Thoughtfully Curated"
              description="Every box is handpicked with care to create memorable gifting experiences."
            />
            <ValueCard
              icon={Package}
              title="Custom Requests"
              description="Can't find what you're looking for? We'll build a custom box just for you."
            />
            <ValueCard
              icon={Truck}
              title="Free Shipping"
              description="Free delivery on orders over ₹999, with easy returns within 7 days."
            />
            <ValueCard
              icon={Users}
              title="1000+ Happy Customers"
              description="Trusted by customers across India for quality and timely delivery."
            />
            <ValueCard
              icon={Award}
              title="Quality Guaranteed"
              description="We stand behind every product. Your satisfaction is our priority."
            />
            <ValueCard
              icon={Gift}
              title="Perfect for Every Occasion"
              description="From birthdays to exams, we have the perfect box for every moment."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <ScrollReveal className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Find the Perfect Gift?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Browse our collections or make a custom request — we've got you covered.
          </p>
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
