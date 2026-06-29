"use client";

import { motion, useSpring, useTransform, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface AnimatedCounterProps {
  from?: number;
  to: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}

export function AnimatedCounter({
  from = 0,
  to,
  suffix = "",
  prefix = "",
  className,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const hasAnimated = useRef(false);

  const spring = useSpring(from, { stiffness: 50, damping: 20 });
  const display = useTransform(spring, (v) => `${prefix}${Math.round(v)}${suffix}`);

  useEffect(() => {
    if (inView && !hasAnimated.current) {
      spring.set(to);
      hasAnimated.current = true;
    }
  }, [inView, spring, to]);

  return <motion.span ref={ref} className={className}>{display}</motion.span>;
}
