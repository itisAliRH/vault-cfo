export type DemoPreset = "doctor" | "lawyer" | "engineer" | "student";

interface DemoTransaction {
  date: string;
  amount: number;
  merchant: string;
  category: string;
}

interface DemoContract {
  provider: string;
  monthly_cost: number;
  renewal_date: string;
  notice_period_days: number;
  key_clauses: string[];
}

/** One transaction per month on a fixed day so subscription detection finds them. */
const RECURRING_DAY = 15;

const PRESET_CONFIG: Record<
  DemoPreset,
  {
    monthlyIncome: number;
    categories: { name: string; baseAmount: number; merchants: string[] }[];
    /** Recurring subscriptions: one tx per month on day 15, same merchant → detectSubscriptions() finds them. */
    recurring: { merchant: string; amount: number; category: string }[];
    contracts: DemoContract[];
  }
> = {
  doctor: {
    monthlyIncome: 8000,
    categories: [
      { name: "Housing", baseAmount: 2000, merchants: ["Landlord", "Property Management"] },
      { name: "Groceries", baseAmount: 600, merchants: ["Whole Foods", "Trader Joe's", "Fresh Market"] },
      { name: "Dining", baseAmount: 500, merchants: ["Restaurant Gastronomique", "Café Med", "Sushi Place"] },
      { name: "Transport", baseAmount: 300, merchants: ["Fuel Station", "Parking", "Taxi"] },
      { name: "Healthcare", baseAmount: 200, merchants: ["Pharmacy", "Medical Supplies"] },
      { name: "Education", baseAmount: 400, merchants: ["Medical Journal", "CME Course"] },
      { name: "Clothing", baseAmount: 300, merchants: ["Boutique", "Medical Uniforms"] },
    ],
    recurring: [
      { merchant: "Netflix", amount: 15.99, category: "Subscriptions" },
      { merchant: "Spotify", amount: 9.99, category: "Subscriptions" },
      { merchant: "Apple One", amount: 19.95, category: "Subscriptions" },
      { merchant: "Orange Telecom", amount: 89, category: "Subscriptions" },
    ],
    contracts: [
      {
        provider: "AXA Health Insurance",
        monthly_cost: 350,
        renewal_date: new Date(Date.now() + 90 * 24 * 3600000).toISOString().split("T")[0],
        notice_period_days: 30,
        key_clauses: ["Full medical coverage", "Dental included", "30-day cancellation notice"],
      },
      {
        provider: "Orange Telecom",
        monthly_cost: 89,
        renewal_date: new Date(Date.now() + 180 * 24 * 3600000).toISOString().split("T")[0],
        notice_period_days: 14,
        key_clauses: ["5G unlimited data", "International calls included", "14-day notice period"],
      },
      {
        provider: "EDF Energy",
        monthly_cost: 120,
        renewal_date: new Date(Date.now() + 60 * 24 * 3600000).toISOString().split("T")[0],
        notice_period_days: 30,
        key_clauses: ["Fixed rate until renewal", "Smart meter included", "Renewable energy option"],
      },
      {
        provider: "Malakoff Médéric",
        monthly_cost: 85,
        renewal_date: new Date(Date.now() + 150 * 24 * 3600000).toISOString().split("T")[0],
        notice_period_days: 30,
        key_clauses: ["Supplementary health", "Optical and dental", "30-day notice"],
      },
      {
        provider: "Canon France Pro",
        monthly_cost: 45,
        renewal_date: new Date(Date.now() + 365 * 24 * 3600000).toISOString().split("T")[0],
        notice_period_days: 60,
        key_clauses: ["Printer lease", "Included maintenance", "60-day cancellation"],
      },
    ],
  },
  lawyer: {
    monthlyIncome: 7000,
    categories: [
      { name: "Housing", baseAmount: 2200, merchants: ["Landlord", "Building Services"] },
      { name: "Groceries", baseAmount: 500, merchants: ["Carrefour", "Monoprix", "Bio Market"] },
      { name: "Dining", baseAmount: 700, merchants: ["Le Bistrot", "Client Dinner", "Business Lunch"] },
      { name: "Transport", baseAmount: 400, merchants: ["SNCF", "Taxi"] },
      { name: "Clothing", baseAmount: 500, merchants: ["Hugo Boss", "Suit Direct", "Accessories"] },
      { name: "Books", baseAmount: 150, merchants: ["Legal Books", "Amazon", "Fnac"] },
      { name: "Insurance", baseAmount: 250, merchants: ["AXA Professional", "Allianz"] },
    ],
    recurring: [
      { merchant: "Westlaw", amount: 199, category: "Subscriptions" },
      { merchant: "LinkedIn Premium", amount: 39.99, category: "Subscriptions" },
      { merchant: "Netflix", amount: 15.99, category: "Subscriptions" },
      { merchant: "Car Rental", amount: 48.54, category: "Transport" },
    ],
    contracts: [
      {
        provider: "Westlaw Legal Research",
        monthly_cost: 199,
        renewal_date: new Date(Date.now() + 120 * 24 * 3600000).toISOString().split("T")[0],
        notice_period_days: 60,
        key_clauses: ["Annual subscription auto-renews", "60-day cancellation notice", "Unlimited case law access"],
      },
      {
        provider: "Allianz Professional Indemnity",
        monthly_cost: 250,
        renewal_date: new Date(Date.now() + 200 * 24 * 3600000).toISOString().split("T")[0],
        notice_period_days: 30,
        key_clauses: ["€2M coverage", "Legal defense included", "Annual review required"],
      },
      {
        provider: "LexisNexis",
        monthly_cost: 149,
        renewal_date: new Date(Date.now() + 90 * 24 * 3600000).toISOString().split("T")[0],
        notice_period_days: 45,
        key_clauses: ["Legal database access", "45-day notice", "Auto-renewal"],
      },
      {
        provider: "Diligent Board",
        monthly_cost: 99,
        renewal_date: new Date(Date.now() + 60 * 24 * 3600000).toISOString().split("T")[0],
        notice_period_days: 30,
        key_clauses: ["Board portal", "Governance tools", "30-day cancellation"],
      },
      {
        provider: "Office 365 Business",
        monthly_cost: 12,
        renewal_date: new Date(Date.now() + 30 * 24 * 3600000).toISOString().split("T")[0],
        notice_period_days: 0,
        key_clauses: ["Monthly billing", "Cancel anytime", "Email and storage"],
      },
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
      { name: "Sports", baseAmount: 80, merchants: ["Gym", "Running Gear"] },
      { name: "Books", baseAmount: 50, merchants: ["O'Reilly", "Manning", "Fnac"] },
    ],
    recurring: [
      { merchant: "GitHub Pro", amount: 4, category: "Subscriptions" },
      { merchant: "Netflix", amount: 15.99, category: "Subscriptions" },
      { merchant: "Spotify", amount: 9.99, category: "Subscriptions" },
      { merchant: "Notion Plus", amount: 10, category: "Subscriptions" },
    ],
    contracts: [
      {
        provider: "Free Mobile",
        monthly_cost: 29,
        renewal_date: new Date(Date.now() + 30 * 24 * 3600000).toISOString().split("T")[0],
        notice_period_days: 10,
        key_clauses: ["No commitment", "Unlimited calls/SMS", "100GB data"],
      },
      {
        provider: "Amazon Prime",
        monthly_cost: 8,
        renewal_date: new Date(Date.now() + 15 * 24 * 3600000).toISOString().split("T")[0],
        notice_period_days: 0,
        key_clauses: ["Cancel anytime", "Free delivery included", "Prime Video access"],
      },
      {
        provider: "Hetzner Cloud",
        monthly_cost: 45,
        renewal_date: new Date(Date.now() + 365 * 24 * 3600000).toISOString().split("T")[0],
        notice_period_days: 30,
        key_clauses: ["Monthly billing", "Cancel with 30 days notice", "99.9% uptime SLA"],
      },
      {
        provider: "GitHub Team",
        monthly_cost: 4,
        renewal_date: new Date(Date.now() + 30 * 24 * 3600000).toISOString().split("T")[0],
        notice_period_days: 0,
        key_clauses: ["Per user billing", "Cancel anytime", "Private repos"],
      },
      {
        provider: "Notion Plus",
        monthly_cost: 10,
        renewal_date: new Date(Date.now() + 60 * 24 * 3600000).toISOString().split("T")[0],
        notice_period_days: 0,
        key_clauses: ["Monthly plan", "Cancel anytime", "Unlimited blocks"],
      },
    ],
  },
  student: {
    monthlyIncome: 1200,
    categories: [
      { name: "Housing", baseAmount: 600, merchants: ["Student Residence", "Colloc"] },
      { name: "Groceries", baseAmount: 200, merchants: ["Lidl", "Aldi", "Market"] },
      { name: "Dining", baseAmount: 150, merchants: ["Crous", "McDonald's", "Kebab"] },
      { name: "Transport", baseAmount: 60, merchants: ["Navigo", "Vélib"] },
      { name: "Books", baseAmount: 80, merchants: ["Campus Bookstore", "Amazon"] },
      { name: "Clothing", baseAmount: 60, merchants: ["Primark", "Vinted", "H&M"] },
      { name: "Entertainment", baseAmount: 50, merchants: ["Cinema", "Bar", "Games"] },
    ],
    recurring: [
      { merchant: "Spotify Student", amount: 5.99, category: "Subscriptions" },
      { merchant: "Netflix", amount: 6.99, category: "Subscriptions" },
      { merchant: "Bouygues Mobile", amount: 10, category: "Subscriptions" },
    ],
    contracts: [
      {
        provider: "Bouygues Mobile Student",
        monthly_cost: 10,
        renewal_date: new Date(Date.now() + 30 * 24 * 3600000).toISOString().split("T")[0],
        notice_period_days: 10,
        key_clauses: ["Student discount 50%", "25GB data", "Cancel anytime"],
      },
      {
        provider: "Netflix Standard",
        monthly_cost: 13,
        renewal_date: new Date(Date.now() + 30 * 24 * 3600000).toISOString().split("T")[0],
        notice_period_days: 0,
        key_clauses: ["Monthly subscription", "Cancel anytime", "2 screens"],
      },
      {
        provider: "Spotify Student",
        monthly_cost: 6,
        renewal_date: new Date(Date.now() + 90 * 24 * 3600000).toISOString().split("T")[0],
        notice_period_days: 0,
        key_clauses: ["50% discount", "Cancel anytime", "Premium features"],
      },
      {
        provider: "Microsoft 365 Student",
        monthly_cost: 0,
        renewal_date: new Date(Date.now() + 365 * 24 * 3600000).toISOString().split("T")[0],
        notice_period_days: 0,
        key_clauses: ["Free for students", "Office apps", "1TB OneDrive"],
      },
      {
        provider: "Adobe Creative Cloud Student",
        monthly_cost: 20,
        renewal_date: new Date(Date.now() + 60 * 24 * 3600000).toISOString().split("T")[0],
        notice_period_days: 30,
        key_clauses: ["Student discount", "All apps", "30-day notice"],
      },
    ],
  },
};

