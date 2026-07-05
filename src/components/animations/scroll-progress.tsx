"use client";

import NumberFlow from "@number-flow/react";
import { motion, useMotionValueEvent, useScroll, useTransform } from "motion/react";
import { useState } from "react";

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const [progressPercent, setProgressPercent] = useState(0);

  const clampedProgress = useTransform(scrollYProgress, (value) =>
    Math.min(Math.max(value, 0), 1),
  );
  const progressAsPercent = useTransform(clampedProgress, (value) =>
    Math.round(value * 100),
  );

  useMotionValueEvent(progressAsPercent, "change", (value) => {
    setProgressPercent(value);
  });

  const radius = 18;
  const circumference = 2 * Math.PI * radius;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: progressPercent > 0 ? 1 : 0, scale: progressPercent > 0 ? 1 : 0.8 }}
      className="fixed bottom-4 left-4 z-50"
    >
      <div className="group relative flex size-12 items-center justify-center rounded-2xl border bg-background/80 backdrop-blur-sm">
        <NumberFlow
          value={progressPercent}
          className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs font-medium tabular-nums text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
          suffix="%"
        />
        <svg className="size-10" viewBox="0 0 48 48" role="presentation">
          <circle
            cx="24" cy="24" r={radius}
            stroke="currentColor" strokeWidth="3"
            className="opacity-20" fill="none"
          />
          <motion.circle
            cx="24" cy="24" r={radius}
            stroke="currentColor" strokeWidth="3"
            fill="none" strokeLinecap="round"
            strokeDasharray={`${circumference}`}
            style={{
              pathLength: clampedProgress,
              rotate: -90,
              transformOrigin: "50% 50%",
            }}
          />
        </svg>
      </div>
    </motion.div>
  );
}
