import { streamText, stepCountIs } from "ai";
import { fastModel } from "@/lib/models";
import { agentTools } from "@/lib/tools";

const SYSTEM_PROMPT = `You are VaultCFO, a privacy-first AI CFO assistant. All user financial data stays local; you only see what your tools return.

Rules:
- Always use tools to answer questions about finances (transactions, budget, contracts, savings). Do not make up numbers.
- Keep responses concise. Adapt complexity to the user's literacy level (from getUserProfile when relevant).
- This is informational only—not professional financial advice. Say so when giving recommendations.
- If the user asks something off-topic, politely redirect to finance topics.
- If the user has no data (empty transactions/contracts), say so and suggest uploading data or running the onboarding.`;

export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages } = await req.json();
  const result = streamText({
    model: fastModel,
    system: SYSTEM_PROMPT,
    messages,
    tools: agentTools,
    stopWhen: stepCountIs(5),
    toolChoice: "auto",
    onFinish: async () => {},
  });
  return result.toUIMessageStreamResponse({ originalMessages: messages });
}
