import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import { mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  encrypt,
  decrypt,
  getPassphrase,
  serializeEncrypted,
  deserializeEncrypted,
} from "./encryption";
import type { Transaction, Contract, ContractFacts, UserProfile, Insight } from "@/types";

// On Vercel, process.cwd() is read-only; use /tmp so DB can be created (ephemeral per instance).
const DATA_DIR =
  process.env.VERCEL === "1" ? "/tmp/vaultcfo-data" : join(process.cwd(), "data");
const DB_PATH = join(DATA_DIR, "vault.db");

let db: Database.Database | null = null;

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function getDb(): Database.Database {
  if (!db) {
    ensureDataDir();
    db = new Database(DB_PATH);
    runMigrations(db);
  }
  return db;
}

function runMigrations(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      literacy_level TEXT NOT NULL,
      insight_style TEXT NOT NULL,
      online_consent INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      encrypted_blob TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS contracts (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      raw_text_hash TEXT,
      uploaded_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS contract_facts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contract_id TEXT NOT NULL,
      provider TEXT,
      monthly_cost REAL,
      currency TEXT,
      renewal_date TEXT,
      notice_period_days INTEGER,
      cancellation_deadline TEXT,
      penalty_amount REAL,
      penalty_description TEXT,
      key_clauses TEXT,
      FOREIGN KEY (contract_id) REFERENCES contracts(id)
    );

    CREATE TABLE IF NOT EXISTS insights (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS chat_sessions (
      id TEXT PRIMARY KEY,
      summary TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS network_audit (
      id TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      method TEXT NOT NULL,
      timestamp TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS agent_meetings (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      agent_id TEXT NOT NULL,
      transcript TEXT,
      created_at TEXT NOT NULL,
      ended_at TEXT,
      duration_seconds INTEGER
    );

    CREATE TABLE IF NOT EXISTS agent_config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_contract_facts_contract_id ON contract_facts(contract_id);
    CREATE INDEX IF NOT EXISTS idx_agent_meetings_created_at ON agent_meetings(created_at);
  `);
}

// --- Users ---
export function getUserProfile(): UserProfile | null {
  const row = getDb().prepare("SELECT * FROM users LIMIT 1").get() as {
    id: string;
    literacy_level: string;
    insight_style: string;
    online_consent: number;
    created_at: string;
  } | undefined;
  if (!row) return null;
  return {
    id: row.id,
    literacy_level: row.literacy_level as UserProfile["literacy_level"],
    insight_style: row.insight_style as UserProfile["insight_style"],
    online_consent: Boolean(row.online_consent),
    created_at: row.created_at,
  };
}

export function upsertUserProfile(profile: Omit<UserProfile, "created_at">): void {
  const id = profile.id ?? "default";
  const created_at = new Date().toISOString();
  getDb()
    .prepare(
      `INSERT INTO users (id, literacy_level, insight_style, online_consent, created_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         literacy_level = excluded.literacy_level,
         insight_style = excluded.insight_style,
         online_consent = excluded.online_consent`
    )
    .run(id, profile.literacy_level, profile.insight_style, profile.online_consent ? 1 : 0, created_at);
}

export function deleteUserProfile(): void {
  getDb().prepare("DELETE FROM users").run();
}

// --- Transactions (encrypted) ---
export function insertTransaction(tx: Omit<Transaction, "encrypted_blob">): void {
  const passphrase = getPassphrase();
  const blob = encrypt(
    JSON.stringify({
      merchant: tx.merchant,
      amount: tx.amount,
      category: tx.category,
      currency: tx.currency,
      recurring: tx.recurring ?? false,
    }),
    passphrase
  );
  getDb()
    .prepare(
      "INSERT INTO transactions (id, date, encrypted_blob) VALUES (?, ?, ?)"
    )
    .run(tx.id, tx.date, serializeEncrypted(blob));
}

/** Batch insert transactions in a single DB transaction (faster for demo generation). */
export function insertTransactions(txs: Array<Omit<Transaction, "encrypted_blob">>): void {
  if (txs.length === 0) return;
  const passphrase = getPassphrase();
  const database = getDb();
  const stmt = database.prepare(
    "INSERT INTO transactions (id, date, encrypted_blob) VALUES (?, ?, ?)"
  );
  database.transaction(() => {
    for (const tx of txs) {
      const blob = encrypt(
        JSON.stringify({
          merchant: tx.merchant,
          amount: tx.amount,
          category: tx.category,
          currency: tx.currency,
          recurring: tx.recurring ?? false,
        }),
        passphrase
      );
      stmt.run(tx.id, tx.date, serializeEncrypted(blob));
    }
  })();
}

function decryptBlob(encryptedBlob: string, passphrase: string): Record<string, unknown> {
  const payload = deserializeEncrypted(encryptedBlob);
  const decrypted = decrypt(payload, passphrase);
  return JSON.parse(decrypted) as Record<string, unknown>;
}

export function getTransactions(range?: { startDate?: string; endDate?: string }): Transaction[] {
  let sql = "SELECT id, date, encrypted_blob FROM transactions WHERE 1=1";
  const params: string[] = [];
  if (range?.startDate) {
    sql += " AND date >= ?";
    params.push(range.startDate);
  }
  if (range?.endDate) {
    sql += " AND date <= ?";
    params.push(range.endDate);
  }
  sql += " ORDER BY date DESC";
  const passphrase = getPassphrase();
  const rows = getDb().prepare(sql).all(...params) as { id: string; date: string; encrypted_blob: string }[];
  return rows.map((r) => {
    const payload = decryptBlob(r.encrypted_blob, passphrase);
    return {
      id: r.id,
      date: r.date,
      merchant: payload.merchant as string,
      amount: payload.amount as number,
      category: payload.category as string,
      currency: payload.currency as string,
      recurring: payload.recurring as boolean | undefined,
    } as Transaction;
  });
}

// --- Contracts ---
export function insertContract(contract: { id: string; filename: string; raw_text_hash?: string }): void {
  getDb()
    .prepare("INSERT INTO contracts (id, filename, raw_text_hash, uploaded_at) VALUES (?, ?, ?, ?)")
    .run(contract.id, contract.filename, contract.raw_text_hash ?? null, new Date().toISOString());
}

export function getContracts(): Contract[] {
  const rows = getDb().prepare("SELECT id, filename, raw_text_hash, uploaded_at FROM contracts ORDER BY uploaded_at DESC").all() as {
    id: string;
    filename: string;
    raw_text_hash: string | null;
    uploaded_at: string;
  }[];
  return rows.map((r) => ({
    id: r.id,
    filename: r.filename,
    raw_text_hash: r.raw_text_hash ?? undefined,
    uploaded_at: r.uploaded_at,
  }));
}

// --- Contract facts ---
export function insertContractFacts(facts: Omit<ContractFacts, "contract_id"> & { contract_id: string }): void {
  getDb()
    .prepare(
      `INSERT INTO contract_facts (contract_id, provider, monthly_cost, currency, renewal_date, notice_period_days, cancellation_deadline, penalty_amount, penalty_description, key_clauses)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      facts.contract_id,
      facts.provider,
      facts.monthly_cost,
      facts.currency ?? null,
      facts.renewal_date,
      facts.notice_period_days ?? null,
      facts.cancellation_deadline ?? null,
      facts.penalty_amount ?? null,
      facts.penalty_description ?? null,
      facts.key_clauses ? JSON.stringify(facts.key_clauses) : null
    );
}

export function getContractFacts(contractId: string): ContractFacts | null {
  const row = getDb()
    .prepare("SELECT * FROM contract_facts WHERE contract_id = ? LIMIT 1")
    .get(contractId) as {
      contract_id: string;
      provider: string;
      monthly_cost: number;
      currency: string | null;
      renewal_date: string;
      notice_period_days: number | null;
      cancellation_deadline: string | null;
      penalty_amount: number | null;
      penalty_description: string | null;
      key_clauses: string | null;
    } | undefined;
  if (!row) return null;
  return {
    contract_id: row.contract_id,
    provider: row.provider,
    monthly_cost: row.monthly_cost,
    currency: row.currency ?? undefined,
    renewal_date: row.renewal_date,
    notice_period_days: row.notice_period_days ?? undefined,
    cancellation_deadline: row.cancellation_deadline ?? undefined,
    penalty_amount: row.penalty_amount ?? undefined,
    penalty_description: row.penalty_description ?? undefined,
    key_clauses: row.key_clauses ? (JSON.parse(row.key_clauses) as string[]) : undefined,
  };
}

export function getAllContractsWithFacts(): (Contract & { facts?: ContractFacts })[] {
  const contracts = getContracts();
  return contracts.map((c) => ({
    ...c,
    facts: getContractFacts(c.id) ?? undefined,
  }));
}

// --- Insights ---
export function insertInsight(insight: Omit<Insight, "created_at">): void {
  getDb()
    .prepare("INSERT INTO insights (id, type, payload, created_at) VALUES (?, ?, ?, ?)")
    .run(insight.id, insight.type, JSON.stringify(insight.payload), new Date().toISOString());
}

export function getRecentInsights(limit = 10): Insight[] {
  const rows = getDb()
    .prepare("SELECT id, type, payload, created_at FROM insights ORDER BY created_at DESC LIMIT ?")
    .all(limit) as { id: string; type: string; payload: string; created_at: string }[];
  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    payload: JSON.parse(r.payload) as Record<string, unknown>,
    created_at: r.created_at,
  }));
}

