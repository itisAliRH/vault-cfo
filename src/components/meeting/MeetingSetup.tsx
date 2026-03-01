"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ShareableDataResponse, SharingConfig } from "@/types/meeting";

export interface MeetingSetupProps {
  onComplete: (config: SharingConfig) => void;
  className?: string;
}

export function MeetingSetup({ onComplete, className }: MeetingSetupProps) {
  const [data, setData] = useState<ShareableDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareExpenses, setShareExpenses] = useState(false);
  const [shareContracts, setShareContracts] = useState(false);
  const [shareIncome, setShareIncome] = useState(false);
  const [expenseCategories, setExpenseCategories] = useState<Set<string>>(new Set());
  const [incomeCategories, setIncomeCategories] = useState<Set<string>>(new Set());
  const [contractIds, setContractIds] = useState<Set<string>>(new Set());
  const [expenseDetailLevel, setExpenseDetailLevel] = useState<"full" | "summary">("summary");
  const [contractDetailLevel, setContractDetailLevel] = useState<"full" | "summary">("summary");
  const [incomeDetailLevel, setIncomeDetailLevel] = useState<"full" | "summary">("summary");

  useEffect(() => {
    fetch("/api/agent-meeting/shareable-data")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: ShareableDataResponse) => setData(d))
      .catch(() => setData({ expenseCategories: [], incomeCategories: [], contracts: [] }))
      .finally(() => setLoading(false));
  }, []);

  const toggleExpenseCategory = useCallback((cat: string) => {
    setExpenseCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }, []);

  const toggleIncomeCategory = useCallback((cat: string) => {
    setIncomeCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }, []);

  const toggleContract = useCallback((id: string) => {
    setContractIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleStart = useCallback(() => {
    const config: SharingConfig = {};
    if (shareExpenses && data && expenseCategories.size > 0) {
      config.shareExpenses = true;
      config.expenseCategories = Array.from(expenseCategories);
      config.expenseDetailLevel = expenseDetailLevel;
    }
    if (shareContracts && data && contractIds.size > 0) {
      config.shareContracts = true;
      config.contractIds = Array.from(contractIds);
      config.contractDetailLevel = contractDetailLevel;
    }
    if (shareIncome && data && incomeCategories.size > 0) {
      config.shareIncome = true;
      config.incomeCategories = Array.from(incomeCategories);
      config.incomeDetailLevel = incomeDetailLevel;
    }
    onComplete(config);
  }, [
    shareExpenses,
    shareContracts,
    shareIncome,
    expenseCategories,
    incomeCategories,
    contractIds,
    expenseDetailLevel,
    contractDetailLevel,
    incomeDetailLevel,
    data,
    onComplete,
  ]);

  if (loading) {
    return (
      <Card className={cn("border border-border", className)}>
        <CardContent className="py-8 text-center text-sm text-muted-foreground font-pixel">
          Loading your data…
        </CardContent>
      </Card>
    );
  }

  const hasOptions =
    (data?.expenseCategories?.length ?? 0) > 0 ||
    (data?.incomeCategories?.length ?? 0) > 0 ||
    (data?.contracts?.length ?? 0) > 0;

  return (
    <Card className={cn("border border-border", className)}>
      <CardHeader>
        <CardTitle className="font-pixel text-base">
          Share data with your consultant (optional)
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Choose what financial data the consultant can see during the meeting. You can share nothing and still have the conversation.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasOptions && (
          <p className="text-sm text-muted-foreground">
            No expenses, income, or contracts in your vault yet. Start the meeting without sharing data.
          </p>
        )}

        {hasOptions && (
          <>
            {/* Share toggles */}
            <div className="space-y-3">
              {data!.expenseCategories.length > 0 && (
                <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
                  <Label htmlFor="share-expenses" className="font-pixel text-sm cursor-pointer">
                    Share expenses
                  </Label>
                  <input
                    id="share-expenses"
                    type="checkbox"
                    checked={shareExpenses}
                    onChange={(e) => setShareExpenses(e.target.checked)}
                    className="h-4 w-4 rounded border-border"
                  />
                </div>
              )}
              {shareExpenses && data!.expenseCategories.length > 0 && (
                <div className="ml-4 space-y-2 rounded-lg bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Categories to share</p>
                  <div className="flex flex-wrap gap-2">
                    {data!.expenseCategories.map((cat) => (
                      <label key={cat} className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={expenseCategories.has(cat)}
                          onChange={() => toggleExpenseCategory(cat)}
                          className="h-3.5 w-3.5 rounded border-border"
                        />
                        <span className="text-xs">{cat}</span>
                      </label>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-xs text-muted-foreground">Detail:</span>
                    <button
                      type="button"
                      onClick={() => setExpenseDetailLevel("summary")}
                      className={cn(
                        "rounded px-2 py-0.5 text-xs font-pixel",
                        expenseDetailLevel === "summary"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                    >
                      Summary
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpenseDetailLevel("full")}
                      className={cn(
                        "rounded px-2 py-0.5 text-xs font-pixel",
                        expenseDetailLevel === "full"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                    >
                      Full data
                    </button>
                  </div>
                </div>
              )}

              {data!.contracts.length > 0 && (
                <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
                  <Label htmlFor="share-contracts" className="font-pixel text-sm cursor-pointer">
                    Share contracts
                  </Label>
                  <input
                    id="share-contracts"
                    type="checkbox"
                    checked={shareContracts}
                    onChange={(e) => setShareContracts(e.target.checked)}
                    className="h-4 w-4 rounded border-border"
                  />
                </div>
              )}
              {shareContracts && data!.contracts.length > 0 && (
                <div className="ml-4 space-y-2 rounded-lg bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Contracts to share</p>
                  <div className="flex flex-wrap gap-2">
                    {data!.contracts.map((c) => (
                      <label key={c.id} className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={contractIds.has(c.id)}
                          onChange={() => toggleContract(c.id)}
                          className="h-3.5 w-3.5 rounded border-border"
                        />
                        <span className="text-xs">{c.provider}</span>
                      </label>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-xs text-muted-foreground">Detail:</span>
                    <button
                      type="button"
                      onClick={() => setContractDetailLevel("summary")}
                      className={cn(
                        "rounded px-2 py-0.5 text-xs font-pixel",
                        contractDetailLevel === "summary"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                    >
                      Summary
                    </button>
                    <button
                      type="button"
                      onClick={() => setContractDetailLevel("full")}
                      className={cn(
                        "rounded px-2 py-0.5 text-xs font-pixel",
                        contractDetailLevel === "full"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                    >
                      Full data
                    </button>
                  </div>
                </div>
              )}

              {data!.incomeCategories.length > 0 && (
                <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
                  <Label htmlFor="share-income" className="font-pixel text-sm cursor-pointer">
                    Share income
                  </Label>
                  <input
                    id="share-income"
                    type="checkbox"
                    checked={shareIncome}
                    onChange={(e) => setShareIncome(e.target.checked)}
                    className="h-4 w-4 rounded border-border"
                  />
                </div>
              )}
              {shareIncome && data!.incomeCategories.length > 0 && (
                <div className="ml-4 space-y-2 rounded-lg bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Categories to share</p>
                  <div className="flex flex-wrap gap-2">
                    {data!.incomeCategories.map((cat) => (
                      <label key={cat} className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={incomeCategories.has(cat)}
                          onChange={() => toggleIncomeCategory(cat)}
                          className="h-3.5 w-3.5 rounded border-border"
                        />
                        <span className="text-xs">{cat}</span>
                      </label>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-xs text-muted-foreground">Detail:</span>
                    <button
                      type="button"
                      onClick={() => setIncomeDetailLevel("summary")}
                      className={cn(
                        "rounded px-2 py-0.5 text-xs font-pixel",
                        incomeDetailLevel === "summary"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                    >
                      Summary
                    </button>
                    <button
                      type="button"
                      onClick={() => setIncomeDetailLevel("full")}
                      className={cn(
                        "rounded px-2 py-0.5 text-xs font-pixel",
                        incomeDetailLevel === "full"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                    >
                      Full data
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        <div className="flex flex-wrap gap-2 pt-2">
          <Button
            onClick={handleStart}
            className="font-pixel bg-orange-500 hover:bg-orange-600"
          >
            Start meeting
          </Button>
          <Button
            variant="ghost"
            onClick={() => onComplete({})}
            className="font-pixel text-xs"
          >
            Skip and start without sharing
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
