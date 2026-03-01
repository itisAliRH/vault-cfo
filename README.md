# VaultCFO — Private AI CFO

A privacy-first personal finance assistant: encrypted local vault, expense dashboard, contract analyzer, and an AI agent that uses Mistral Small 3.2 via the Mistral API (or any compatible endpoint). Built for the **NVIDIA On-Device** track.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Next.js 16 App (App Router, src/)                                       │
├─────────────────────────────────────────────────────────────────────────┤
│  UI: Dashboard | Contracts | Insights | Agent Chat | Settings            │
│  Pixel theme (Press Start 2P, retro palette), shadcn/ui, Recharts        │
├─────────────────────────────────────────────────────────────────────────┤
│  API Routes                                                              │
│  /api/onboarding  /api/transactions  /api/contracts  /api/insights      │
│  /api/chat        /api/vault         /api/health/perf  /api/voice/tts   /api/voice/stt  │
├─────────────────────────────────────────────────────────────────────────┤
│  Lib: encryption (AES-256-GCM) | db (SQLite, better-sqlite3)             │
│  Ingest: csv (papaparse), pdf (pdf-parse), contract-extract (LLM)       │
│  Analytics: budget, spikes, subscriptions, simulator                    │
│  Agent: models (Mistral Small 3.2), tools (getUserProfile, listTransactions…)  │
├─────────────────────────────────────────────────────────────────────────┤
│  Data: ./data/vault.db (encrypted sensitive fields)                      │
│  Inference: Mistral API (OpenAI-compatible); ElevenLabs: TTS + STT (voice)  │
└─────────────────────────────────────────────────────────────────────────┘
```

- **Vault:** SQLite at `./data/vault.db`; sensitive fields (amounts, merchant, contract text) encrypted with AES-256-GCM; key from `ENCRYPTION_PASSPHRASE`.
- **Agent:** Vercel AI SDK `streamText` with tool calling; fast model (8B) for chat, reasoning model (14B) for contract extraction; max 5 tool steps; guardrails in system prompt.
- **Performance:** `/api/health/perf` pings the Mistral backend, returns model name, latency, backend label, VRAM (when returned by the provider); cached 30s; shown in Settings and sidebar.

## Run locally

1. **Clone and install**
   ```bash
   cd vaultcfo && pnpm install
   ```

2. **Environment**
   ```bash
   cp .env.local.example .env.local
   ```
   Set:
   - `ENCRYPTION_PASSPHRASE` — used to encrypt vault data (pick a strong passphrase).
   - `MISTRAL_API_KEY` — for Mistral inference (chat + contract extraction). Without it, chat and contract parsing will fail.
   - Optional: `MISTRAL_API_URL` — override the default `https://api.mistral.ai/v1` (e.g. `http://localhost:8000/v1` for a local/OpenAI-compatible deployment).
   - Optional: `ELEVENLABS_API_KEY` for voice: TTS (Listen on assistant messages) and STT (mic button: press to talk → transcribe → send).

3. **Dev server**
   ```bash
   pnpm dev
   ```
   Open [http://localhost:3000](http://localhost:3000). First visit → onboarding; then Dashboard.

4. **Demo data**
   On the Dashboard, click **Load Demo Data** to import sample transactions (CSV) and two sample contracts (text). Then try the Agent Chat (e.g. “How can I save 200€/month?”) and check Contracts and Insights.

## Run with Docker

- Build and run the app with your Mistral (or compatible) endpoint reachable:
- Use the included **Dockerfile** for a container that runs Next.js standalone and keeps `./data` for the DB:
  ```bash
  docker build -t vaultcfo . && docker run -p 3000:3000 -v vaultcfo-data:/app/data \
    -e ENCRYPTION_PASSPHRASE=xxx \
    -e MISTRAL_API_KEY=xxx \
    -e MISTRAL_API_URL=https://api.mistral.ai/v1 \
    vaultcfo
  ```

## Track: NVIDIA On-Device

- **Inference:** Mistral Small 3.2 via the Mistral API (or any OpenAI-compatible deployment).
- **Efficiency:** Single small model for both chat/tools and contract fact extraction to keep the demo simple.
- **Observability:** Performance panel in Settings and sidebar: model name, latency, backend label, VRAM (when returned by the provider).

## Scripts

- `pnpm dev` — development
- `pnpm build` — production build
- `pnpm start` — run production server
- `pnpm lint` — ESLint

## License

MIT.
