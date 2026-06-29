"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface HoverLiftProps {
  children: ReactNode;
  className?: string;
  lift?: number;
}

export function HoverLift({ children, className, lift = 4 }: HoverLiftProps) {
  return (
    <motion.div
      whileHover={{ y: -lift, boxShadow: "0 12px 24px rgba(0,0,0,0.1)" }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
