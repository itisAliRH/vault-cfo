import { NextRequest, NextResponse } from "next/server";
import { computeBudgetSummary } from "@/lib/analytics/budget";
import { detectSpendingSpikes } from "@/lib/analytics/spikes";
import { detectSubscriptions } from "@/lib/analytics/subscriptions";
import { getRecentInsights } from "@/lib/db";

const CACHE_TTL_MS = 30_000;

interface CacheEntry {
  data: unknown;
  expiresAt: number;
}

const cache = new Map<number, CacheEntry>();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const months = Math.min(12, Math.max(1, parseInt(searchParams.get("months") ?? "6", 10) || 6));

    const cached = cache.get(months);
    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json(cached.data, {
        headers: { "X-Cache": "HIT" },
      });
    }

    const budget = computeBudgetSummary(months);
    const spikes = detectSpendingSpikes(months);
    const subscriptions = detectSubscriptions(months);
    const recentInsights = getRecentInsights(5);
    const data = { budget, spikes, subscriptions, recentInsights };

    cache.set(months, { data, expiresAt: Date.now() + CACHE_TTL_MS });

    return NextResponse.json(data, { headers: { "X-Cache": "MISS" } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to compute insights" }, { status: 500 });
  }
}

export function invalidateInsightsCache() {
  cache.clear();
}
