"use client";

import { useCallback } from "react";
import { Copy } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export interface SectionPillProps {
  /** Section label, e.g. "DASHBOARD", "FEATURED" */
  label: string;
  /** Optional id for anchor link (e.g. "dashboard") */
  sectionId?: string;
  /** Show copy section link button */
  copyLink?: boolean;
  className?: string;
}

export function SectionPill({
  label,
  sectionId,
  copyLink = false,
  className,
}: SectionPillProps) {
  const { toast } = useToast();

  const handleCopy = useCallback(() => {
    const url = typeof window !== "undefined"
      ? `${window.location.origin}${window.location.pathname}${sectionId ? `#${sectionId}` : ""}`
      : "";
    if (url && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url);
      toast({ title: "Link copied", variant: "success" });
    }
  }, [sectionId, toast]);

  return (
    <div
      id={sectionId}
      className={cn(
        "flex flex-wrap items-center gap-2",
        className
      )}
    >
      <span className="font-pixel text-[10px] uppercase tracking-wider text-muted-foreground bg-muted/80 dark:bg-muted/50 px-2.5 py-1 rounded-full w-fit">
        {label}
      </span>
      {copyLink && (
        <button
          type="button"
          onClick={handleCopy}
          className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="Copy section link"
        >
          <Copy className="size-3.5" aria-hidden />
        </button>
      )}
    </div>
  );
}
