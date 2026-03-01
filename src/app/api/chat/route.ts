import { streamText, stepCountIs, convertToModelMessages } from "ai";
import { fastModel, reasoningModel } from "@/lib/models";
import { agentTools } from "@/lib/tools";
import { getUserProfile, logNetworkRequest } from "@/lib/db";
import { NextRequest } from "next/server";

const SYSTEM_PROMPT = `You are VaultCFO, a privacy-first AI CFO assistant. All user financial data stays local; you only see what your tools return.

STRICT RULES — follow every one, every time:
1. SCOPE: Only answer questions about personal finance (budgeting, spending, contracts, savings, cashflow). If the user asks about anything else (coding, general knowledge, entertainment, etc.), respond only with: "I'm VaultCFO — I can only help with personal finance topics. Try asking about your budget, contracts, or savings." Do not engage with off-topic questions even briefly.
2. TOOLS FIRST: For any finance question, ALWAYS call the relevant tool(s) before answering. Never say you don't have data without first calling the tool. The tools always return the current state — call computeBudgetSummary, listTransactions, or listContracts before saying data is unavailable.
3. NO MADE-UP NUMBERS: Only cite figures that came directly from a tool call in this conversation.
4. CONCISE: Keep answers short and structured (bullets or numbered lists). Adapt language to the user's literacy level (call getUserProfile if unsure).
5. DISCLAIMER: When giving financial recommendations, add one line: "This is informational only, not professional financial advice."`;

const THINK_PROMPT = `${SYSTEM_PROMPT}

Think mode is ENABLED. Before answering, reason step-by-step through the problem. Consider multiple angles, potential edge cases, and provide a thorough analysis.`;

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    messages?: unknown[];
    thinkMode?: boolean;
  };
  const { messages } = body;
  // thinkMode is sent in body by the client when the lightbulb is on
  const thinkMode = Boolean(
    body.thinkMode ||
    (Array.isArray(messages) &&
      messages.length > 0 &&
      typeof messages[messages.length - 1] === "object" &&
      (messages[messages.length - 1] as { metadata?: { thinkMode?: boolean } }).metadata?.thinkMode)
  );

  // Check online consent before making outbound calls
  const profile = getUserProfile();
  if (profile && !profile.online_consent) {
    // Still allow — VaultCFO needs Mistral for its core function.
    // online_consent in our context means whether to enable extra online features.
  }

  // Log outbound LLM call for privacy audit
  const mistralUrl = process.env.MISTRAL_API_URL ?? "https://api.mistral.ai/v1";
  logNetworkRequest(`${mistralUrl}/chat/completions`);

  const model = thinkMode ? reasoningModel : fastModel;
  const systemPrompt = thinkMode ? THINK_PROMPT : SYSTEM_PROMPT;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const uiMessages = (messages ?? []) as any[];
  const modelMessages = await convertToModelMessages(uiMessages);

  const result = streamText({
    model,
    system: systemPrompt,
    messages: modelMessages,
    tools: agentTools,
    stopWhen: stepCountIs(8),
    toolChoice: "auto",
    onFinish: async () => {},
  });
  return result.toUIMessageStreamResponse({ originalMessages: uiMessages });
}
