export interface SharingConfig {
  shareExpenses?: boolean;
  expenseCategories?: string[];
  expenseDetailLevel?: "full" | "summary";
  shareContracts?: boolean;
  contractIds?: string[];
  contractDetailLevel?: "full" | "summary";
  shareIncome?: boolean;
  incomeCategories?: string[];
  incomeDetailLevel?: "full" | "summary";
}

export interface ShareableDataResponse {
  expenseCategories: string[];
  incomeCategories: string[];
  contracts: { id: string; provider: string }[];
}

export interface TranscriptEntry {
  role: "user" | "agent";
  text: string;
  timestamp?: number;
}