const MIN_CONTRACTS = 3;
const MAX_CONTRACTS = 5;

/** Seeded RNG for deterministic demo data (cache-friendly). */
function createSeededRandom(seed: number): () => number {
  return function next(): number {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0xffff_ffff;
  };
}

function randomNoise(base: number, pct = 0.15, random = Math.random): number {
  return base * (1 + (random() * 2 - 1) * pct);
}

function getSeasonalMultiplier(month: number, category: string): number {
  // December holiday spikes
  if (month === 11) {
    if (["Dining", "Clothing", "Entertainment", "Groceries"].includes(category)) return 1.6;
    if (category === "Transport") return 1.3;
  }
  // July/August summer travel
  if (month === 6 || month === 7) {
    if (category === "Transport") return 1.8;
    if (category === "Dining") return 1.3;
  }
  return 1.0;
}

/** Numeric seed per preset for deterministic cacheable output. */
const PRESET_SEED: Record<DemoPreset, number> = {
  doctor: 0xdd,
  lawyer: 0x1a,
  engineer: 0x3e,
  student: 0x55,
};

export function generateDemoData(
  preset: DemoPreset,
  seed?: number
): {
  transactions: DemoTransaction[];
  contracts: DemoContract[];
} {
  const config = PRESET_CONFIG[preset];
  const transactions: DemoTransaction[] = [];
  const now = new Date();
  const random = seed !== undefined ? createSeededRandom(seed) : Math.random;

  // Spending spike in "current" month so detectSpendingSpikes() finds >30% increases
  const spikeCategories = ["Dining", "Transport"];
  const spikeMultipliers: Record<string, number> = { Dining: 1.65, Transport: 1.5 };

  // Generate income + expenses for 12 months
  for (let monthOffset = 11; monthOffset >= 0; monthOffset--) {
    const d = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
    const month = d.getMonth();
    const year = d.getFullYear();
    const isCurrentMonth = monthOffset === 0;

    // Income on the 1st
    transactions.push({
      date: `${year}-${String(month + 1).padStart(2, "0")}-01`,
      amount: randomNoise(config.monthlyIncome, 0.02, random),
      merchant: "Salary",
      category: "Income",
    });

    // Recurring subscriptions: one tx per month on fixed day so detectSubscriptions() finds them
    const dayStr = String(RECURRING_DAY).padStart(2, "0");
    const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;
    for (const sub of config.recurring) {
      transactions.push({
        date: `${monthStr}-${dayStr}`,
        amount: -randomNoise(sub.amount, 0.02, random),
        merchant: sub.merchant,
        category: sub.category,
      });
    }

    // Expenses across the month
    for (const cat of config.categories) {
      let seasonal = getSeasonalMultiplier(month, cat.name);
      if (isCurrentMonth && spikeCategories.includes(cat.name)) {
        seasonal *= spikeMultipliers[cat.name] ?? 1;
      }
      const monthlyTotal = randomNoise(cat.baseAmount * seasonal, 0.15, random);

      // Split into 2-5 transactions per category
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

  // Sort by date
  transactions.sort((a, b) => a.date.localeCompare(b.date));

  // Return 3–5 contracts (deterministic count when seed is provided)
  const countRange = MAX_CONTRACTS - MIN_CONTRACTS + 1;
  const count =
    MIN_CONTRACTS +
    (seed !== undefined ? seed % countRange : Math.floor(random() * countRange));
  const contracts = config.contracts.slice(0, Math.min(count, config.contracts.length));

  return { transactions, contracts };
}

/** Seed for cacheable generation (same preset => same data). */
export function getDemoSeed(preset: DemoPreset): number {
  return PRESET_SEED[preset];
}

export function transactionsToCSV(transactions: DemoTransaction[]): string {
  const header = "date,amount,merchant,category";
  const rows = transactions.map(
    (t) => `${t.date},${t.amount.toFixed(2)},${JSON.stringify(t.merchant)},${JSON.stringify(t.category)}`
  );
  return [header, ...rows].join("\n");
}
