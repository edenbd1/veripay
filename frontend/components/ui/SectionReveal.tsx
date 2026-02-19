"use client";

import { useScrollReveal } from "@/hooks/useScrollReveal";
import { cn } from "@/lib/cn";

interface SectionRevealProps {
  children: React.ReactNode;
  className?: string;
  stagger?: boolean;
}

export function SectionReveal({ children, className, stagger = false }: SectionRevealProps) {
  const ref = useScrollReveal<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={cn("reveal", stagger && "stagger-children", className)}
    >
      {children}
    </div>
  );
}
