# ElevenLabs agent/session patterns (inspired by discens-app)

Reference: [discens-app](https://github.com/itisAliRH/discens) — working dynamic agents and voice sessions.

## How discens uses ElevenLabs

1. **Single backend call**  
   `POST /api/voice/agent` creates the agent, fetches the signed URL, and returns `{ agentId, signedUrl }` in one response. The frontend never calls a separate signed-URL endpoint.

2. **Minimal agent payload**  
   Only `agent` (first_message, language, prompt) and `tts` (voice_id, model_id, stability, similarity_boost). No `asr`, `conversation`, or `turn` — the API uses defaults. Reduces validation issues (e.g. “English agents must use turbo or flash v2”).

3. **@elevenlabs/react**  
   Uses `useConversation({ onConnect, onDisconnect, onMessage, onError })` and `startSession({ signedUrl, connectionType: "websocket" })` so the WebSocket and audio are handled by the SDK.

4. **Language**  
   discens uses `targetLanguage: "de"` (German). The “turbo or flash v2” rule applies to **English** agents; for English we use `model_id: "eleven_flash_v2_5"`.

5. **Agent lifecycle**  
   Agents are created per scenario/session; optional in-memory cache by config hash; `DELETE /api/voice/agent` cleans up when the session ends.

## How vaultcfo differs

- **Avatar**  
  vaultcfo uses Simli for a live avatar and a custom pipeline: ElevenLabs WebSocket for audio + Simli for lip-sync video. So we don’t use `@elevenlabs/react` for the session; we open the ElevenLabs WebSocket and stream PCM ourselves from the session page.

- **Session storage**  
  We persist meetings in SQLite (`agent_meetings`). “New meeting” creates an agent (or uses cached id), then creates a session row, then redirects to `/agent-meeting/[id]`. The session page loads the session (for `agent_id`), then fetches signed URL and Simli token when the user starts the meeting.

- **Same patterns we adopted**  
  - Minimal create payload: `agent` + `tts` only (no `asr` in the request).  
  - English: `model_id: "eleven_flash_v2_5"` and `language: "en"`.  
  - Signed URL is fetched when starting the meeting (GET `/api/agent-meeting/signed-url?agent_id=...`) since we don’t start in the same request as “New meeting”.

## API reference

- Create agent: `POST https://api.elevenlabs.io/v1/convai/agents/create`  
- Signed URL: `GET https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=...`  
- Delete agent: `DELETE https://api.elevenlabs.io/v1/convai/agents/{agent_id}`  

Headers: `xi-api-key`, `Content-Type: application/json` for POST.
