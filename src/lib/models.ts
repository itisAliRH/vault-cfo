import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

const baseURL = process.env.MISTRAL_API_URL ?? "https://api.mistral.ai/v1";
const apiKey = process.env.MISTRAL_API_KEY ?? "";

const client = createOpenAICompatible({
  name: "mistral",
  baseURL,
  apiKey: apiKey || "dummy",
});

// Mistral Small for fast tasks (chat, analytics)
export const fastModel = client("mistral-small-latest");
// Magistral Small for deeper reasoning (think mode, contract extraction)
export const reasoningModel = client("magistral-small-latest");
