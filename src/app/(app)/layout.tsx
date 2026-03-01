"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { OnboardingGuard } from "@/components/onboarding/OnboardingGuard";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { CommandPalette, useCommandPalette } from "@/components/command-palette/CommandPalette";
import { ArrowLeft, Search } from "lucide-react";

const BREADCRUMB_MAP: Record<string, { label: string; href?: string }[]> = {
  "/dashboard": [{ label: "Home", href: "/" }, { label: "Dashboard" }],
  "/contracts": [{ label: "Home", href: "/" }, { label: "Contracts" }],
  "/chat": [{ label: "Home", href: "/" }, { label: "Agent Chat" }],
  "/settings": [{ label: "Home", href: "/" }, { label: "Settings" }],
  "/insights": [{ label: "Home", href: "/" }, { label: "Insights" }],
  "/onboarding": [{ label: "Home", href: "/" }, { label: "Onboarding" }],
};

function getBreadcrumbItems(pathname: string) {
  return BREADCRUMB_MAP[pathname] ?? [{ label: "Home", href: "/" }, { label: pathname.slice(1) || "App" }];
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isOnboarding = pathname === "/onboarding";

  if (isOnboarding) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="border-b border-border px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" className="font-pixel text-xs text-muted-foreground hover:text-foreground gap-2" asChild>
            <Link href="/">
              <ArrowLeft className="size-4" />
              Back home
            </Link>
          </Button>
          <ThemeToggle />
        </header>
        <main className="flex-1">
          <OnboardingGuard>{children}</OnboardingGuard>
        </main>
      </div>
    );
  }

  const breadcrumbItems = getBreadcrumbItems(pathname);

  return (
    <AppLayoutWithPalette breadcrumbItems={breadcrumbItems}>
      {children}
    </AppLayoutWithPalette>
  );
}

function AppLayoutWithPalette({
  children,
  breadcrumbItems,
}: {
  children: React.ReactNode;
  breadcrumbItems: { label: string; href?: string }[];
}) {
  const { open, setOpen } = useCommandPalette();

  return (
    <SidebarProvider>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-accent focus:text-accent-foreground focus:rounded-md font-pixel text-sm"
      >
        Skip to main content
      </a>
      <CommandPalette open={open} onOpenChange={setOpen} />
      <AppSidebar />
      <SidebarInset>
        <div className="flex flex-col min-h-full">
          <header className="border-b border-border bg-background/95 flex items-center justify-between gap-4 px-4 py-3">
            <div className="flex items-center gap-2 min-w-0">
              <SidebarTrigger aria-label="Toggle sidebar" />
              <Link
                href="/"
                className="font-pixel text-sm font-medium text-foreground hover:text-orange-500 transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md shrink-0"
              >
                VaultCFO
              </Link>
              <Button
                variant="outline"
                size="sm"
                className="font-pixel text-xs text-muted-foreground border-border hover:bg-muted/50 gap-2 h-8"
                onClick={() => setOpen(true)}
                aria-label="Search (⌘K)"
              >
                <Search className="size-3.5" aria-hidden />
                <span className="hidden sm:inline">Search</span>
                <kbd className="hidden sm:inline pointer-events-none h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">⌘K</kbd>
              </Button>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <ThemeToggle />
            </div>
          </header>
          <div className="border-b border-border px-6 py-3 bg-background/95">
            <Breadcrumb items={breadcrumbItems} />
          </div>
          <main id="main-content" className="flex-1" tabIndex={-1}>
            <OnboardingGuard>{children}</OnboardingGuard>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
