"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PausedOverlayProps {
  onResume: () => void;
  className?: string;
}

export function PausedOverlay({ onResume, className }: PausedOverlayProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 rounded-xl bg-muted/95 backdrop-blur-sm",
        className
      )}
    >
      <p className="font-pixel text-sm text-muted-foreground">
        Meeting paused
      </p>
      <Button
        onClick={onResume}
        className="font-pixel gap-2 bg-orange-500 hover:bg-orange-600"
      >
        <Play className="size-4" aria-hidden />
        Resume meeting
      </Button>
    </div>
  );
}
