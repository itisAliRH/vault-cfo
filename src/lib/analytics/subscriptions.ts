import { getTransactions } from "@/lib/db";
import { subMonths, format } from "date-fns";

export interface Subscription {
  merchant: string;
  monthlyAmount: number;
  count: number;
}

const TOLERANCE_DAYS = 3;

export function detectSubscriptions(months = 6): Subscription[] {
  const end = format(new Date(), "yyyy-MM-dd");
  const start = format(subMonths(new Date(), months), "yyyy-MM-dd");
  const transactions = getTransactions({ startDate: start, endDate: end });

  const byMerchant: Record<string, { amounts: number[]; dates: string[] }> = {};
  for (const tx of transactions) {
    if (tx.amount >= 0) continue;
    const abs = Math.abs(tx.amount);
    const m = tx.merchant.trim() || "Unknown";
    if (!byMerchant[m]) byMerchant[m] = { amounts: [], dates: [] };
    byMerchant[m].amounts.push(abs);
    byMerchant[m].dates.push(tx.date);
  }

  const subs: Subscription[] = [];
  for (const [merchant, data] of Object.entries(byMerchant)) {
    if (data.dates.length < 2) continue;
    const sortedDates = data.dates.slice().sort();
    let recurring = true;
    for (let i = 1; i < sortedDates.length; i++) {
      const prev = new Date(sortedDates[i - 1]);
      const curr = new Date(sortedDates[i]);
      const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays < 28 - TOLERANCE_DAYS || diffDays > 31 + TOLERANCE_DAYS) {
        recurring = false;
        break;
      }
    }
    if (recurring) {
      const monthlyAmount = data.amounts.reduce((a, b) => a + b, 0) / (months || 1);
      subs.push({ merchant, monthlyAmount, count: data.dates.length });
    }
  }
  return subs.sort((a, b) => b.monthlyAmount - a.monthlyAmount);
}
