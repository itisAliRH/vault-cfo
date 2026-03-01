/**
 * Generates sample contract text files for testing the Contracts page upload (PDF or text).
 * Uses the same contract data as src/lib/demo-data/generate.ts.
 * Run: node scripts/generate-sample-contracts.mjs
 */

import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "sample-data", "contracts");

function addDays(isoDate, days) {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const now = new Date().toISOString().slice(0, 10);

const CONTRACTS = [
  {
    provider: "AXA Health Insurance",
    monthly_cost: 350,
    renewal_date: addDays(now, 90),
    notice_period_days: 30,
    key_clauses: ["Full medical coverage", "Dental included", "30-day cancellation notice"],
  },
  {
    provider: "Orange Telecom",
    monthly_cost: 89,
    renewal_date: addDays(now, 180),
    notice_period_days: 14,
    key_clauses: ["5G unlimited data", "International calls included", "14-day notice period"],
  },
  {
    provider: "EDF Energy",
    monthly_cost: 120,
    renewal_date: addDays(now, 60),
    notice_period_days: 30,
    key_clauses: ["Fixed rate until renewal", "Smart meter included", "Renewable energy option"],
  },
  {
    provider: "Malakoff Médéric",
    monthly_cost: 85,
    renewal_date: addDays(now, 150),
    notice_period_days: 30,
    key_clauses: ["Supplementary health", "Optical and dental", "30-day notice"],
  },
  {
    provider: "Canon France Pro",
    monthly_cost: 45,
    renewal_date: addDays(now, 365),
    notice_period_days: 60,
    key_clauses: ["Printer lease", "Included maintenance", "60-day cancellation"],
  },
  {
    provider: "Westlaw Legal Research",
    monthly_cost: 199,
    renewal_date: addDays(now, 120),
    notice_period_days: 60,
    key_clauses: ["Annual subscription auto-renews", "60-day cancellation notice", "Unlimited case law access"],
  },
  {
    provider: "Allianz Professional Indemnity",
    monthly_cost: 250,
    renewal_date: addDays(now, 200),
    notice_period_days: 30,
    key_clauses: ["€2M coverage", "Legal defense included", "Annual review required"],
  },
  {
    provider: "LexisNexis",
    monthly_cost: 149,
    renewal_date: addDays(now, 90),
    notice_period_days: 45,
    key_clauses: ["Legal database access", "45-day notice", "Auto-renewal"],
  },
  {
    provider: "Free Mobile",
    monthly_cost: 29,
    renewal_date: addDays(now, 30),
    notice_period_days: 10,
    key_clauses: ["No commitment", "Unlimited calls/SMS", "100GB data"],
  },
  {
    provider: "Amazon Prime",
    monthly_cost: 8,
    renewal_date: addDays(now, 15),
    notice_period_days: 0,
    key_clauses: ["Cancel anytime", "Free delivery included", "Prime Video access"],
  },
  {
    provider: "Hetzner Cloud",
    monthly_cost: 45,
    renewal_date: addDays(now, 365),
    notice_period_days: 30,
    key_clauses: ["Monthly billing", "Cancel with 30 days notice", "99.9% uptime SLA"],
  },
  {
    provider: "Bouygues Mobile Student",
    monthly_cost: 10,
    renewal_date: addDays(now, 30),
    notice_period_days: 10,
    key_clauses: ["Student discount 50%", "25GB data", "Cancel anytime"],
  },
  {
    provider: "Microsoft 365 Student",
    monthly_cost: 0,
    renewal_date: addDays(now, 365),
    notice_period_days: 0,
    key_clauses: ["Free for students", "Office apps", "1TB OneDrive"],
  },
  {
    provider: "Adobe Creative Cloud Student",
    monthly_cost: 20,
    renewal_date: addDays(now, 60),
    notice_period_days: 30,
    key_clauses: ["Student discount", "All apps", "30-day notice"],
  },
];

function contractToText(c) {
  const safeName = c.provider.replace(/[/\\?*]/g, "-").trim();
  return `CONTRACT SUMMARY – ${c.provider}
========================================

Provider: ${c.provider}
Monthly cost: ${c.monthly_cost} EUR
Renewal date: ${c.renewal_date}
Notice period: ${c.notice_period_days} days before renewal

Key clauses:
${c.key_clauses.map((cl) => "• " + cl).join("\n")}

---
This is sample contract text for testing. Upload via Contracts → Upload contract (PDF or text).
`;
}

mkdirSync(OUT_DIR, { recursive: true });

for (const contract of CONTRACTS) {
  const safeName = contract.provider.replace(/[/\\?*]/g, "-").trim();
  const filename = `contract-${safeName.replace(/\s+/g, "-")}.txt`;
  const path = join(OUT_DIR, filename);
  const text = contractToText(contract);
  writeFileSync(path, text, "utf8");
  console.log(`Wrote ${path}`);
}

console.log(`\nSample contract files are in vaultcfo/sample-data/contracts/. Upload any .txt from the Contracts page (Upload contract).`);
