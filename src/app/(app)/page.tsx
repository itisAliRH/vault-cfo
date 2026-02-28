"use client";

import { useEffect, useState } from "react";
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
import { Label } from "@/components/ui/label";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { useToast } from "@/components/ui/toast";

interface InsightsData {
  budget: {
    totalIncome: number;
    totalExpenses: number;
    netCashflow: number;
    byCategory: { category: string; total: number }[];
    months: { month: string; income: number; expenses: number; net: number }[];
  };
  spikes: { category: string; percentIncrease: number }[];
  subscriptions: { merchant: string; monthlyAmount: number }[];
}

const chartConfig = {
  income: { color: "var(--chart-1)", label: "Income" },
  expenses: { color: "var(--destructive)", label: "Expenses" },
  net: { color: "var(--chart-2)", label: "Net" },
  total: { color: "var(--chart-1)", label: "Total" },
};

export default function DashboardPage() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetch("/api/insights?months=6")
      .then((r) => r.json().then((json) => ({ ok: r.ok, json })))
      .then(({ ok, json }) => {
        if (ok && json && typeof json.budget === "object") setData(json as InsightsData);
        else setData(null);
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [uploadOpen]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.set("file", file);
    try {
      const res = await fetch("/api/transactions", { method: "POST", body: formData });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        const message = (errBody as { error?: string }).error ?? "Failed to import transactions";
        throw new Error(message);
      }
      setUploadOpen(false);
      const res2 = await fetch("/api/insights?months=6");
      const json = await res2.json();
      if (json?.budget) setData(json as InsightsData);
      toast({
        title: "Transactions imported",
        description: "Your file was uploaded and insights were refreshed.",
        variant: "success",
      });
    } catch (err) {
      toast({
        title: "Import failed",
        description: err instanceof Error ? err.message : "Something went wrong while importing.",
        variant: "error",
      });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const loadDemoData = async () => {
    setLoadingDemo(true);
    try {
      const [csvRes, insRes, telRes] = await Promise.all([
        fetch("/demo_data/transactions_demo.csv"),
        fetch("/demo_data/contract_insurance.txt"),
        fetch("/demo_data/contract_telecom.txt"),
      ]);
      if (!csvRes.ok || !insRes.ok || !telRes.ok) throw new Error("Failed to fetch demo files");
      const csvText = await csvRes.text();
      const insText = await insRes.text();
      const telText = await telRes.text();

      const csvFile = new File([csvText], "transactions_demo.csv", { type: "text/csv" });
      const formData = new FormData();
      formData.set("file", csvFile);
      const txRes = await fetch("/api/transactions", { method: "POST", body: formData });
      if (!txRes.ok) throw new Error("Failed to import transactions");

      for (const text of [insText, telText]) {
        try {
          const contractRes = await fetch("/api/contracts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text }),
          });
          if (!contractRes.ok) {
            const errBody = await contractRes.json().catch(() => ({}));
            console.warn("Contract import failed:", errBody?.error ?? contractRes.status);
          }
        } catch {
          // best-effort: continue and refresh insights
        }
      }

      const res2 = await fetch("/api/insights?months=6");
      const json = await res2.json();
      if (json?.budget) setData(json as InsightsData);
      toast({
        title: "Demo data loaded",
        description: "Sample transactions and contracts have been imported.",
        variant: "success",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Failed to load demo data",
        description: err instanceof Error ? err.message : "Something went wrong while loading demo data.",
        variant: "error",
      });
    } finally {
      setLoadingDemo(false);
    }
  };

  const hasBudget = data?.budget && typeof data.budget.totalIncome === "number";
  if (loading || !data || !hasBudget) {
    return (
      <div className="container flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8">
        <p className="text-muted-foreground">
          {!loading
            ? "Could not load insights. Load demo data or upload transactions."
            : "Loading…"}
        </p>
        {!loading && (
          <Button className="font-pixel text-xs" variant="outline" disabled={loadingDemo} onClick={loadDemoData}>
            {loadingDemo ? "Loading…" : "Load Demo Data"}
          </Button>
        )}
      </div>
    );
  }

  const { budget, spikes, subscriptions } = data;

  return (
    <div className="container space-y-8 p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-pixel text-2xl text-primary">Dashboard</h1>
        <div className="flex gap-2">
          <Button
            className="font-pixel text-xs"
            variant="outline"
            disabled={loadingDemo}
            onClick={loadDemoData}
          >
            {loadingDemo ? "Loading…" : "Load Demo Data"}
          </Button>
          <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
            <DialogTrigger asChild>
              <Button className="font-pixel text-xs">Upload CSV / JSON</Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-pixel text-sm">Import transactions</DialogTitle>
              <CardDescription>Upload a CSV or JSON file with date, amount, merchant, category.</CardDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 pt-4">
              <Label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-8 hover:bg-muted/50">
                <input
                  type="file"
                  accept=".csv,.json"
                  className="hidden"
                  disabled={uploading}
                  onChange={handleUpload}
                />
                <span className="font-pixel text-xs">{uploading ? "Uploading…" : "Drop file or click"}</span>
              </Label>
            </div>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="pixel-border">
          <CardHeader className="pb-2">
            <CardTitle className="font-pixel text-xs text-muted-foreground">Monthly Income</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="font-pixel text-lg text-chart-1">
              €{budget.totalIncome.toLocaleString("en-US", { maximumFractionDigits: 0 })}
            </span>
          </CardContent>
        </Card>
        <Card className="pixel-border">
          <CardHeader className="pb-2">
            <CardTitle className="font-pixel text-xs text-muted-foreground">Monthly Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="font-pixel text-lg text-destructive">
              €{budget.totalExpenses.toLocaleString("en-US", { maximumFractionDigits: 0 })}
            </span>
          </CardContent>
        </Card>
        <Card className="pixel-border">
          <CardHeader className="pb-2">
            <CardTitle className="font-pixel text-xs text-muted-foreground">Net Cashflow</CardTitle>
          </CardHeader>
          <CardContent>
            <span
              className={`font-pixel text-lg ${budget.netCashflow >= 0 ? "text-chart-1" : "text-destructive"}`}
            >
              €{budget.netCashflow.toLocaleString("en-US", { maximumFractionDigits: 0 })}
            </span>
          </CardContent>
        </Card>
        <Card className="pixel-border">
          <CardHeader className="pb-2">
            <CardTitle className="font-pixel text-xs text-muted-foreground">Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="font-pixel text-lg text-chart-2">
              €
              {subscriptions
                .reduce((s, sub) => s + sub.monthlyAmount, 0)
                .toLocaleString("en-US", { maximumFractionDigits: 0 })}
            </span>
          </CardContent>
        </Card>
      </div>

      {budget.months.length > 0 && (
        <Card className="pixel-border">
          <CardHeader>
            <CardTitle className="font-pixel text-sm">6-month cashflow</CardTitle>
            <CardDescription>Income vs expenses by month</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <AreaChart data={budget.months}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="income" stroke="var(--chart-1)" fill="rgba(34, 197, 94, 0.2)" />
                <Area type="monotone" dataKey="expenses" stroke="var(--destructive)" fill="rgba(239, 68, 68, 0.2)" />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {budget.byCategory.length > 0 && (
        <Card className="pixel-border">
          <CardHeader>
            <CardTitle className="font-pixel text-sm">Spending by category</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <BarChart data={budget.byCategory.slice(0, 8)} layout="vertical" margin={{ left: 0 }}>
                <XAxis type="number" />
                <YAxis type="category" dataKey="category" width={80} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="total" fill="var(--chart-2)" radius={[0, 2, 2, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {spikes.length > 0 && (
        <Card className="pixel-border">
          <CardHeader>
            <CardTitle className="font-pixel text-sm">Spending alerts</CardTitle>
            <CardDescription>Categories &gt;30% above 3-month average</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {spikes.map((s) => (
              <Badge key={s.category} variant="destructive" className="font-pixel text-xs">
                {s.category} +{s.percentIncrease}%
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
