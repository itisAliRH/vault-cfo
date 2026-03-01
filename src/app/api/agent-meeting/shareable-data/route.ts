import { NextRequest, NextResponse } from "next/server";
import {
  getTransactions,
  getAllContractsWithFacts,
} from "@/lib/db";
import type { ShareableDataResponse, SharingConfig } from "@/types/meeting";

/** GET: return list of categories and contracts available for sharing (no actual data). */
export async function GET() {
  try {
    const transactions = getTransactions();
    const contractsWithFacts = getAllContractsWithFacts();

    const expenseCategories = Array.from(
      new Set(
        transactions
          .filter((t) => t.amount < 0)
          .map((t) => t.category)
          .filter(Boolean)
      )
    ).sort();

    const incomeCategories = Array.from(
      new Set(
        transactions
          .filter((t) => t.amount > 0)
          .map((t) => t.category)
          .filter(Boolean)
      )
    ).sort();

    const contracts = contractsWithFacts.map((c) => ({
      id: c.id,
      provider: c.facts?.provider ?? c.filename ?? "Unknown",
    }));

    return NextResponse.json({
      expenseCategories,
      incomeCategories,
      contracts,
    } as ShareableDataResponse);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to load shareable data" },
      { status: 500 }
    );
  }
}

/** POST: given sharing config, return context string for the agent (full or summary). */
export async function POST(request: NextRequest) {
  try {
    const config = (await request.json()) as SharingConfig;
    const parts: string[] = [];

    if (config.shareExpenses && config.expenseCategories?.length) {
      const transactions = getTransactions();
      const expenseTx = transactions.filter(
        (t) => t.amount < 0 && config.expenseCategories!.includes(t.category)
      );
      if (config.expenseDetailLevel === "summary") {
        const byCategory: Record<string, { total: number; count: number; currency: string }> = {};
        for (const t of expenseTx) {
          const key = t.category;
          if (!byCategory[key]) {
            byCategory[key] = { total: 0, count: 0, currency: t.currency };
          }
          byCategory[key].total += Math.abs(t.amount);
          byCategory[key].count += 1;
        }
        parts.push(
          "Expenses (summary): " +
            Object.entries(byCategory)
              .map(
                ([cat, v]) =>
                  `${cat}: ${v.total.toFixed(2)} ${v.currency} (${v.count} transactions)`
              )
              .join("; ")
        );
      } else {
        parts.push(
          "Expenses (full): " +
            JSON.stringify(
              expenseTx.map((t) => ({
                date: t.date,
                merchant: t.merchant,
                amount: t.amount,
                category: t.category,
                currency: t.currency,
              }))
            )
        );
      }
    }

    if (config.shareContracts && config.contractIds?.length) {
      const contractsWithFacts = getAllContractsWithFacts();
      const selected = contractsWithFacts.filter((c) =>
        config.contractIds!.includes(c.id)
      );
      if (config.contractDetailLevel === "summary") {
        parts.push(
          "Contracts (summary): " +
            selected
              .map(
                (c) =>
                  `${c.facts?.provider ?? c.filename}: ${c.facts?.monthly_cost ?? "?"} ${c.facts?.currency ?? ""}/mo, renewal ${c.facts?.renewal_date ?? "?"}`
              )
              .join("; ")
        );
      } else {
        parts.push(
          "Contracts (full): " +
            JSON.stringify(
              selected.map((c) => ({
                provider: c.facts?.provider,
                monthly_cost: c.facts?.monthly_cost,
                currency: c.facts?.currency,
                renewal_date: c.facts?.renewal_date,
                notice_period_days: c.facts?.notice_period_days,
                key_clauses: c.facts?.key_clauses,
              }))
            )
        );
      }
    }

    if (config.shareIncome && config.incomeCategories?.length) {
      const transactions = getTransactions();
      const incomeTx = transactions.filter(
        (t) => t.amount > 0 && config.incomeCategories!.includes(t.category)
      );
      if (config.incomeDetailLevel === "summary") {
        const byCategory: Record<string, { total: number; count: number; currency: string }> = {};
        for (const t of incomeTx) {
          const key = t.category;
          if (!byCategory[key]) {
            byCategory[key] = { total: 0, count: 0, currency: t.currency };
          }
          byCategory[key].total += t.amount;
          byCategory[key].count += 1;
        }
        parts.push(
          "Income (summary): " +
            Object.entries(byCategory)
              .map(
                ([cat, v]) =>
                  `${cat}: ${v.total.toFixed(2)} ${v.currency} (${v.count} transactions)`
              )
              .join("; ")
        );
      } else {
        parts.push(
          "Income (full): " +
            JSON.stringify(
              incomeTx.map((t) => ({
                date: t.date,
                merchant: t.merchant,
                amount: t.amount,
                category: t.category,
                currency: t.currency,
              }))
            )
        );
      }
    }

    const contextForAgent =
      parts.length > 0
        ? "The user has chosen to share the following vault data with you. Use it to give personalised advice. Do not mention raw data unless the user asks.\n\n" +
          parts.join("\n\n")
        : "";

    return NextResponse.json({ contextForAgent });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to build sharing context" },
      { status: 500 }
    );
  }
}
