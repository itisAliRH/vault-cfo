import Papa from "papaparse";

const COLUMN_ALIASES: Record<string, string[]> = {
  date: ["date", "datum", "transaction date", "booking date"],
  amount: ["amount", "betrag", "montant", "value", "sum"],
  merchant: ["merchant", "description", "payee", "name", "details", "memo"],
  category: ["category", "kategorie", "type", "tag"],
};

function normalizeHeader(header: string): string {
  const lower = header.trim().toLowerCase();
  for (const [canonical, aliases] of Object.entries(COLUMN_ALIASES)) {
    if (aliases.some((a) => lower.includes(a) || lower === a)) return canonical;
  }
  return lower.replace(/\s+/g, "_");
}

function parseAmount(value: unknown): number {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  const s = String(value ?? "").replace(/,/g, ".").replace(/[^\d.-]/g, "");
  const n = parseFloat(s);
  return Number.isNaN(n) ? 0 : n;
}

function parseDate(value: unknown): string {
  const s = String(value ?? "").trim();
  if (!s) return "";
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? s : d.toISOString().slice(0, 10);
}

export interface NormalizedRow {
  date: string;
  merchant: string;
  amount: number;
  category: string;
  currency: string;
  recurring?: boolean;
}

export function parseCSV(csvContent: string): NormalizedRow[] {
  const parsed = Papa.parse<string[]>(csvContent, { header: false, skipEmptyLines: true });
  const rows = parsed.data as string[][];
  if (rows.length < 2) return [];

  const headerRow = rows[0].map((h) => normalizeHeader(h));
  const columnIndex: Record<string, number> = {};
  headerRow.forEach((h, i) => {
    if (h && !columnIndex[h]) columnIndex[h] = i;
  });

  const dateIdx = columnIndex.date ?? columnIndex.transaction_date ?? 0;
  const amountIdx = columnIndex.amount ?? columnIndex.betrag ?? columnIndex.value ?? 1;
  const merchantIdx = columnIndex.merchant ?? columnIndex.description ?? columnIndex.payee ?? 2;
  const categoryIdx = columnIndex.category ?? columnIndex.type ?? 3;

  const result: NormalizedRow[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    const date = parseDate(row[dateIdx] ?? row[0]);
    const amount = parseAmount(row[amountIdx] ?? row[1]);
    const merchant = String(row[merchantIdx] ?? row[2] ?? "").trim() || "Unknown";
    const category = String(row[categoryIdx] ?? row[3] ?? "").trim() || "Uncategorized";
    if (!date) continue;
    result.push({
      date,
      merchant,
      amount,
      category,
      currency: "EUR",
      recurring: false,
    });
  }
  return result;
}

export function parseJSON(jsonContent: string): NormalizedRow[] {
  const data = JSON.parse(jsonContent);
  const arr = Array.isArray(data) ? data : data.transactions ?? data.items ?? [];
  return arr.map((item: Record<string, unknown>) => ({
    date: parseDate(item.date ?? item.transaction_date ?? item.datum),
    merchant: String(item.merchant ?? item.description ?? item.payee ?? "Unknown").trim(),
    amount: parseAmount(item.amount ?? item.value ?? item.betrag),
    category: String(item.category ?? item.type ?? "Uncategorized").trim(),
    currency: String(item.currency ?? "EUR").trim(),
    recurring: Boolean(item.recurring),
  })).filter((r: NormalizedRow) => r.date);
}
