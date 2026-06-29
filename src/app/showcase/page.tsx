"use client";

import { Skiper30 } from "@/components/ui/skiper-ui/skiper30";
import { Skiper37 } from "@/components/ui/skiper-ui/skiper37";
import { Skiper40 } from "@/components/ui/skiper-ui/skiper40";
import { Skiper41, ProgressiveBlur } from "@/components/ui/skiper-ui/skiper41";
import { Skiper48 } from "@/components/ui/skiper-ui/skiper48";
import { Skiper52 } from "@/components/ui/skiper-ui/skiper52";
import { Skiper61, SimpleMouseFollow, SpringMouseFollow } from "@/components/ui/skiper-ui/skiper61";
import { Skiper87 } from "@/components/ui/skiper-ui/skiper87";
import { Skiper89 } from "@/components/ui/skiper-ui/skiper89";
import { Skiper99 } from "@/components/ui/skiper-ui/skiper99";
import { Skiper102, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/skiper-ui/skiper101";

export default function ShowcasePage() {
  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-50 flex items-center justify-center bg-background/80 py-4 backdrop-blur-sm">
        <h1 className="text-2xl font-bold">Skiper UI Showcase</h1>
      </div>

      <section className="relative h-screen">
        <ProgressiveBlur position="top" backgroundColor="#f5f4f3" />
        <div className="flex h-full items-center justify-center bg-[#f5f4f3]">
          <Skiper40 />
        </div>
        <ProgressiveBlur position="bottom" backgroundColor="#f5f4f3" />
      </section>

      <section className="h-screen">
        <Skiper30 />
      </section>

      <section className="h-screen">
        <Skiper48 />
      </section>

      <section className="h-screen">
        <Skiper52 />
      </section>

      <section className="h-screen">
        <Skiper61 />
      </section>

      <section className="h-screen">
        <Skiper87 />
      </section>

      <section className="h-screen">
        <Skiper89 />
      </section>

      <section className="h-screen">
        <Skiper99 />
      </section>

      <section className="h-screen bg-[#f5f4f3]">
        <Skiper102 />
      </section>

      <section>
        <Skiper37 />
      </section>
    </div>
  );
}
