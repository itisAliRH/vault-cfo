"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";

interface PerfData {
  model_name: string | null;
  latency_ms: number | null;
  gpu_name: string | null;
  vram_usage_mb: number | null;
  status: string;
}

interface NetworkEntry {
  id: string;
  url: string;
  method: string;
  timestamp: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [perf, setPerf] = useState<PerfData | null>(null);
  const [profile, setProfile] = useState<{ online_consent?: boolean } | null>(null);
  const [networkLog, setNetworkLog] = useState<NetworkEntry[]>([]);
  const [wipeOpen, setWipeOpen] = useState(false);
  const [wiping, setWiping] = useState(false);
   const { toast } = useToast();

  useEffect(() => {
    fetch("/api/health/perf")
      .then((r) => r.json())
      .then(setPerf)
      .catch(() => setPerf(null));
  }, []);

  useEffect(() => {
    fetch("/api/onboarding")
      .then((r) => r.json())
      .then((d) => setProfile(d.profile ?? null))
      .catch(() => setProfile(null));
  }, []);

  useEffect(() => {
    fetch("/api/network-audit")
      .then((r) => r.json())
      .then((d) => setNetworkLog(d.entries ?? []))
      .catch(() => setNetworkLog([]));
  }, []);

  const handleExport = async () => {
    try {
      const res = await fetch("/api/vault");
      if (!res.ok) {
        throw new Error("Failed to export vault");
      }
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `vaultcfo-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({
        title: "Export ready",
        description: "Your vault was exported as JSON.",
        variant: "success",
      });
    } catch (e) {
      toast({
        title: "Export failed",
        description: e instanceof Error ? e.message : "Something went wrong while exporting.",
        variant: "error",
      });
    }
  };

  const handleWipe = async () => {
    setWiping(true);
    try {
      const res = await fetch("/api/vault?confirm=wipe", { method: "DELETE" });
      if (res.ok) {
        setWipeOpen(false);
        toast({
          title: "Vault wiped",
          description: "All local data has been deleted.",
          variant: "success",
        });
        router.push("/onboarding");
      } else {
        toast({
          title: "Failed to wipe vault",
          description: "Please try again.",
          variant: "error",
        });
      }
    } catch (e) {
      toast({
        title: "Failed to wipe vault",
        description: e instanceof Error ? e.message : "Something went wrong.",
        variant: "error",
      });
    } finally {
      setWiping(false);
    }
  };

  const handleOnlineToggle = async (checked: boolean) => {
    if (!profile) return;
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          literacy_level: (profile as { literacy_level?: string }).literacy_level ?? "beginner",
          insight_style: (profile as { insight_style?: string }).insight_style ?? "simple",
          online_consent: checked,
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to update preference");
      }
      setProfile({ ...profile, online_consent: checked });
      toast({
        title: checked ? "Online tools enabled" : "Online tools disabled",
        variant: "info",
      });
    } catch (e) {
      toast({
        title: "Could not update preference",
        description: e instanceof Error ? e.message : "Something went wrong.",
        variant: "error",
      });
    }
  };

  const handleOnboardingReset = async () => {
    try {
      const res = await fetch("/api/onboarding", { method: "DELETE" });
      if (!res.ok) {
        throw new Error("Failed to reset onboarding");
      }
      toast({
        title: "Onboarding reset",
        description: "You will be guided through setup again.",
        variant: "info",
      });
      router.push("/onboarding");
    } catch (e) {
      toast({
        title: "Failed to reset onboarding",
        description: e instanceof Error ? e.message : "Something went wrong.",
        variant: "error",
      });
    }
  };

  return (
    <div className="container space-y-8 py-8">
      <h1 className="font-pixel text-2xl text-primary">Settings</h1>

      <Card className="pixel-border">
        <CardHeader>
          <CardTitle className="font-pixel text-sm">Performance (Mistral API)</CardTitle>
          <CardDescription>Cached 30s</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {perf?.status === "ok" ? (
            <div className="flex flex-wrap gap-2">
              <Badge className="font-pixel text-[10px] bg-accent/20 text-accent">Online</Badge>
              <span className="text-sm">Model: {perf.model_name ?? "—"}</span>
              {perf.latency_ms != null && (
                <span className="text-sm text-muted-foreground">Latency: {perf.latency_ms} ms</span>
              )}
              {perf.gpu_name && <span className="text-sm text-muted-foreground">Backend: {perf.gpu_name}</span>}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Set MISTRAL_API_KEY to connect to the Mistral API (or your own compatible endpoint).
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="pixel-border">
        <CardHeader>
          <CardTitle className="font-pixel text-sm">Data</CardTitle>
          <CardDescription>Export or wipe your vault</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button variant="default" className="font-pixel text-xs" onClick={handleExport}>
            Export all (JSON)
          </Button>
          <Button variant="destructive" className="font-pixel text-xs" onClick={() => setWipeOpen(true)}>
            Wipe vault
          </Button>
        </CardContent>
      </Card>

      <Dialog open={wipeOpen} onOpenChange={setWipeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-pixel text-sm">Wipe vault?</DialogTitle>
            <DialogDescription>This will delete all local data (users, transactions, contracts, insights). You cannot undo this.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setWipeOpen(false)}>Cancel</Button>
            <Button variant="destructive" disabled={wiping} onClick={handleWipe}>
              {wiping ? "Wiping…" : "Wipe"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="pixel-border">
        <CardHeader>
          <CardTitle className="font-pixel text-sm">Privacy</CardTitle>
          <CardDescription>Allow online tools when you explicitly ask</CardDescription>
        </CardHeader>
        <CardContent>
          <Label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={profile?.online_consent ?? false}
              onChange={(e) => handleOnlineToggle(e.target.checked)}
            />
            <span className="text-sm">Online tools enabled</span>
          </Label>
        </CardContent>
      </Card>

      <Card className="pixel-border">
        <CardHeader>
          <CardTitle className="font-pixel text-sm">Network log</CardTitle>
          <CardDescription>Outbound requests when online tools are used</CardDescription>
        </CardHeader>
        <CardContent>
          {networkLog.length === 0 ? (
            <p className="text-sm text-muted-foreground">No entries yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Method</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {networkLog.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>{e.method}</TableCell>
                    <TableCell className="font-mono text-xs">{e.url}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{e.timestamp}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="pixel-border">
        <CardHeader>
          <CardTitle className="font-pixel text-sm">Onboarding &amp; model</CardTitle>
          <CardDescription>Reset onboarding or view model config</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Button variant="outline" className="font-pixel text-xs w-fit" onClick={handleOnboardingReset}>
            Reset onboarding
          </Button>
          <p className="text-xs text-muted-foreground">
            Model: Mistral Small 3.2 via MISTRAL_API_KEY (configurable in .env).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