// --- Wipe vault ---
export function wipeVault(): void {
  const database = getDb();
  database.exec(`
    DELETE FROM network_audit;
    DELETE FROM agent_meetings;
    DELETE FROM agent_config;
    DELETE FROM chat_sessions;
    DELETE FROM insights;
    DELETE FROM contract_facts;
    DELETE FROM contracts;
    DELETE FROM transactions;
    DELETE FROM users;
  `);
}

// --- Export vault (decrypted) ---
export function exportVault(): {
  users: UserProfile[];
  transactions: Transaction[];
  contracts: (Contract & { facts?: ContractFacts })[];
  insights: Insight[];
  exportedAt: string;
} {
  const users = getDb().prepare("SELECT * FROM users").all() as { id: string; literacy_level: string; insight_style: string; online_consent: number; created_at: string }[];
  const profileList: UserProfile[] = users.map((r) => ({
    id: r.id,
    literacy_level: r.literacy_level as UserProfile["literacy_level"],
    insight_style: r.insight_style as UserProfile["insight_style"],
    online_consent: Boolean(r.online_consent),
    created_at: r.created_at,
  }));
  const transactions = getTransactions();
  const contracts = getAllContractsWithFacts();
  const insights = getDb().prepare("SELECT id, type, payload, created_at FROM insights").all() as { id: string; type: string; payload: string; created_at: string }[];
  const insightsList: Insight[] = insights.map((r) => ({
    id: r.id,
    type: r.type,
    payload: JSON.parse(r.payload) as Record<string, unknown>,
    created_at: r.created_at,
  }));
  return {
    users: profileList,
    transactions,
    contracts,
    insights: insightsList,
    exportedAt: new Date().toISOString(),
  };
}

