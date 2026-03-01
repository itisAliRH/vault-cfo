"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TimeRangeSelector } from "@/components/charts/TimeRangeSelector";
import type { BudgetSummary } from "@/lib/analytics/budget";
import type { SpendingSpike } from "@/lib/analytics/spikes";
import type { Subscription } from "@/lib/analytics/subscriptions";

interface InsightsData {
  budget: BudgetSummary;
  spikes: SpendingSpike[];
  subscriptions: Subscription[];
}

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function InsightsPage() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [months, setMonths] = useState(6);

  useEffect(() => {
    setData(null);
    setError(null);
    fetch(`/api/insights?months=${months}`)
      .then((r) => r.json())
      .then((d) => setData(d as InsightsData))
      .catch(() => setError("Failed to load insights."));
  }, [months]);

  return (
    <div className="container max-w-6xl mx-auto space-y-8 px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="font-pixel text-2xl text-foreground">Insights</h1>
          <p className="text-muted-foreground text-sm">AI-powered analysis of your finances.</p>
        </div>
        <TimeRangeSelector value={months} onChange={setMonths} />
      </div>

      {error && (
        <p className="text-destructive text-sm">{error}</p>
      )}

      {!data && !error && (
        <div className="grid gap-6">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-36 w-full rounded-xl" />
          <Skeleton className="h-36 w-full rounded-xl" />
        </div>
      )}

      {data && (
        <div className="grid gap-6">
          {/* Budget Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="font-pixel text-sm">Budget Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center mb-6">
                <div className="min-w-0">
                  <p className="font-pixel text-xs text-muted-foreground mb-1">INCOME</p>
                  <p className="text-base font-semibold text-green-600 dark:text-green-400 truncate">
                    €{fmt(data.budget.totalIncome)}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="font-pixel text-xs text-muted-foreground mb-1">EXPENSES</p>
                  <p className="text-base font-semibold text-red-500 truncate">
                    €{fmt(data.budget.totalExpenses)}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="font-pixel text-xs text-muted-foreground mb-1">NET</p>
                  <p className={`text-base font-semibold truncate ${data.budget.netCashflow >= 0 ? "text-green-600 dark:text-green-400" : "text-red-500"}`}>
                    €{fmt(data.budget.netCashflow)}
                  </p>
                </div>
              </div>

              {data.budget.byCategory.length > 0 && (
                <>
                  <p className="font-pixel text-xs text-muted-foreground mb-2">TOP CATEGORIES</p>
                  <div className="space-y-2 pr-4">
                    {data.budget.byCategory.slice(0, 6).map((c) => (
                      <div key={c.category} className="flex items-center gap-3">
                        <span className="text-sm text-foreground min-w-0 w-36 shrink-0 truncate">{c.category}</span>
                        <div className="flex-1 min-w-0 bg-muted rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-orange-500 rounded-full"
                            style={{
                              width: `${Math.min(100, (c.total / data.budget.totalExpenses) * 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground min-w-[5.5rem] w-28 text-right shrink-0 tabular-nums">
                          €{fmt(c.total)}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {data.budget.byCategory.length === 0 && (
                <p className="text-muted-foreground text-sm">No expense data yet. Import transactions to see category breakdown.</p>
              )}
            </CardContent>
          </Card>

          {/* Spending Spikes */}
          <Card>
            <CardHeader>
              <CardTitle className="font-pixel text-sm">Spending Spikes</CardTitle>
            </CardHeader>
            <CardContent>
              {data.spikes.length === 0 ? (
                <p className="text-muted-foreground text-sm">No unusual spending detected this month.</p>
              ) : (
                <div className="space-y-3">
                  {data.spikes.map((s) => (
                    <div key={s.category} className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
                      <div>
                        <p className="font-medium text-sm">{s.category}</p>
                        <p className="text-xs text-muted-foreground">
                          3-mo avg: €{fmt(s.threeMonthAvg)} → this month: €{fmt(s.currentMonthTotal)}
                        </p>
                      </div>
                      <span className="font-pixel text-xs text-red-500">+{s.percentIncrease}%</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recurring Subscriptions */}
          <Card>
            <CardHeader>
              <CardTitle className="font-pixel text-sm">Recurring Subscriptions</CardTitle>
            </CardHeader>
            <CardContent>
              {data.subscriptions.length === 0 ? (
                <p className="text-muted-foreground text-sm">No recurring subscriptions detected.</p>
              ) : (
                <div className="space-y-2">
                  {data.subscriptions.map((s) => (
                    <div key={s.merchant} className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
                      <div>
                        <p className="font-medium text-sm">{s.merchant}</p>
                        <p className="text-xs text-muted-foreground">{s.count} payments detected</p>
                      </div>
                      <span className="text-sm font-semibold">€{fmt(s.monthlyAmount)}/mo</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
