# VaultCFO — Private AI CFO

**Your finances should never leave your device.**

A privacy-first personal finance assistant: encrypted local vault, expense dashboard, contract analyzer, and an AI agent powered by Mistral. Voice mode and real-time video avatar (ElevenLabs + Simli) included. Built for the **NVIDIA On-Device** track at Mistral AI Hackathon Paris 2026.

- **Live demo:** [https://vault-cfo.vercel.app/](https://vault-cfo.vercel.app/)
- **Track:** NVIDIA On-Device · **Optional:** ElevenLabs (voice + avatar)

---

## Features

| Feature | Description |
|--------|-------------|
| **Dashboard** | Income, expenses, net cashflow, category breakdown, 6‑month trends. Upload CSV bank exports; all data stays local. |
| **Contracts** | Upload PDFs or paste text. AI extracts provider, monthly cost, renewal date, cancellation window, key clauses. Renewal countdown and alerts. |
| **AI Agent Chat** | Ask in plain language (e.g. “How can I save 200€/month?”). Agent uses 7 local tools: budget summary, spending spikes, contracts, savings simulator, action plans. Tool trace visible in UI. |
| **Think Mode** | Deeper reasoning (Magistral Small) for step‑by‑step analysis. |
| **Voice** | ElevenLabs TTS (listen to assistant replies) and STT (press‑to‑talk). Optional. |
| **Agent Meeting** | Real-time video avatar (Simli + ElevenLabs): speak to your CFO, get lip-synced video responses. |
| **Privacy** | AES-256-GCM encryption, PBKDF2 key derivation, local SQLite vault. Network audit log; one-click vault wipe. Offline by default; cloud only with explicit consent. |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Next.js 16 App (App Router, src/)                                       │
├─────────────────────────────────────────────────────────────────────────┤
│  UI: Dashboard | Contracts | Insights | Agent Chat | Agent Meeting | Settings │
│  Pixel theme (Press Start 2P), shadcn/ui, Recharts                       │
├─────────────────────────────────────────────────────────────────────────┤
│  API Routes                                                              │
│  /api/onboarding  /api/transactions  /api/contracts  /api/insights      │
│  /api/chat  /api/vault  /api/health/perf  /api/voice/tts  /api/voice/stt │
│  /api/agent-meeting/* (sessions, agent, simli-token, signed-url)         │
├─────────────────────────────────────────────────────────────────────────┤
│  Lib: encryption (AES-256-GCM) | db (SQLite, better-sqlite3)            │
│  Ingest: csv (papaparse), pdf (pdf-parse), contract-extract (LLM)        │
│  Analytics: budget, spikes, subscriptions, savings simulator            │
│  Agent: Mistral Small (chat) + Magistral Small (reasoning), 7 tools       │
├─────────────────────────────────────────────────────────────────────────┤
│  Data: ./data/vault.db (sensitive fields encrypted)                      │
│  Inference: Mistral API (OpenAI-compatible); ElevenLabs TTS/STT; Simli   │
└─────────────────────────────────────────────────────────────────────────┘
```

- **Vault:** SQLite at `./data/vault.db`; sensitive fields encrypted with AES-256-GCM; key from `ENCRYPTION_PASSPHRASE`.
- **Agent:** Vercel AI SDK `streamText` with tool calling; Mistral Small (fast chat), Magistral Small (think mode + contract extraction); max 5 tool steps; guardrails in system prompt.
- **Performance:** `/api/health/perf` returns model name, latency, backend label; cached 30s; shown in Settings and sidebar.

---

## Agent tools

The AI agent can call these tools on your local vault (no cloud unless you opt in):

| Tool | Purpose |
|------|--------|
| `getUserProfile` | Onboarding profile (literacy level, insight style, online consent). |
| `listTransactions` | List transactions in an optional date range. |
| `computeBudgetSummary` | Total income, expenses, net cashflow, by category, monthly breakdown. |
| `detectSpendingSpikes` | Categories where spending is >30% above 3‑month average. |
| `listContracts` | All contracts with extracted facts (provider, cost, renewal). |
| `getContractFacts` | Detailed facts for one contract by ID. |
| `simulateSavings` | Simulate savings from canceling subscriptions or reducing spending. |
| `createActionPlan` | Generate a short savings action plan for a goal (e.g. save 200€/month). |

---

## Tech stack

| Layer | Stack |
|-------|--------|
| **Frontend** | Next.js 16, React 19, Tailwind 4, shadcn/ui, Recharts |
| **AI** | Vercel AI SDK, Mistral Small / Magistral Small (Mistral API), ElevenLabs (TTS/STT), Simli (video avatar) |
| **Data** | SQLite (better-sqlite3), AES-256-GCM encryption, PBKDF2 key derivation |
| **Ingest** | papaparse (CSV), pdf-parse (PDF), LLM-based contract extraction |

---

## Run locally

### 1. Clone and install

```bash
git clone https://github.com/itisAliRH/vault-cfo.git
cd vault-cfo
pnpm install
```

### 2. Environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and set:

| Variable | Required | Description |
|----------|----------|-------------|
| `ENCRYPTION_PASSPHRASE` | Yes | Strong passphrase for vault encryption. |
| `MISTRAL_API_KEY` | Yes | Mistral API key (chat + contract extraction). |
| `MISTRAL_API_URL` | No | Default `https://api.mistral.ai/v1`. Override for local/OpenAI-compatible endpoint. |
| `ELEVENLABS_API_KEY` | No | Voice TTS/STT and Agent Meeting. |
| `SIMLI_API_KEY` | No | Real-time video avatar (Agent Meeting). |

### 3. Dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). First visit → onboarding; then Dashboard.

### 4. Demo data

On the **Dashboard**, click **Load Demo Data** to import sample transactions (CSV) and two sample contracts. Then try:

- **Agent Chat:** e.g. “How can I save 200€/month?”
- **Contracts:** view extracted terms and renewal countdowns
- **Insights:** spending alerts and summaries

---

## Run with Docker

```bash
docker build -t vaultcfo .
docker run -p 3000:3000 -v vaultcfo-data:/app/data \
  -e ENCRYPTION_PASSPHRASE=your-passphrase \
  -e MISTRAL_API_KEY=your-mistral-key \
  -e MISTRAL_API_URL=https://api.mistral.ai/v1 \
  vaultcfo
```

The app uses `./data` for the SQLite vault; the volume keeps data across container restarts.

---

## Project structure

```
vaultcfo/
├── src/
│   ├── app/                    # App Router pages and API routes
│   │   ├── (app)/              # Dashboard, Contracts, Chat, Settings, etc.
│   │   ├── (marketing)/        # Landing page
│   │   └── api/                # REST and chat/voice/agent-meeting APIs
│   ├── components/             # UI components, layout, meeting
│   ├── lib/                    # db, encryption, models, tools, analytics
│   └── hooks/
├── sample-data/               # Demo CSVs and contract samples
├── data/                      # vault.db (created at runtime)
├── .env.local.example
├── Dockerfile
└── README.md
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server (Turbopack). |
| `pnpm build` | Production build. |
| `pnpm start` | Run production server. |
| `pnpm lint` | Run ESLint. |

---

## Track: NVIDIA On-Device

- **Inference:** Mistral Small / Magistral Small via Mistral API (or any OpenAI-compatible deployment, e.g. Brev GPU).
- **Efficiency:** Small models for chat and extraction; tool-based agent to limit token use.
- **Observability:** Performance panel in Settings and sidebar: model name, latency, backend label.

---

## License

MIT.
