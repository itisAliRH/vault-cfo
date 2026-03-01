"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";

const THEMES = ["light", "dark", "system"] as const;

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const current = (theme ?? "system") as (typeof THEMES)[number];
  const index = THEMES.indexOf(current);
  const nextIndex = (index + 1) % THEMES.length;
  const next = THEMES[nextIndex];

  const handleClick = () => {
    setTheme(next);
  };

  const Icon =
    current === "dark" ? Moon : current === "light" ? Sun : Monitor;

  if (!mounted) {
    return (
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="rounded-full font-pixel text-xs"
        aria-label="Theme"
        title="Theme"
      >
        <Sun className="size-4" />
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={handleClick}
      className="rounded-full font-pixel text-xs"
      aria-label={`Theme: ${current}. Switch to ${next}.`}
      title={`Theme: ${current} (next: ${next})`}
    >
      <Icon className="size-4" />
    </Button>
  );
}
