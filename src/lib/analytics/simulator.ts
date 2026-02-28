import { computeBudgetSummary } from "./budget";
import { detectSubscriptions } from "./subscriptions";

export interface SimulatorAction {
  type: "cancel" | "reduce";
  target: string;
  amount?: number;
}

export interface SimulatorResult {
  monthlySavings: number;
  annualSavings: number;
  newNetCashflow: number;
  actionsApplied: number;
}

export function simulateSavings(actions: SimulatorAction[]): SimulatorResult {
  const budget = computeBudgetSummary(1);
  const subs = detectSubscriptions(6);
  let monthlySavings = 0;

  for (const action of actions) {
    if (action.type === "cancel") {
      const sub = subs.find((s) => s.merchant.toLowerCase().includes(action.target.toLowerCase()));
      if (sub) monthlySavings += sub.monthlyAmount;
    } else if (action.type === "reduce" && action.amount != null) {
      monthlySavings += action.amount;
    }
  }

  return {
    monthlySavings,
    annualSavings: monthlySavings * 12,
    newNetCashflow: budget.netCashflow + monthlySavings,
    actionsApplied: actions.length,
  };
}
