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

const PRESET_CONFIG: Record<
  DemoPreset,
  {
    monthlyIncome: number;
    categories: { name: string; baseAmount: number; merchants: string[] }[];
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
      { name: "Subscriptions", baseAmount: 150, merchants: ["Netflix", "Spotify", "Apple One"] },
      { name: "Education", baseAmount: 400, merchants: ["Medical Journal", "CME Course"] },
      { name: "Clothing", baseAmount: 300, merchants: ["Boutique", "Medical Uniforms"] },
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
    ],
  },
  lawyer: {
    monthlyIncome: 7000,
    categories: [
      { name: "Housing", baseAmount: 2200, merchants: ["Landlord", "Building Services"] },
      { name: "Groceries", baseAmount: 500, merchants: ["Carrefour", "Monoprix", "Bio Market"] },
      { name: "Dining", baseAmount: 700, merchants: ["Le Bistrot", "Client Dinner", "Business Lunch"] },
      { name: "Transport", baseAmount: 400, merchants: ["SNCF", "Taxi", "Car Rental"] },
      { name: "Subscriptions", baseAmount: 200, merchants: ["Westlaw", "LinkedIn Premium", "Netflix"] },
      { name: "Clothing", baseAmount: 500, merchants: ["Hugo Boss", "Suit Direct", "Accessories"] },
      { name: "Books", baseAmount: 150, merchants: ["Legal Books", "Amazon", "Fnac"] },
      { name: "Insurance", baseAmount: 250, merchants: ["AXA Professional", "Allianz"] },
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
      { name: "Subscriptions", baseAmount: 120, merchants: ["GitHub Pro", "Netflix", "Spotify"] },
      { name: "Sports", baseAmount: 80, merchants: ["Gym", "Running Gear"] },
      { name: "Books", baseAmount: 50, merchants: ["O'Reilly", "Manning", "Fnac"] },
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
    ],
  },
  student: {
    monthlyIncome: 1200,
    categories: [
      { name: "Housing", baseAmount: 600, merchants: ["Student Residence", "Colloc"] },
      { name: "Groceries", baseAmount: 200, merchants: ["Lidl", "Aldi", "Market"] },
      { name: "Dining", baseAmount: 150, merchants: ["Crous", "McDonald's", "Kebab"] },
      { name: "Transport", baseAmount: 60, merchants: ["Navigo", "Vélib"] },
      { name: "Subscriptions", baseAmount: 30, merchants: ["Spotify Student", "Netflix"] },
      { name: "Books", baseAmount: 80, merchants: ["Campus Bookstore", "Amazon"] },
      { name: "Clothing", baseAmount: 60, merchants: ["Primark", "Vinted", "H&M"] },
      { name: "Entertainment", baseAmount: 50, merchants: ["Cinema", "Bar", "Games"] },
    ],
    contracts: [
      {
        provider: "Bouygues Mobile Student",
        monthly_cost: 10,
        renewal_date: new Date(Date.now() + 30 * 24 * 3600000).toISOString().split("T")[0],
        notice_period_days: 10,
        key_clauses: ["Student discount 50%", "25GB data", "Cancel anytime"],
      },
    ],
  },
};

function randomNoise(base: number, pct = 0.15): number {
  return base * (1 + (Math.random() * 2 - 1) * pct);
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

export function generateDemoData(preset: DemoPreset): {
  transactions: DemoTransaction[];
  contracts: DemoContract[];
} {
  const config = PRESET_CONFIG[preset];
  const transactions: DemoTransaction[] = [];
  const now = new Date();

  // Generate income + expenses for 12 months
  for (let monthOffset = 11; monthOffset >= 0; monthOffset--) {
    const d = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
    const month = d.getMonth();
    const year = d.getFullYear();

    // Income on the 1st
    transactions.push({
      date: `${year}-${String(month + 1).padStart(2, "0")}-01`,
      amount: randomNoise(config.monthlyIncome, 0.02),
      merchant: "Salary",
      category: "Income",
    });

    // Expenses across the month
    for (const cat of config.categories) {
      const seasonal = getSeasonalMultiplier(month, cat.name);
      const monthlyTotal = randomNoise(cat.baseAmount * seasonal, 0.15);

      // Split into 2-5 transactions per category
      const numTx = Math.floor(Math.random() * 4) + 2;
      for (let i = 0; i < numTx; i++) {
        const day = Math.floor(Math.random() * 28) + 1;
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const clampedDay = Math.min(day, daysInMonth);
        const merchant = cat.merchants[Math.floor(Math.random() * cat.merchants.length)];
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

  return { transactions, contracts: config.contracts };
}

export function transactionsToCSV(transactions: DemoTransaction[]): string {
  const header = "date,amount,merchant,category";
  const rows = transactions.map(
    (t) => `${t.date},${t.amount.toFixed(2)},${JSON.stringify(t.merchant)},${JSON.stringify(t.category)}`
  );
  return [header, ...rows].join("\n");
}