// --- Chat messages ---
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export function insertChatMessage(msg: Omit<ChatMessage, "created_at">): void {
  getDb()
    .prepare(
      `INSERT OR IGNORE INTO chat_sessions (id, summary, created_at) VALUES (?, ?, ?)`
    )
    .run(msg.id, `${msg.role}: ${msg.content.slice(0, 80)}`, new Date().toISOString());
  // Store role + content in summary column since the table has no role/content cols.
  // We encode as JSON in summary for simplicity.
  getDb()
    .prepare(`UPDATE chat_sessions SET summary = ? WHERE id = ?`)
    .run(JSON.stringify({ role: msg.role, content: msg.content }), msg.id);
}

export function getChatMessages(limit = 100): ChatMessage[] {
  const rows = getDb()
    .prepare("SELECT id, summary, created_at FROM chat_sessions ORDER BY created_at ASC LIMIT ?")
    .all(limit) as { id: string; summary: string; created_at: string }[];
  return rows.flatMap((r) => {
    try {
      const parsed = JSON.parse(r.summary) as { role: "user" | "assistant"; content: string };
      return [{ id: r.id, role: parsed.role, content: parsed.content, created_at: r.created_at }];
    } catch {
      return [];
    }
  });
}

export function clearChatHistory(): void {
  getDb().prepare("DELETE FROM chat_sessions").run();
}

