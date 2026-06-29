"use client";

import { motion } from "framer-motion";

type AnimatedHamburgerProps = {
  open: boolean;
  onClick: () => void;
};

export function AnimatedHamburger({ open, onClick }: AnimatedHamburgerProps) {
  return (
    <button
      onClick={onClick}
      className="relative flex size-10 items-center justify-center rounded-lg hover:bg-accent transition-colors lg:hidden"
      aria-label={open ? "Close menu" : "Open menu"}
    >
      <div className="relative grid size-4 cursor-pointer items-center justify-center">
        <motion.div
          animate={{ y: open ? 0 : "-5px", rotate: open ? 45 : 0 }}
          className="absolute h-0.5 w-full rounded-full bg-current"
        />
        <motion.div
          animate={{ opacity: open ? 0 : 1 }}
          transition={{ duration: 0.1 }}
          className="absolute h-0.5 w-full rounded-full bg-current"
        />
        <motion.div
          animate={{ y: open ? 0 : "5px", rotate: open ? -45 : 0 }}
          className="absolute h-0.5 w-full rounded-full bg-current"
        />
      </div>
    </button>
  );
}
