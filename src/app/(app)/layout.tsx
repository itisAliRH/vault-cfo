"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { OnboardingGuard } from "@/components/onboarding/OnboardingGuard";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

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

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <OnboardingGuard>{children}</OnboardingGuard>
      </SidebarInset>
    </SidebarProvider>
  );
}
