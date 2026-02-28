import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

const baseURL = process.env.MISTRAL_API_URL ?? "https://api.mistral.ai/v1";
const apiKey = process.env.MISTRAL_API_KEY ?? "";

const client = createOpenAICompatible({
  name: "mistral",
  baseURL,
  apiKey: apiKey || "dummy",
});

// Mistral Small 3.2 for fast tasks (analytics, simple Q&A)
export const fastModel = client("mistral-small-3-2-25-06");
// Mistral Small 3.2 also used for reasoning to keep the demo simple
export const reasoningModel = client("mistral-small-3-2-25-06");
