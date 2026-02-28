import { NextRequest, NextResponse } from "next/server";
import { insertTransaction, getTransactions } from "@/lib/db";
import { parseCSV, parseJSON } from "@/lib/ingest/csv";
import { randomUUID } from "node:crypto";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate") ?? undefined;
    const endDate = searchParams.get("endDate") ?? undefined;
    const transactions = getTransactions({ startDate, endDate });
    return NextResponse.json({ transactions });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to list transactions" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }
    const text = await file.text();
    const name = (file.name ?? "").toLowerCase();
    const rows = name.endsWith(".json") ? parseJSON(text) : parseCSV(text);
    for (const row of rows) {
      insertTransaction({
        id: randomUUID(),
        date: row.date,
        merchant: row.merchant,
        amount: row.amount,
        category: row.category,
        currency: row.currency,
        recurring: row.recurring,
      });
    }
    return NextResponse.json({ ok: true, count: rows.length });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to import transactions" }, { status: 500 });
  }
}
