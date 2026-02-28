"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Lightbulb,
  MessageSquare,
  Settings,
  Home,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/contracts", label: "Contracts", icon: FileText },
  { href: "/insights", label: "Insights", icon: Lightbulb },
  { href: "/chat", label: "Agent Chat", icon: MessageSquare },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/landing", label: "Landing", icon: Home },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar className="pixel-border border-t-0 border-l-0 border-b-0">
      <SidebarHeader className="flex items-center justify-between border-b border-sidebar-border px-2 py-2">
        <span className="font-pixel text-xs text-sidebar-primary">VaultCFO</span>
        <ThemeToggle />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="font-pixel text-xs">Navigate</SidebarGroupLabel>
          <SidebarMenu>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                    <Link href={item.href} className="font-pixel text-sm">
                      <Icon className="size-4 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <StatusBar />
      </SidebarFooter>
    </Sidebar>
  );
}

function StatusBar() {
  const [perf, setPerf] = React.useState<{
    status?: string;
    model_name?: string | null;
    latency_ms?: number | null;
    gpu_name?: string | null;
  } | null>(null);
  const [onlineConsent] = React.useState(false);

  React.useEffect(() => {
    fetch("/api/health/perf")
      .then((r) => r.json())
      .then(setPerf)
      .catch(() => setPerf(null));
  }, []);

  return (
    <div className="flex flex-wrap gap-2 p-2">
      <span className="rounded border border-accent bg-accent/10 px-1.5 py-0.5 font-pixel text-[10px] text-accent">
        LOCAL MODE
      </span>
      {onlineConsent && (
        <span className="rounded border border-secondary bg-secondary/20 px-1.5 py-0.5 font-pixel text-[10px] text-secondary">
          ONLINE TOOLS ENABLED
        </span>
      )}
      {perf?.status === "ok" && (
        <span className="rounded border border-accent bg-accent/10 px-1.5 py-0.5 font-pixel text-[10px] text-accent">
          NVIDIA GPU
        </span>
      )}
    </div>
  );
}
