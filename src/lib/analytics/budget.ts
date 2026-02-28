import { getTransactions } from "@/lib/db";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";

export interface BudgetSummary {
  totalIncome: number;
  totalExpenses: number;
  netCashflow: number;
  byCategory: { category: string; total: number }[];
  months: { month: string; income: number; expenses: number; net: number }[];
}

function getMonthRange(monthsBack: number): { startDate: string; endDate: string } {
  const end = endOfMonth(new Date());
  const start = startOfMonth(subMonths(new Date(), monthsBack));
  return {
    startDate: format(start, "yyyy-MM-dd"),
    endDate: format(end, "yyyy-MM-dd"),
  };
}

export function computeBudgetSummary(months = 6): BudgetSummary {
  const { startDate, endDate } = getMonthRange(months);
  const transactions = getTransactions({ startDate, endDate });

  const byCategory: Record<string, number> = {};
  const byMonth: Record<string, { income: number; expenses: number }> = {};

  for (const tx of transactions) {
    const month = tx.date.slice(0, 7);
    if (!byMonth[month]) byMonth[month] = { income: 0, expenses: 0 };
    if (tx.amount >= 0) {
      byMonth[month].income += tx.amount;
    } else {
      byMonth[month].expenses += Math.abs(tx.amount);
      byCategory[tx.category] = (byCategory[tx.category] ?? 0) + Math.abs(tx.amount);
    }
  }

  let totalIncome = 0;
  let totalExpenses = 0;
  const monthsList = Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => {
      totalIncome += data.income;
      totalExpenses += data.expenses;
      return {
        month,
        income: data.income,
        expenses: data.expenses,
        net: data.income - data.expenses,
      };
    });

  return {
    totalIncome,
    totalExpenses,
    netCashflow: totalIncome - totalExpenses,
    byCategory: Object.entries(byCategory)
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total),
    months: monthsList,
  };
}
