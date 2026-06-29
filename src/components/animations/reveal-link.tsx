"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type RevealLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
};

export function RevealLink({ href, children, className }: RevealLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative inline-flex items-center",
        "before:absolute before:bottom-0 before:left-0 before:h-[0.05em] before:w-full before:bg-current before:origin-right before:scale-x-0",
        "before:transition-transform before:duration-300 before:ease-[cubic-bezier(0.4,0,0.2,1)]",
        "hover:before:origin-left hover:before:scale-x-100",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function RevealLinkUnderline({
  href,
  children,
  className,
}: RevealLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative inline-flex items-center",
        "before:pointer-events-none before:absolute before:left-0 before:top-[1.5em] before:h-[0.05em] before:w-full before:bg-current",
        "before:origin-right before:scale-x-0 before:transition-transform before:duration-300 before:ease-[cubic-bezier(0.4,0,0.2,1)]",
        "hover:before:origin-left hover:before:scale-x-100",
        className,
      )}
    >
      {children}
      <svg
        className="ml-[0.3em] mt-[0em] size-[0.55em] translate-y-1 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
        fill="none"
        viewBox="0 0 10 10"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M1.004 9.166 9.337.833m0 0v8.333m0-8.333H1.004"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Link>
  );
}

export function RevealLinkFill({
  href,
  children,
  className,
}: RevealLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative inline-flex items-center px-2",
        "before:absolute before:left-0 before:w-full before:bg-primary",
        "before:origin-right before:scale-x-0 before:transition-all before:duration-300 before:ease-[cubic-bezier(0.4,0,0.2,1)]",
        "before:z-[-1] before:bottom-0 before:h-0 before:mix-blend-difference",
        "hover:before:h-[1.4em] hover:before:scale-x-100",
        className,
      )}
    >
      {children}
    </Link>
  );
}
