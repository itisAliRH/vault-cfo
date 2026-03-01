"use client";

import { cn } from "@/lib/utils";

/** Pixel-style icons (blocky, theme-safe via currentColor). Use with className for size/color. */

export function PixelDashboard({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("size-8", className)} aria-hidden>
      <rect x="4" y="4" width="10" height="10" stroke="currentColor" strokeWidth="2" fill="none" />
      <rect x="18" y="4" width="10" height="10" stroke="currentColor" strokeWidth="2" fill="none" />
      <rect x="4" y="18" width="10" height="10" stroke="currentColor" strokeWidth="2" fill="none" />
      <rect x="18" y="18" width="10" height="10" stroke="currentColor" strokeWidth="2" fill="none" />
    </svg>
  );
}

export function PixelContract({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("size-8", className)} aria-hidden>
      <rect x="6" y="2" width="20" height="28" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
      <line x1="10" y1="8" x2="22" y2="8" stroke="currentColor" strokeWidth="2" />
      <line x1="10" y1="14" x2="22" y2="14" stroke="currentColor" strokeWidth="2" />
      <line x1="10" y1="20" x2="18" y2="20" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function PixelChat({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("size-8", className)} aria-hidden>
      <rect x="2" y="2" width="28" height="22" rx="4" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M8 28 L16 22 L24 28" stroke="currentColor" strokeWidth="2" fill="none" />
    </svg>
  );
}

export function PixelShield({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("size-8", className)} aria-hidden>
      <path d="M16 2 L28 6 L28 14 C28 22 16 30 16 30 C16 30 4 22 4 14 L4 6 Z" stroke="currentColor" strokeWidth="2" fill="none" />
    </svg>
  );
}
