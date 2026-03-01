/**
 * Generates sample CSV files for testing the dashboard CSV upload.
 * Uses the same structure as src/lib/demo-data/generate.ts (date, amount, merchant, category).
 * Run: node scripts/generate-sample-csvs.mjs
 */

import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "sample-data");

// Preset configs (simplified from generate.ts)
const PRESETS = {
  doctor: {
    monthlyIncome: 8000,
    categories: [
      { name: "Housing", baseAmount: 2000, merchants: ["Landlord", "Property Management"] },
      { name: "Groceries", baseAmount: 600, merchants: ["Whole Foods", "Trader Joe's", "Fresh Market"] },
      { name: "Dining", baseAmount: 500, merchants: ["Restaurant Gastronomique", "Café Med", "Sushi Place"] },
      { name: "Transport", baseAmount: 300, merchants: ["Fuel Station", "Parking", "Taxi"] },
      { name: "Healthcare", baseAmount: 200, merchants: ["Pharmacy", "Medical Supplies"] },
      { name: "Subscriptions", baseAmount: 135, merchants: ["Netflix", "Spotify", "Apple One", "Orange Telecom"] },
    ],
  },
  lawyer: {
    monthlyIncome: 7000,
    categories: [
      { name: "Housing", baseAmount: 2200, merchants: ["Landlord", "Building Services"] },
      { name: "Groceries", baseAmount: 500, merchants: ["Carrefour", "Monoprix", "Bio Market"] },
      { name: "Dining", baseAmount: 700, merchants: ["Le Bistrot", "Client Dinner", "Business Lunch"] },
      { name: "Transport", baseAmount: 400, merchants: ["SNCF", "Taxi"] },
      { name: "Subscriptions", baseAmount: 397, merchants: ["Westlaw", "LinkedIn Premium", "Netflix"] },
    ],
  },
  engineer: {
    monthlyIncome: 5500,
    categories: [
      { name: "Housing", baseAmount: 1500, merchants: ["Landlord", "Utilities"] },
      { name: "Groceries", baseAmount: 450, merchants: ["Lidl", "Aldi", "Supermarché"] },
      { name: "Dining", baseAmount: 300, merchants: ["Café", "Pizza Place", "Asian Restaurant"] },
      { name: "Transport", baseAmount: 200, merchants: ["Metro Pass", "Vélib", "Fuel"] },
      { name: "Tech", baseAmount: 300, merchants: ["Amazon", "Apple Store", "Fnac Tech"] },
      { name: "Subscriptions", baseAmount: 40, merchants: ["GitHub Pro", "Netflix", "Spotify", "Notion Plus"] },
    ],
  },
  student: {
    monthlyIncome: 1200,
    categories: [
      { name: "Housing", baseAmount: 600, merchants: ["Student Residence", "Colloc"] },
      { name: "Groceries", baseAmount: 200, merchants: ["Lidl", "Aldi", "Market"] },
      { name: "Dining", baseAmount: 150, merchants: ["Crous", "McDonald's", "Kebab"] },
      { name: "Transport", baseAmount: 60, merchants: ["Navigo", "Vélib"] },
      { name: "Subscriptions", baseAmount: 23, merchants: ["Spotify Student", "Netflix", "Bouygues Mobile"] },
    ],
  },
};

function seededRandom(seed) {
  return function next() {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0xffffffff;
  };
}

function randomNoise(base, pct, random) {
  return base * (1 + (random() * 2 - 1) * pct);
}

function generateTransactions(presetName, months = 6) {
  const config = PRESETS[presetName];
  const seed = { doctor: 0xdd, lawyer: 0x1a, engineer: 0x3e, student: 0x55 }[presetName];
  const random = seededRandom(seed);
  const transactions = [];
  const now = new Date();

  for (let monthOffset = months - 1; monthOffset >= 0; monthOffset--) {
    const d = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
    const month = d.getMonth();
    const year = d.getFullYear();

    // Income on the 1st
    transactions.push({
      date: `${year}-${String(month + 1).padStart(2, "0")}-01`,
      amount: randomNoise(config.monthlyIncome, 0.02, random),
      merchant: "Salary",
      category: "Income",
    });

    for (const cat of config.categories) {
      const monthlyTotal = randomNoise(cat.baseAmount, 0.15, random);
      const numTx = Math.floor(random() * 4) + 2;
      for (let i = 0; i < numTx; i++) {
        const day = Math.floor(random() * 28) + 1;
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const clampedDay = Math.min(day, daysInMonth);
        const merchant = cat.merchants[Math.floor(random() * cat.merchants.length)];
        transactions.push({
          date: `${year}-${String(month + 1).padStart(2, "0")}-${String(clampedDay).padStart(2, "0")}`,
          amount: -(monthlyTotal / numTx),
          merchant,
          category: cat.name,
        });
      }
    }
  }

  transactions.sort((a, b) => a.date.localeCompare(b.date));
  return transactions;
}

function toCSV(transactions) {
  const header = "date,amount,merchant,category";
  const rows = transactions.map(
    (t) => `${t.date},${t.amount.toFixed(2)},"${String(t.merchant).replace(/"/g, '""')}","${String(t.category).replace(/"/g, '""')}"`
  );
  return [header, ...rows].join("\n");
}

mkdirSync(OUT_DIR, { recursive: true });

for (const [preset, _] of Object.entries(PRESETS)) {
  const transactions = generateTransactions(preset);
  const csv = toCSV(transactions);
  const path = join(OUT_DIR, `transactions-${preset}.csv`);
  writeFileSync(path, csv, "utf8");
  console.log(`Wrote ${path} (${transactions.length} rows)`);
}

console.log(`\nSample CSV files are in vaultcfo/sample-data/. Upload any of them from the Dashboard (Upload CSV / JSON).`);
