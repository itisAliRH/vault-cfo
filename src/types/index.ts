export type Transaction = {
  id: string;
  date: string;
  merchant: string;
  amount: number;
  category: string;
  currency: string;
  recurring?: boolean;
  encrypted_blob?: string; // JSON stored in DB for sensitive fields
};

export type Contract = {
  id: string;
  filename: string;
  raw_text_hash?: string;
  uploaded_at: string;
};

export type ContractFacts = {
  contract_id: string;
  provider: string;
  monthly_cost: number;
  currency?: string;
  renewal_date: string;
  notice_period_days?: number;
  cancellation_deadline?: string;
  penalty_amount?: number;
  penalty_description?: string;
  key_clauses?: string[];
};

export type UserProfile = {
  id?: string;
  literacy_level: "beginner" | "intermediate" | "advanced";
  insight_style: "simple" | "deep";
  online_consent: boolean;
  created_at: string;
};

export type Insight = {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  created_at: string;
};

export type ChatSession = {
  id: string;
  summary?: string;
  created_at: string;
};

export type NetworkAuditEntry = {
  id: string;
  url: string;
  method: string;
  timestamp: string;
}
