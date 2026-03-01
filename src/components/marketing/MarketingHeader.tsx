"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, ChevronRight } from "lucide-react";

const navLinks = [
  { href: "/login", label: "Log in" },
  { href: "/signup", label: "Sign up" },
] as const;

export function MarketingHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-6">
        <Link
          href="/"
          className="font-pixel text-sm font-medium text-foreground hover:text-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md"
        >
          VaultCFO
        </Link>

        <nav className="hidden md:flex items-center gap-3" aria-label="Main">
          <ThemeToggle />
          <Link
            href="/login"
            className="font-pixel text-sm text-muted-foreground hover:text-foreground transition-colors px-4 py-2.5 rounded-lg border border-border hover:border-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Log in
          </Link>
          <Button
            asChild
            size="default"
            className="font-pixel text-sm bg-orange-500 text-white hover:bg-orange-600 rounded-lg px-5 py-2.5 h-auto transition-all focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2"
          >
            <Link href="/signup" className="inline-flex items-center gap-2">
              Get started
              <ChevronRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </nav>

        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="font-pixel"
                aria-label="Open menu"
                aria-expanded={open}
              >
                <Menu className="size-5" aria-hidden />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <nav className="flex flex-col gap-2 pt-6" aria-label="Mobile">
                {navLinks.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className="font-pixel text-sm text-foreground hover:text-accent hover:bg-muted/50 px-3 py-2 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
