import { NextRequest, NextResponse } from "next/server";
import { generateDemoData, getDemoSeed, type DemoPreset } from "@/lib/demo-data/generate";
import {
  insertTransactions,
  getDb,
  getRecentInsights,
} from "@/lib/db";
import { invalidateInsightsCache } from "@/app/api/insights/route";
import { computeBudgetSummary } from "@/lib/analytics/budget";
import { detectSpendingSpikes } from "@/lib/analytics/spikes";
import { detectSubscriptions } from "@/lib/analytics/subscriptions";
import { randomUUID } from "node:crypto";

const VALID_PRESETS: DemoPreset[] = ["doctor", "lawyer", "engineer", "student"];

/** Cache generated demo payload per preset so repeat requests are instant. */
const demoDataCache = new Map<
  DemoPreset,
  { transactions: Awaited<ReturnType<typeof generateDemoData>>["transactions"]; contracts: Awaited<ReturnType<typeof generateDemoData>>["contracts"] }
>();

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { preset?: string; useAI?: boolean };
    const preset = (body.preset ?? "engineer") as DemoPreset;
    if (!VALID_PRESETS.includes(preset)) {
      return NextResponse.json({ error: "Invalid preset" }, { status: 400 });
    }

    let transactions: Awaited<ReturnType<typeof generateDemoData>>["transactions"];
    let contracts: Awaited<ReturnType<typeof generateDemoData>>["contracts"];
    const cached = demoDataCache.get(preset);
    if (cached) {
      transactions = cached.transactions;
      contracts = cached.contracts;
    } else {
      const out = generateDemoData(preset, getDemoSeed(preset));
      transactions = out.transactions;
      contracts = out.contracts;
      demoDataCache.set(preset, { transactions, contracts });
    }

    const txRows = transactions.map((tx) => ({
      id: randomUUID(),
      date: tx.date,
      merchant: tx.merchant,
      amount: tx.amount,
      category: tx.category,
      currency: "EUR" as const,
      recurring: false as const,
    }));
    insertTransactions(txRows);
    invalidateInsightsCache();

    const db = getDb();
    const insertContract = db.prepare(
      `INSERT INTO contracts (id, filename, uploaded_at) VALUES (?, ?, ?)`
    );
    const insertFacts = db.prepare(`
      INSERT INTO contract_facts (contract_id, provider, monthly_cost, currency, renewal_date, notice_period_days, key_clauses)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    db.transaction(() => {
      for (const contract of contracts) {
        const id = randomUUID();
        const now = new Date().toISOString();
        insertContract.run(id, `${contract.provider}.txt`, now);
        insertFacts.run(
          id,
          contract.provider,
          contract.monthly_cost,
          "EUR",
          contract.renewal_date,
          contract.notice_period_days,
          JSON.stringify(contract.key_clauses)
        );
      }
    })();

    const months = 6;
    const budget = computeBudgetSummary(months);
    const spikes = detectSpendingSpikes(months);
    const subscriptions = detectSubscriptions(months);
    const recentInsights = getRecentInsights(5);
    const insights = { budget, spikes, subscriptions, recentInsights };

    return NextResponse.json({
      ok: true,
      transactions: transactions.length,
      contracts: contracts.length,
      insights,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to generate demo data" },
      { status: 500 }
    );
  }
}
