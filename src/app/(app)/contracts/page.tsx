"use client";

import { useEffect, useState } from "react";
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
import { ChevronDown, ChevronUp, Upload } from "lucide-react";
import { Label } from "@/components/ui/label";
import type { ContractFacts } from "@/types";

interface ContractWithFacts {
  id: string;
  filename: string;
  uploaded_at: string;
  facts?: ContractFacts;
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState<ContractWithFacts[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetch("/api/contracts")
      .then((r) => r.json())
      .then((data) => setContracts(data.contracts ?? []))
      .catch(() => setContracts([]))
      .finally(() => setLoading(false));
  }, [uploadOpen]);

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
        const data = await fetch("/api/contracts").then((r) => r.json());
        setContracts(data.contracts ?? []);
      }
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  if (loading) {
    return (
      <div className="container flex min-h-[50vh] items-center justify-center p-8">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="container space-y-8 p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-pixel text-2xl text-primary">Contracts</h1>
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {contracts.map((c) => (
          <ContractCard
            key={c.id}
            contract={c}
            expanded={expandedId === c.id}
            onToggle={() => setExpandedId(expandedId === c.id ? null : c.id)}
          />
        ))}
      </div>
      {contracts.length === 0 && (
        <p className="text-muted-foreground">No contracts yet. Upload a PDF to get started.</p>
      )}
    </div>
  );
}

function ContractCard({
  contract,
  expanded,
  onToggle,
}: {
  contract: ContractWithFacts;
  expanded: boolean;
  onToggle: () => void;
}) {
  const facts = contract.facts;
  const cancellationDeadline = facts?.cancellation_deadline
    ? parseISO(facts.cancellation_deadline)
    : null;
  const daysUntilDeadline = cancellationDeadline
    ? differenceInDays(cancellationDeadline, new Date())
    : null;
  const inCancellationWindow = daysUntilDeadline != null && daysUntilDeadline >= 0 && daysUntilDeadline <= (facts?.notice_period_days ?? 30);

  return (
    <Card className="pixel-border">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="font-pixel text-sm">{facts?.provider ?? contract.filename}</CardTitle>
          {inCancellationWindow && (
            <Badge variant="destructive" className="font-pixel text-[10px]">
              Renewal warning
            </Badge>
          )}
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
