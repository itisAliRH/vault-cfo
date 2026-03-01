"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export interface TranscriptEntry {
  role: "user" | "agent";
  text: string;
}

export interface MeetingTranscriptProps {
  entries: TranscriptEntry[];
  className?: string;
}

export function MeetingTranscript({ entries, className }: MeetingTranscriptProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [entries]);

  return (
    <div
      ref={scrollRef}
      className={cn(
        "rounded-lg border border-border bg-card overflow-y-auto",
        className
      )}
    >
      <div className="p-3 space-y-3 min-h-[120px]">
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Transcript will appear here as you talk.
          </p>
        ) : (
          entries.map((entry, i) => (
            <div
              key={`${entry.role}-${i}-${entry.text.slice(0, 20)}`}
              className={cn(
                "flex animate-in fade-in-0 slide-in-from-bottom-1 duration-200",
                entry.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                  entry.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <span className="font-pixel text-[10px] opacity-80 block mb-0.5">
                  {entry.role === "user" ? "You" : "Consultant"}
                </span>
                <p className="whitespace-pre-wrap break-words">{entry.text}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
