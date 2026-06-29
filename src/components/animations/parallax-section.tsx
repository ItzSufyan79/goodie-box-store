"use client";

import { type ReactNode, useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";

type ParallaxSectionProps = {
  children: ReactNode;
  speed?: number;
  className?: string;
};

export function ParallaxSection({ children, speed = 0.5, className }: ParallaxSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [speed * 200, -speed * 200]);

  return (
    <div ref={ref} className={className}>
      <motion.div className="relative" style={{ y }}>
        {children}
      </motion.div>
    </div>
  );
}
