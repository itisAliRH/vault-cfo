import { getTransactions } from "@/lib/db";
import { startOfMonth, subMonths, format } from "date-fns";

export interface SpendingSpike {
  category: string;
  currentMonthTotal: number;
  threeMonthAvg: number;
  percentIncrease: number;
}

export function detectSpendingSpikes(months = 3): SpendingSpike[] {
  const now = new Date();
  const threeMonthsAgo = format(startOfMonth(subMonths(now, months)), "yyyy-MM-dd");
  const transactions = getTransactions({ startDate: threeMonthsAgo, endDate: format(now, "yyyy-MM-dd") });

  const byCategoryThisMonth: Record<string, number> = {};
  const byCategoryPrevMonths: Record<string, number> = {};
  const currentMonth = format(now, "yyyy-MM");

  for (const tx of transactions) {
    if (tx.amount >= 0) continue;
    const abs = Math.abs(tx.amount);
    const month = tx.date.slice(0, 7);
    if (month === currentMonth) {
      byCategoryThisMonth[tx.category] = (byCategoryThisMonth[tx.category] ?? 0) + abs;
    } else {
      byCategoryPrevMonths[tx.category] = (byCategoryPrevMonths[tx.category] ?? 0) + abs;
    }
  }

  const prevMonthCount = months - 1 || 1;
  const spikes: SpendingSpike[] = [];
  for (const [category, currentTotal] of Object.entries(byCategoryThisMonth)) {
    const prevTotal = byCategoryPrevMonths[category] ?? 0;
    const avg = prevTotal / prevMonthCount;
    if (avg === 0) continue;
    const percentIncrease = ((currentTotal - avg) / avg) * 100;
    if (percentIncrease > 30) {
      spikes.push({
        category,
        currentMonthTotal: currentTotal,
        threeMonthAvg: avg,
        percentIncrease: Math.round(percentIncrease),
      });
    }
  }
  return spikes.sort((a, b) => b.percentIncrease - a.percentIncrease);
}
