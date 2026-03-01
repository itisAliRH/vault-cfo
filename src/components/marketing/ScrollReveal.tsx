"use client";

import { useInView } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";

export function ScrollReveal({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { ref, inView } = useInView({ once: true });

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-500",
        inView && "animate-in fade-in-0 slide-in-from-bottom-4",
        className
      )}
    >
      {children}
    </div>
  );
}
