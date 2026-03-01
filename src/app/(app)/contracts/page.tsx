"use client";

import { useEffect, useState, useMemo } from "react";
import { format, differenceInDays, parseISO } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronUp, Upload, Plus, Trash2, Shield, Wifi, Zap, CreditCard, FileText, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { ContractFacts } from "@/types";
import { useToast } from "@/components/ui/toast";

interface ContractWithFacts {
  id: string;
  filename: string;
  uploaded_at: string;
  facts?: ContractFacts;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  insurance: <Shield className="size-4" />,
  telecom: <Wifi className="size-4" />,
  utility: <Zap className="size-4" />,
  subscription: <CreditCard className="size-4" />,
};

function getCategoryFromProvider(provider: string): string {
  const p = provider.toLowerCase();
  if (p.includes("insurance") || p.includes("axa") || p.includes("allianz")) return "insurance";
  if (p.includes("mobile") || p.includes("telecom") || p.includes("orange") || p.includes("free") || p.includes("bouygues")) return "telecom";
  if (p.includes("electric") || p.includes("energy") || p.includes("edf") || p.includes("gas") || p.includes("water")) return "utility";
  return "subscription";
}

function getContractStatus(facts: ContractFacts | undefined): "active" | "expiring" | "expired" {
  if (!facts?.renewal_date) return "active";
  const renewal = parseISO(facts.renewal_date);
  const days = differenceInDays(renewal, new Date());
  if (days < 0) return "expired";
  if (days <= (facts.notice_period_days ?? 30)) return "expiring";
  return "active";
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState<ContractWithFacts[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"cost" | "date" | "provider">("provider");
  const { toast } = useToast();

  const fetchContracts = () =>
    fetch("/api/contracts")
      .then((r) => r.json())
      .then((data) => setContracts(data.contracts ?? []))
      .catch(() => setContracts([]))
      .finally(() => setLoading(false));

  useEffect(() => {
    fetchContracts();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.set("file", file);
    try {
      const res = await fetch("/api/contracts", { method: "POST", body: formData });
      if (res.ok) {
        setUploadOpen(false);
        await fetchContracts();
        toast({ title: "Contract uploaded", variant: "success" });
      }
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/contracts/${id}`, { method: "DELETE" });
    if (res.ok) {
      setContracts((prev) => prev.filter((c) => c.id !== id));
      toast({ title: "Contract deleted", variant: "success" });
    } else {
      toast({ title: "Delete failed", variant: "error" });
    }
    setDeleteId(null);
  };

  const filtered = useMemo(() => {
    let result = contracts;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          (c.facts?.provider ?? c.filename).toLowerCase().includes(q)
      );
    }
    if (categoryFilter !== "all") {
      result = result.filter(
        (c) => getCategoryFromProvider(c.facts?.provider ?? "") === categoryFilter
      );
    }
    if (statusFilter !== "all") {
      result = result.filter((c) => getContractStatus(c.facts) === statusFilter);
    }
    result = [...result].sort((a, b) => {
      if (sortBy === "cost") return (b.facts?.monthly_cost ?? 0) - (a.facts?.monthly_cost ?? 0);
      if (sortBy === "date") return (a.facts?.renewal_date ?? "").localeCompare(b.facts?.renewal_date ?? "");
      return (a.facts?.provider ?? a.filename).localeCompare(b.facts?.provider ?? b.filename);
    });
    return result;
  }, [contracts, search, categoryFilter, statusFilter, sortBy]);

  if (loading) {
    return (
      <div className="container max-w-6xl mx-auto space-y-10 px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-9 w-36" />
        </div>
        <div className="grid grid-cols-1 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto space-y-6 px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="font-pixel text-2xl text-foreground">Contracts</h1>
        </div>
        <div className="flex gap-2">
          <Button className="font-pixel text-xs" variant="outline" onClick={() => setManualOpen(true)}>
            <Plus className="mr-2 size-4" />
            Add manually
          </Button>
          <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
            <DialogTrigger asChild>
              <Button className="font-pixel text-xs">
                <Upload className="mr-2 size-4" />
                Upload contract
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-pixel text-sm">Upload contract (PDF or text)</DialogTitle>
                <CardDescription>PDF will be parsed and key terms extracted.</CardDescription>
              </DialogHeader>
              <div className="pt-4">
                <Label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-8 hover:bg-muted/50">
                  <input
                    type="file"
                    accept=".pdf,.txt"
                    className="hidden"
                    disabled={uploading}
                    onChange={handleUpload}
                  />
                  <span className="font-pixel text-xs">{uploading ? "Processing…" : "Drop PDF or click"}</span>
                </Label>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search/Filter toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            className="pl-9 font-pixel text-xs h-9"
            placeholder="Search provider…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="h-9 rounded-md border border-border bg-background px-3 font-pixel text-xs text-foreground"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="all">All categories</option>
          <option value="insurance">Insurance</option>
          <option value="telecom">Telecom</option>
          <option value="utility">Utility</option>
          <option value="subscription">Subscription</option>
        </select>
        <select
          className="h-9 rounded-md border border-border bg-background px-3 font-pixel text-xs text-foreground"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="expiring">Expiring soon</option>
          <option value="expired">Expired</option>
        </select>
        <select
          className="h-9 rounded-md border border-border bg-background px-3 font-pixel text-xs text-foreground"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as "cost" | "date" | "provider")}
        >
          <option value="provider">Sort: Provider</option>
          <option value="cost">Sort: Cost</option>
          <option value="date">Sort: Renewal date</option>
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filtered.map((c) => (
          <ContractCard
            key={c.id}
            contract={c}
            expanded={expandedId === c.id}
            onToggle={() => setExpandedId(expandedId === c.id ? null : c.id)}
            onDelete={() => setDeleteId(c.id)}
          />
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="text-muted-foreground">
          {contracts.length === 0
            ? "No contracts yet. Upload a PDF to get started."
            : "No contracts match your filters."}
        </p>
      )}

      {/* Manual entry dialog */}
      <ManualEntryDialog
        open={manualOpen}
        onOpenChange={setManualOpen}
        onSuccess={() => { setManualOpen(false); fetchContracts(); }}
      />

      {/* Delete confirmation */}
      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-pixel text-sm">Delete contract?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This cannot be undone.</p>
          <div className="flex gap-2 pt-2">
            <Button variant="destructive" className="font-pixel text-xs" onClick={() => deleteId && handleDelete(deleteId)}>
              Delete
            </Button>
            <Button variant="ghost" className="font-pixel text-xs" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ContractCard({
  contract,
  expanded,
  onToggle,
  onDelete,
}: {
  contract: ContractWithFacts;
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const facts = contract.facts;
  const cancellationDeadline = facts?.cancellation_deadline
    ? parseISO(facts.cancellation_deadline)
    : null;
  const daysUntilDeadline = cancellationDeadline
    ? differenceInDays(cancellationDeadline, new Date())
    : null;
  const status = getContractStatus(facts);
  const category = getCategoryFromProvider(facts?.provider ?? "");
  const CategoryIcon = CATEGORY_ICONS[category] ?? <FileText className="size-4" />;

  return (
    <Card className="rounded-xl border border-border bg-card transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-muted-foreground shrink-0">{CategoryIcon}</span>
            <CardTitle className="font-pixel text-sm truncate">{facts?.provider ?? contract.filename}</CardTitle>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {status === "active" && (
              <Badge className="font-pixel text-[10px] bg-green-600/20 text-green-600 border-green-600/30">Active</Badge>
            )}
            {status === "expiring" && (
              <Badge className="font-pixel text-[10px] bg-amber-500/20 text-amber-600 border-amber-500/30">Expiring Soon</Badge>
            )}
            {status === "expired" && (
              <Badge variant="destructive" className="font-pixel text-[10px]">Expired</Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>
        <CardDescription>
          €{facts?.monthly_cost?.toFixed(2) ?? "—"} / month
          {facts?.renewal_date && ` · Renews ${format(parseISO(facts.renewal_date), "dd MMM yyyy")}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {cancellationDeadline && daysUntilDeadline != null && (
          <p className="text-xs text-muted-foreground">
            {daysUntilDeadline > 0
              ? `${daysUntilDeadline} days until cancellation deadline`
              : daysUntilDeadline === 0
                ? "Cancellation deadline today"
                : "Cancellation deadline passed"}
          </p>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="font-pixel text-xs w-full justify-between"
          onClick={onToggle}
        >
          {expanded ? "Less" : "Key clauses"}
          {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </Button>
        {expanded && facts?.key_clauses && facts.key_clauses.length > 0 && (
          <ul className="list-inside list-disc space-y-1 text-xs text-muted-foreground">
            {facts.key_clauses.map((clause, i) => (
              <li key={i}>{clause}</li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function ManualEntryDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess: () => void;
}) {
  const [provider, setProvider] = useState("");
  const [cost, setCost] = useState("");
  const [renewalDate, setRenewalDate] = useState("");
  const [noticeDays, setNoticeDays] = useState("30");
  const [clauses, setClauses] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!provider) return;
    setSaving(true);
    try {
      const res = await fetch("/api/contracts/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          monthly_cost: parseFloat(cost) || 0,
          renewal_date: renewalDate || undefined,
          notice_period_days: parseInt(noticeDays) || 30,
          key_clauses: clauses ? clauses.split("\n").filter(Boolean) : [],
        }),
      });
      if (res.ok) {
        toast({ title: "Contract added", variant: "success" });
        onSuccess();
        setProvider(""); setCost(""); setRenewalDate(""); setNoticeDays("30"); setClauses("");
      } else {
        toast({ title: "Failed to save", variant: "error" });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-pixel text-sm">Add contract manually</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label className="font-pixel text-xs">Provider *</Label>
            <Input className="font-pixel text-xs" value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="e.g. Orange, AXA…" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="font-pixel text-xs">Monthly cost (€)</Label>
              <Input className="font-pixel text-xs" type="number" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-1">
              <Label className="font-pixel text-xs">Notice period (days)</Label>
              <Input className="font-pixel text-xs" type="number" value={noticeDays} onChange={(e) => setNoticeDays(e.target.value)} placeholder="30" />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="font-pixel text-xs">Renewal date</Label>
            <Input className="font-pixel text-xs" type="date" value={renewalDate} onChange={(e) => setRenewalDate(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="font-pixel text-xs">Key clauses (one per line)</Label>
            <textarea
              className="w-full rounded-md border border-border bg-background px-3 py-2 font-pixel text-xs min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              value={clauses}
              onChange={(e) => setClauses(e.target.value)}
              placeholder="Auto-renews annually&#10;30-day cancellation notice…"
            />
          </div>
          <Button className="font-pixel text-xs w-full" disabled={!provider || saving} onClick={handleSave}>
            {saving ? "Saving…" : "Save contract"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
