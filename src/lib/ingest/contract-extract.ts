import { generateText } from "ai";
import { z } from "zod";
import { fastModel } from "@/lib/models";

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
  const prompt = `Return ONLY valid JSON (no markdown, no explanation) with these fields:
- provider_name: string
- monthly_cost: number
- currency: string (default "EUR")
- renewal_date: YYYY-MM-DD string
- notice_period_days: number or omit
- cancellation_deadline: YYYY-MM-DD string or omit
- penalty_amount: number or omit
- penalty_description: string or omit
- key_clauses: array of short strings (can be empty)

Use ISO dates. If a value is not found use 0 for monthly_cost, today for renewal_date, empty array for key_clauses.

Contract text:
---
${text.slice(0, 12000)}
---`;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const { text: raw } = await generateText({
        model: fastModel,
        prompt,
      });

      // Extract JSON from response (handles markdown code fences)
      const jsonMatch = raw.match(/\{[\s\S]+\}/);
      if (!jsonMatch) throw new Error("No JSON object in response");
      const parsed = JSON.parse(jsonMatch[0]);
      return contractFactsSchema.parse(parsed);
    } catch (e) {
      if (attempt === 1) throw e;
    }
  }
  throw new Error("Failed to extract contract facts after retry");
}
