import { NextRequest, NextResponse } from "next/server";
import { computeBudgetSummary } from "@/lib/analytics/budget";
import { detectSpendingSpikes } from "@/lib/analytics/spikes";
import { detectSubscriptions } from "@/lib/analytics/subscriptions";
import { getRecentInsights } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const months = Math.min(12, Math.max(1, parseInt(searchParams.get("months") ?? "6", 10) || 6));
    const budget = computeBudgetSummary(months);
    const spikes = detectSpendingSpikes(months);
    const subscriptions = detectSubscriptions(months);
    const recentInsights = getRecentInsights(5);
    return NextResponse.json({
      budget,
      spikes,
      subscriptions,
      recentInsights,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to compute insights" }, { status: 500 });
  }
}
