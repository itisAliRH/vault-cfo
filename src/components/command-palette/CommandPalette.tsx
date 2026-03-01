"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Lightbulb,
  Settings,
  Home,
} from "lucide-react";

const ACTIONS = [
  { id: "home", label: "Go to Home", href: "/", icon: Home },
  { id: "dashboard", label: "Go to Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { id: "chat", label: "Go to Chat", href: "/chat", icon: MessageSquare },
  { id: "contracts", label: "Go to Contracts", href: "/contracts", icon: FileText },
  { id: "insights", label: "Go to Insights", href: "/insights", icon: Lightbulb },
  { id: "settings", label: "Open Settings", href: "/settings", icon: Settings },
] as const;

function matchQuery(label: string, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  return label.toLowerCase().includes(q);
}

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filtered = ACTIONS.filter((a) => matchQuery(a.label, query));

  const select = useCallback(
    (href: string) => {
      router.push(href);
      onOpenChange(false);
      setQuery("");
      setSelectedIndex(0);
    },
    [router, onOpenChange]
  );

  useEffect(() => {
    if (!open) return;
    const down = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange(false);
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === "Enter" && filtered[selectedIndex]) {
        e.preventDefault();
        select(filtered[selectedIndex].href);
      }
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, [open, filtered, selectedIndex, select, onOpenChange]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md p-0 gap-0 overflow-hidden"
        showCloseButton={true}
        onPointerDownOutside={() => onOpenChange(false)}
      >
        <DialogTitle className="sr-only">Search and navigate</DialogTitle>
        <div className="flex flex-col">
          <div className="flex items-center border-b border-border px-3">
            <span className="text-muted-foreground mr-2" aria-hidden>
              ⌘K
            </span>
            <Input
              placeholder="Search…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 font-pixel text-sm h-12"
              autoFocus
              aria-label="Search actions"
            />
          </div>
          <ul
            className="max-h-[60vh] overflow-y-auto py-2"
            role="listbox"
            aria-label="Actions"
          >
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-sm text-muted-foreground font-pixel">
                No results
              </li>
            ) : (
              filtered.map((action, i) => {
                const Icon = action.icon;
                return (
                  <li key={action.id} role="option" aria-selected={i === selectedIndex}>
                    <button
                      type="button"
                      onClick={() => select(action.href)}
                      onMouseEnter={() => setSelectedIndex(i)}
                      className={`
                        w-full flex items-center gap-3 px-4 py-2.5 text-left font-pixel text-sm
                        focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset
                        ${i === selectedIndex ? "bg-muted text-foreground" : "text-foreground hover:bg-muted/70"}
                      `}
                    >
                      <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                      {action.label}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, []);

  return { open, setOpen };
}
