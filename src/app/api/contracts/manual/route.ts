import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { randomUUID } from "node:crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      provider: string;
      monthly_cost: number;
      renewal_date?: string;
      category?: string;
      notice_period_days?: number;
      key_clauses?: string[];
    };

    if (!body.provider) {
      return NextResponse.json({ error: "Provider is required" }, { status: 400 });
    }

    const db = getDb();
    const id = randomUUID();
    const now = new Date().toISOString();

    db.prepare(`INSERT INTO contracts (id, filename, uploaded_at) VALUES (?, ?, ?)`).run(
      id,
      `${body.provider} (manual).txt`,
      now
    );

    db.prepare(`
      INSERT INTO contract_facts (contract_id, provider, monthly_cost, currency, renewal_date, notice_period_days, key_clauses)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      body.provider,
      body.monthly_cost ?? 0,
      "EUR",
      body.renewal_date ?? null,
      body.notice_period_days ?? 30,
      JSON.stringify(body.key_clauses ?? [])
    );

    return NextResponse.json({ ok: true, id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create contract" }, { status: 500 });
  }
}
