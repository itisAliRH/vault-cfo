import { NextResponse } from "next/server";
import { generateText } from "ai";
import { fastModel } from "@/lib/models";

const CACHE_MS = 30_000;
let cached: {
  model_name: string | null;
  latency_ms: number | null;
  gpu_name: string | null;
  vram_usage_mb: number | null;
  context_length: number | null;
  status: "ok" | "disconnected" | "error";
  at: number;
} | null = null;

export async function GET() {
  const now = Date.now();
  if (cached && now - cached.at < CACHE_MS) {
    return NextResponse.json({
      model_name: cached.model_name,
      latency_ms: cached.latency_ms,
      gpu_name: cached.gpu_name,
      vram_usage_mb: cached.vram_usage_mb,
      context_length: cached.context_length,
      status: cached.status,
    });
  }

  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey || apiKey === "dummy") {
    cached = {
      model_name: null,
      latency_ms: null,
      gpu_name: null,
      vram_usage_mb: null,
      context_length: null,
      status: "disconnected",
      at: now,
    };
    return NextResponse.json(cached);
  }

  const start = Date.now();
  try {
    const result = await generateText({
      model: fastModel,
      prompt: "Reply with exactly: OK",
      maxOutputTokens: 5,
    });
    const latency_ms = Date.now() - start;
    const usage = "usage" in result ? result.usage : undefined;
    const totalTokens =
      usage &&
      typeof usage === "object" &&
      "totalTokens" in usage
        ? (usage as { totalTokens?: number }).totalTokens
        : null;
    cached = {
      model_name: "mistral-small-latest",
      latency_ms,
      gpu_name: "Mistral backend",
      vram_usage_mb: null,
      context_length: totalTokens ?? null,
      status: "ok",
      at: now,
    };
    return NextResponse.json({
      model_name: cached.model_name,
      latency_ms: cached.latency_ms,
      gpu_name: cached.gpu_name,
      vram_usage_mb: cached.vram_usage_mb,
      context_length: cached.context_length,
      status: cached.status,
    });
  } catch (e) {
    cached = {
      model_name: null,
      latency_ms: null,
      gpu_name: null,
      vram_usage_mb: null,
      context_length: null,
      status: "error",
      at: now,
    };
    return NextResponse.json({
      ...cached,
      error: e instanceof Error ? e.message : "Unknown error",
    });
  }
}
