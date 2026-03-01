"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type ModelCardVariant = "orange" | "amber" | "red" | "yellow" | "default";

const VARIANT_CLASSES: Record<ModelCardVariant, string> = {
  orange: "bg-orange-500/10 dark:bg-orange-500/20 border-orange-500/30 dark:border-orange-400/30",
  amber: "bg-amber-500/10 dark:bg-amber-500/20 border-amber-500/30 dark:border-amber-400/30",
  red: "bg-red-500/10 dark:bg-red-500/20 border-red-500/30 dark:border-red-400/30",
  yellow: "bg-yellow-500/10 dark:bg-yellow-500/20 border-yellow-500/30 dark:border-yellow-400/30",
  default: "bg-card border-border",
};

const ICON_CLASSES: Record<ModelCardVariant, string> = {
  orange: "text-orange-600 dark:text-orange-400",
  amber: "text-amber-600 dark:text-amber-400",
  red: "text-red-600 dark:text-red-400",
  yellow: "text-yellow-600 dark:text-yellow-500",
  default: "text-muted-foreground",
};

export interface ModelCardProps {
  title: string;
  description?: string;
  /** Link href for "Open" / "View" */
  href?: string;
  linkLabel?: string;
  /** Icon component (e.g. Lucide icon or pixel SVG) */
  icon?: React.ReactNode;
  variant?: ModelCardVariant;
  className?: string;
  children?: React.ReactNode;
}

export function ModelCard({
  title,
  description,
  href,
  linkLabel = "Open",
  icon,
  variant = "default",
  className,
  children,
}: ModelCardProps) {
  return (
    <Card
      className={cn(
        "rounded-xl border transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        VARIANT_CLASSES[variant],
        className
      )}
    >
      <CardHeader className="pb-2">
        {icon && (
          <div className={cn("mb-2 size-8 flex items-center justify-center", ICON_CLASSES[variant])}>
            {icon}
          </div>
        )}
        <h3 className="font-pixel text-sm font-semibold text-foreground">{title}</h3>
      </CardHeader>
      <CardContent className="space-y-3">
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
        {children}
        {href && (
          <Link
            href={href}
            className="inline-flex items-center gap-1.5 font-pixel text-xs text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
          >
            {linkLabel}
            <ChevronRight className="size-3.5" aria-hidden />
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
