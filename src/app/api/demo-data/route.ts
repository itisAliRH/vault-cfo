import { NextRequest, NextResponse } from "next/server";
import { generateDemoData, transactionsToCSV, type DemoPreset } from "@/lib/demo-data/generate";
import { insertTransaction, getDb } from "@/lib/db";
import { invalidateInsightsCache } from "@/app/api/insights/route";
import { randomUUID } from "node:crypto";

const VALID_PRESETS: DemoPreset[] = ["doctor", "lawyer", "engineer", "student"];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { preset?: string; useAI?: boolean };
    const preset = (body.preset ?? "engineer") as DemoPreset;
    if (!VALID_PRESETS.includes(preset)) {
      return NextResponse.json({ error: "Invalid preset" }, { status: 400 });
    }

    const { transactions, contracts } = generateDemoData(preset);

    // Insert transactions
    for (const tx of transactions) {
      insertTransaction({
        id: randomUUID(),
        date: tx.date,
        merchant: tx.merchant,
        amount: tx.amount,
        category: tx.category,
        currency: "EUR",
        recurring: false,
      });
    }
    invalidateInsightsCache();

    // Insert contracts
    const db = getDb();
    for (const contract of contracts) {
      const id = randomUUID();
      const now = new Date().toISOString();
      db.prepare(`INSERT INTO contracts (id, filename, uploaded_at) VALUES (?, ?, ?)`).run(
        id,
        `${contract.provider}.txt`,
        now
      );
      db.prepare(`
        INSERT INTO contract_facts (contract_id, provider, monthly_cost, currency, renewal_date, notice_period_days, key_clauses)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        contract.provider,
        contract.monthly_cost,
        "EUR",
        contract.renewal_date,
        contract.notice_period_days,
        JSON.stringify(contract.key_clauses)
      );
    }

    return NextResponse.json({
      ok: true,
      transactions: transactions.length,
      contracts: contracts.length,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to generate demo data" }, { status: 500 });
  }
}
