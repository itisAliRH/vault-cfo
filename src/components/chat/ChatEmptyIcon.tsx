"use client";

import { cn } from "@/lib/utils";

/**
 * Pixel-style icon for chat empty state (blocky "V" / chat bubble aesthetic).
 * Theme-safe: uses currentColor so it inherits text color.
 */
export function ChatEmptyIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-16 md:size-20", className)}
      aria-hidden
    >
      {/* Blocky chat bubble outline - pixel style */}
      <rect
        x="8"
        y="4"
        width="48"
        height="44"
        rx="4"
        stroke="currentColor"
        strokeWidth="3"
        fill="none"
      />
      {/* Pixel "V" for VaultCFO - blocky shape */}
      <path
        d="M20 20 L32 40 L44 20"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="square"
        strokeLinejoin="miter"
        fill="none"
      />
      {/* Small tail of bubble */}
      <path
        d="M26 48 L32 56 L38 48"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="square"
        fill="none"
      />
    </svg>
  );
}
