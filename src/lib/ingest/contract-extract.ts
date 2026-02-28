import { generateObject, zodSchema } from "ai";
import { z } from "zod";
import { reasoningModel } from "@/lib/models";

const contractFactsSchema = z.object({
  provider_name: z.string(),
  monthly_cost: z.number(),
  currency: z.string().default("EUR"),
  renewal_date: z.string(),
  notice_period_days: z.number().optional(),
  cancellation_deadline: z.string().optional(),
  penalty_amount: z.number().optional(),
  penalty_description: z.string().optional(),
  key_clauses: z.array(z.string()).default([]),
});

export type ExtractedContractFacts = z.infer<typeof contractFactsSchema>;

export async function extractContractFacts(text: string): Promise<ExtractedContractFacts> {
  const prompt = `Extract the following from this contract text. Return only the requested fields. Use ISO dates (YYYY-MM-DD) where possible. If a value is not found, omit it or use 0 for numbers.

Contract text:
---
${text.slice(0, 12000)}
---`;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      // #region agent log
      fetch("http://127.0.0.1:7524/ingest/0bfddef5-e779-4680-895c-1765323b8807", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "237f40",
        },
        body: JSON.stringify({
          sessionId: "237f40",
          runId: "pre-fix",
          hypothesisId: "H1",
          location: "contract-extract.ts:extractContractFacts:attempt",
          message: "extractContractFacts attempt",
          data: {
            attempt,
            textSample: text.slice(0, 120),
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion

      const { object } = await generateObject({
        model: reasoningModel,
        schema: zodSchema(contractFactsSchema),
        prompt,
      });

      // #region agent log
      fetch("http://127.0.0.1:7524/ingest/0bfddef5-e779-4680-895c-1765323b8807", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "237f40",
        },
        body: JSON.stringify({
          sessionId: "237f40",
          runId: "pre-fix",
          hypothesisId: "H2",
          location: "contract-extract.ts:extractContractFacts:success",
          message: "extractContractFacts success",
          data: {
            provider_name: (object as ExtractedContractFacts).provider_name,
            monthly_cost: (object as ExtractedContractFacts).monthly_cost,
            currency: (object as ExtractedContractFacts).currency,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion

      return object as ExtractedContractFacts;
    } catch (e) {
      // #region agent log
      fetch("http://127.0.0.1:7524/ingest/0bfddef5-e779-4680-895c-1765323b8807", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "237f40",
        },
        body: JSON.stringify({
          sessionId: "237f40",
          runId: "pre-fix",
          hypothesisId: "H1",
          location: "contract-extract.ts:extractContractFacts:error",
          message: "extractContractFacts error",
          data: {
            attempt,
            error: e instanceof Error ? e.message : String(e),
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion

      if (attempt === 1) throw e;
    }
  }
  throw new Error("Failed to extract contract facts after retry");
}
