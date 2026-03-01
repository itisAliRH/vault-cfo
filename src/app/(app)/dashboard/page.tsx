"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ModelCard } from "@/components/docs/ModelCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingDown, Wallet, CreditCard } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";
import { TimeRangeSelector } from "@/components/charts/TimeRangeSelector";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";

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
  const [demoDialogOpen, setDemoDialogOpen] = useState(false);
  const [demoPreset, setDemoPreset] = useState<"doctor" | "lawyer" | "engineer" | "student">("engineer");
  const [months, setMonths] = useState(6);
  const { toast } = useToast();

  useEffect(() => {
    setLoading(true);
    fetch(`/api/insights?months=${months}`)
      .then((r) => r.json().then((json) => ({ ok: r.ok, json })))
      .then(({ ok, json }) => {
        if (ok && json && typeof json.budget === "object") setData(json as InsightsData);
        else setData(null);
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [uploadOpen, months]);

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

  const loadDemoData = async (preset: "doctor" | "lawyer" | "engineer" | "student" = demoPreset) => {
    setLoadingDemo(true);
    setDemoDialogOpen(false);
    try {
      const res = await fetch("/api/demo-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preset }),
      });
      if (!res.ok) throw new Error("Failed to generate demo data");

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
  if (loading) {
    return (
      <div className="container max-w-6xl mx-auto space-y-10 px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <Skeleton className="h-8 w-40" />
          <div className="flex gap-3">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-36" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!data || !hasBudget) {
    return (
      <div className="container max-w-6xl mx-auto flex min-h-[50vh] flex-col items-center justify-center gap-6 px-6 py-12">
        <p className="text-muted-foreground text-center">
          Could not load insights. Load demo data or upload transactions.
        </p>
        <Button className="font-pixel text-xs" variant="outline" disabled={loadingDemo} onClick={() => setDemoDialogOpen(true)}>
          {loadingDemo ? "Loading…" : "Load Demo Data"}
        </Button>
      </div>
    );
  }

  const { budget, spikes, subscriptions } = data;

  return (
    <div className="container max-w-6xl mx-auto space-y-10 px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="font-pixel text-2xl text-foreground">Dashboard</h1>
        </div>
        <div className="flex items-center gap-3">
          <TimeRangeSelector value={months} onChange={setMonths} />
          <Dialog open={demoDialogOpen} onOpenChange={setDemoDialogOpen}>
            <DialogTrigger asChild>
              <Button className="font-pixel text-xs" variant="outline" disabled={loadingDemo}>
                {loadingDemo ? "Loading…" : "Load Demo Data"}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-pixel text-sm">Load Demo Data</DialogTitle>
                <CardDescription>Choose a profile to generate realistic sample data.</CardDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-3 pt-4">
                {(["doctor", "lawyer", "engineer", "student"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setDemoPreset(p)}
                    className={`rounded-lg border-2 p-4 text-left font-pixel text-xs transition-colors ${
                      demoPreset === p
                        ? "border-primary bg-primary/20"
                        : "border-border hover:border-muted-foreground/50 hover:bg-muted/30"
                    }`}
                  >
                    <div className="text-sm font-bold capitalize">{p}</div>
                    <div className="text-muted-foreground text-[10px] mt-1">
                      {p === "doctor" ? "€8,000/mo" : p === "lawyer" ? "€7,000/mo" : p === "engineer" ? "€5,500/mo" : "€1,200/mo"}
                    </div>
                  </button>
                ))}
              </div>
              <Button
                className="font-pixel text-xs mt-2"
                disabled={loadingDemo}
                onClick={() => loadDemoData(demoPreset)}
              >
                Generate {demoPreset} data
              </Button>
            </DialogContent>
          </Dialog>
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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <ModelCard
          title="Monthly Income"
          icon={<DollarSign className="size-8" />}
          variant="orange"
        >
          <span className="font-pixel text-lg text-chart-1">
            €{budget.totalIncome.toLocaleString("en-US", { maximumFractionDigits: 0 })}
          </span>
        </ModelCard>
        <ModelCard
          title="Monthly Expenses"
          icon={<TrendingDown className="size-8" />}
          variant="red"
        >
          <span className="font-pixel text-lg text-destructive">
            €{budget.totalExpenses.toLocaleString("en-US", { maximumFractionDigits: 0 })}
          </span>
        </ModelCard>
        <ModelCard
          title="Net Cashflow"
          icon={<Wallet className="size-8" />}
          variant={budget.netCashflow >= 0 ? "amber" : "red"}
        >
          <span
            className={`font-pixel text-lg ${budget.netCashflow >= 0 ? "text-chart-1" : "text-destructive"}`}
          >
            €{budget.netCashflow.toLocaleString("en-US", { maximumFractionDigits: 0 })}
          </span>
        </ModelCard>
        <ModelCard
          title="Subscriptions"
          icon={<CreditCard className="size-8" />}
          variant="yellow"
        >
          <span className="font-pixel text-lg text-chart-2">
            €
            {subscriptions
              .reduce((s, sub) => s + sub.monthlyAmount, 0)
              .toLocaleString("en-US", { maximumFractionDigits: 0 })}
          </span>
        </ModelCard>
      </div>

      {budget.months.length > 0 && (
        <Card className="rounded-xl border border-border bg-card transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
          <CardHeader className="px-6 pt-6 pb-2">
            <CardTitle className="font-pixel text-sm">{months}-month cashflow</CardTitle>
            <CardDescription>Income vs expenses by month</CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <AreaChart data={budget.months}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="income" stroke="var(--chart-1)" fill="rgba(234, 88, 12, 0.2)" />
                <Area type="monotone" dataKey="expenses" stroke="var(--destructive)" fill="rgba(239, 68, 68, 0.2)" />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {budget.byCategory.length > 0 && (
        <Card className="rounded-xl border border-border bg-card transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
          <CardHeader className="px-6 pt-6 pb-2">
            <CardTitle className="font-pixel text-sm">Spending by category</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <Tabs defaultValue="bar">
              <TabsList className="mb-4">
                <TabsTrigger value="bar" className="font-pixel text-xs">Bar</TabsTrigger>
                <TabsTrigger value="pie" className="font-pixel text-xs">Pie</TabsTrigger>
              </TabsList>
              <TabsContent value="bar">
                <ChartContainer config={chartConfig} className="h-[200px] w-full">
                  <BarChart data={budget.byCategory.slice(0, 8)} layout="vertical" margin={{ left: 0 }}>
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="category" width={80} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="total" fill="var(--chart-2)" radius={[0, 2, 2, 0]} />
                  </BarChart>
                </ChartContainer>
              </TabsContent>
              <TabsContent value="pie">
                <ChartContainer config={chartConfig} className="h-[240px] w-full">
                  <PieChart>
                    <Pie
                      data={budget.byCategory.slice(0, 8)}
                      dataKey="total"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {budget.byCategory.slice(0, 8).map((_, index) => (
                        <Cell
                          key={index}
                          fill={`hsl(${(index * 47) % 360}, 65%, 55%)`}
                        />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ChartContainer>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {spikes.length > 0 && (
        <Card className="rounded-xl border border-border bg-card transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
          <CardHeader className="px-6 pt-6 pb-2">
            <CardTitle className="font-pixel text-sm">Spending alerts</CardTitle>
            <CardDescription>Categories &gt;30% above 3-month average</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2 px-6 pb-6">
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
