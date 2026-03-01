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

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/contracts", label: "Contracts", icon: FileText },
  { href: "/insights", label: "Insights", icon: Lightbulb },
  { href: "/chat", label: "Agent Chat", icon: MessageSquare },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar className="pixel-border border-t-0 border-l-0 border-b-0">
      <SidebarHeader className="flex items-center border-b border-sidebar-border px-2 py-2">
        <span className="font-pixel text-xs text-sidebar-primary">VaultCFO</span>
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
  const [onlineConsent, setOnlineConsent] = React.useState(false);

  React.useEffect(() => {
    fetch("/api/health/perf")
      .then((r) => r.json())
      .then(setPerf)
      .catch(() => setPerf(null));

    fetch("/api/onboarding")
      .then((r) => r.ok ? r.json() : null)
      .then((d: { profile?: { online_consent?: boolean } } | null) => {
        setOnlineConsent(!!d?.profile?.online_consent);
      })
      .catch(() => {});

    const handler = (e: Event) => {
      setOnlineConsent((e as CustomEvent<boolean>).detail);
    };
    window.addEventListener("online-consent-change", handler);
    return () => window.removeEventListener("online-consent-change", handler);
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
      {perf?.status === "ok" && perf.gpu_name && perf.gpu_name !== "Mistral backend" && (
        <span className="rounded border border-accent bg-accent/10 px-1.5 py-0.5 font-pixel text-[10px] text-accent">
          NVIDIA GPU
        </span>
      )}
      {perf?.status === "ok" && (
        <span className="rounded border border-accent bg-accent/10 px-1.5 py-0.5 font-pixel text-[10px] text-accent">
          AI READY
        </span>
      )}
    </div>
  );
}