// --- Network audit ---
export function logNetworkRequest(url: string, method = "POST"): void {
  getDb()
    .prepare("INSERT INTO network_audit (id, url, method, timestamp) VALUES (?, ?, ?, ?)")
    .run(randomUUID(), url, method, new Date().toISOString());
}

export function getNetworkAudit(): { id: string; url: string; method: string; timestamp: string }[] {
  const rows = getDb().prepare("SELECT id, url, method, timestamp FROM network_audit ORDER BY timestamp DESC LIMIT 100").all() as { id: string; url: string; method: string; timestamp: string }[];
  return rows;
}

// --- Agent meetings ---
export interface AgentMeeting {
  id: string;
  title: string;
  status: "active" | "ended";
  agent_id: string;
  transcript: string | null;
  created_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
}

export function insertAgentMeeting(meeting: Omit<AgentMeeting, "ended_at" | "duration_seconds"> & { ended_at?: string | null; duration_seconds?: number | null }): void {
  getDb()
    .prepare(
      `INSERT INTO agent_meetings (id, title, status, agent_id, transcript, created_at, ended_at, duration_seconds)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      meeting.id,
      meeting.title,
      meeting.status,
      meeting.agent_id,
      meeting.transcript ?? null,
      meeting.created_at,
      meeting.ended_at ?? null,
      meeting.duration_seconds ?? null
    );
}

export function getAgentMeetings(): AgentMeeting[] {
  const rows = getDb()
    .prepare(
      "SELECT id, title, status, agent_id, transcript, created_at, ended_at, duration_seconds FROM agent_meetings ORDER BY created_at DESC"
    )
    .all() as {
    id: string;
    title: string;
    status: string;
    agent_id: string;
    transcript: string | null;
    created_at: string;
    ended_at: string | null;
    duration_seconds: number | null;
  }[];
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    status: r.status as "active" | "ended",
    agent_id: r.agent_id,
    transcript: r.transcript,
    created_at: r.created_at,
    ended_at: r.ended_at,
    duration_seconds: r.duration_seconds,
  }));
}

export function getAgentMeeting(id: string): AgentMeeting | null {
  const row = getDb()
    .prepare(
      "SELECT id, title, status, agent_id, transcript, created_at, ended_at, duration_seconds FROM agent_meetings WHERE id = ?"
    )
    .get(id) as {
    id: string;
    title: string;
    status: string;
    agent_id: string;
    transcript: string | null;
    created_at: string;
    ended_at: string | null;
    duration_seconds: number | null;
  } | undefined;
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    status: row.status as "active" | "ended",
    agent_id: row.agent_id,
    transcript: row.transcript,
    created_at: row.created_at,
    ended_at: row.ended_at,
    duration_seconds: row.duration_seconds,
  };
}

export function updateAgentMeeting(
  id: string,
  updates: { status?: "active" | "ended"; transcript?: string | null; ended_at?: string | null; duration_seconds?: number | null }
): void {
  const meeting = getAgentMeeting(id);
  if (!meeting) return;
  const status = updates.status ?? meeting.status;
  const transcript = updates.transcript !== undefined ? updates.transcript : meeting.transcript;
  const ended_at = updates.ended_at !== undefined ? updates.ended_at : meeting.ended_at;
  const duration_seconds = updates.duration_seconds !== undefined ? updates.duration_seconds : meeting.duration_seconds;
  getDb()
    .prepare(
      "UPDATE agent_meetings SET status = ?, transcript = ?, ended_at = ?, duration_seconds = ? WHERE id = ?"
    )
    .run(status, transcript, ended_at, duration_seconds, id);
}

export function deleteAgentMeeting(id: string): void {
  getDb().prepare("DELETE FROM agent_meetings WHERE id = ?").run(id);
}

// --- Agent config (e.g. cached agent_id) ---
export function getAgentConfig(key: string): string | null {
  const row = getDb()
    .prepare("SELECT value FROM agent_config WHERE key = ?")
    .get(key) as { value: string } | undefined;
  return row?.value ?? null;
}

export function setAgentConfig(key: string, value: string): void {
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `INSERT INTO agent_config (key, value, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
    )
    .run(key, value, now);
}