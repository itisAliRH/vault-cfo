import { tool } from "ai";
import { z } from "zod";
import { getUserProfile, getTransactions, getAllContractsWithFacts, getContractFacts } from "@/lib/db";
import { computeBudgetSummary } from "@/lib/analytics/budget";
import { detectSpendingSpikes } from "@/lib/analytics/spikes";
import { simulateSavings } from "@/lib/analytics/simulator";
import { reasoningModel } from "@/lib/models";
import { generateText } from "ai";

export const agentTools = {
  getUserProfile: tool({
    description: "Get the user's onboarding profile (financial literacy level, insight style, online consent).",
    inputSchema: z.object({}),
    execute: async () => {
      const profile = getUserProfile();
      return profile ?? { error: "No profile found. User may need to complete onboarding." };
    },
  }),

  listTransactions: tool({
    description: "List transactions within an optional date range. Use for income/expense data.",
    inputSchema: z.object({
      startDate: z.string().optional().describe("ISO date YYYY-MM-DD"),
      endDate: z.string().optional().describe("ISO date YYYY-MM-DD"),
    }),
    execute: async ({ startDate, endDate }) => {
      const transactions = getTransactions({ startDate, endDate });
      return { transactions: transactions.slice(0, 100), total: transactions.length };
    },
  }),

  computeBudgetSummary: tool({
    description: "Get budget summary: total income, expenses, net cashflow, by category, and monthly breakdown.",
    inputSchema: z.object({
      months: z.number().optional().default(6).describe("Number of months to include"),
    }),
    execute: async ({ months }) => {
      return computeBudgetSummary(months);
    },
  }),

  detectSpendingSpikes: tool({
    description: "Detect categories where spending is more than 30% above the 3-month average.",
    inputSchema: z.object({
      months: z.number().optional().default(3),
    }),
    execute: async ({ months }) => {
      return detectSpendingSpikes(months);
    },
  }),

  listContracts: tool({
    description: "List all contracts with extracted facts (provider, monthly cost, renewal date).",
    inputSchema: z.object({}),
    execute: async () => {
      return getAllContractsWithFacts();
    },
  }),

  getContractFacts: tool({
    description: "Get detailed facts for a specific contract by ID.",
    inputSchema: z.object({
      contractId: z.string(),
    }),
    execute: async ({ contractId }) => {
      const facts = getContractFacts(contractId);
      return facts ?? { error: "Contract not found" };
    },
  }),

  simulateSavings: tool({
    description: "Simulate savings from canceling subscriptions or reducing spending. Actions: type 'cancel' with target merchant name, or type 'reduce' with target and amount.",
    inputSchema: z.object({
      actions: z.array(
        z.object({
          type: z.enum(["cancel", "reduce"]),
          target: z.string(),
          amount: z.number().optional(),
        })
      ),
    }),
    execute: async ({ actions }) => {
      return simulateSavings(actions);
    },
  }),

  createActionPlan: tool({
    description: "Generate a savings action plan for a given goal (e.g. save 200 EUR/month, reduce subscriptions).",
    inputSchema: z.object({
      goal: z.string(),
    }),
    execute: async ({ goal }) => {
      const { text } = await generateText({
        model: reasoningModel,
        prompt: `You are a privacy-first CFO assistant. The user wants to: ${goal}. In 3-5 short bullet points, suggest concrete actions they could take (e.g. cancel specific subscription types, reduce category spending). Be concise and actionable. Do not make up specific numbers—suggest they check their dashboard for exact figures.`,
      });
      return { plan: text };
    },
  }),
};
