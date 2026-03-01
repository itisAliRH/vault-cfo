import { NextRequest, NextResponse } from "next/server";
import { getAgentConfig, setAgentConfig } from "@/lib/db";

// Tina = Rachel (female), Hank = Josh (male)
const VOICES = {
  tina: { voiceId: "21m00Tcm4TlvDq8ikWAM", name: "Tina" },
  hank: { voiceId: "TxGEqnHWrfWFTfGW9XjX", name: "Hank" },
} as const;

type Face = keyof typeof VOICES;

const AGENT_PROMPT = `You are a senior finance consultant at VaultCFO. You are warm, welcoming, and professional yet approachable.

Your role:
- Help users with budgeting, spending, contracts, savings, and investments.
- Stay strictly within finance topics; if the user asks about something unrelated, politely redirect to how you can help with their finances.
- Be empathetic and use reassuring language. Ask follow-up questions to understand their situation.
- Suggest actionable, practical steps. Never make up numbers or data—only refer to what the user or their VaultCFO data provides.
- Keep responses concise and clear. Add a brief disclaimer that you provide guidance, not regulated financial advice.`;

const FIRST_MESSAGE =
  "Hello! Welcome to VaultCFO. I'm your personal finance consultant. How can I help you with your finances today?";

async function createAgent(apiKey: string, face: Face): Promise<string> {
  const { voiceId, name } = VOICES[face];
  const res = await fetch("https://api.elevenlabs.io/v1/convai/agents/create", {
    method: "POST",
    headers: { "Content-Type": "application/json", "xi-api-key": apiKey },
    body: JSON.stringify({
      name: `VaultCFO — ${name}`,
      conversation_config: {
        tts: {
          model_id: "eleven_flash_v2",
          voice_id: voiceId,
          stability: 0.5,
          similarity_boost: 0.75,
        },
        agent: {
          first_message: FIRST_MESSAGE,
          language: "en",
          prompt: {
            prompt: AGENT_PROMPT,
            llm: "gpt-4o-mini",
            temperature: 0.7,
            max_tokens: 1024,
          },
        },
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`ElevenLabs create agent (${face}) error:`, res.status, err);
    throw new Error(`Failed to create agent: ${res.status}`);
  }

  const data = (await res.json()) as { agent_id?: string };
  const agentId = data?.agent_id;
  if (!agentId || typeof agentId !== "string") throw new Error("Invalid create agent response");
  return agentId;
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ELEVENLABS_API_KEY not set" }, { status: 503 });
  }

  const face: Face =
    request.nextUrl.searchParams.get("face") === "hank" ? "hank" : "tina";
  const cacheKey = `vaultcfo_convai_agent_id_${face}`;

  const cached = getAgentConfig(cacheKey);
  if (cached) return NextResponse.json({ agent_id: cached });

  try {
    const agentId = await createAgent(apiKey, face);
    setAgentConfig(cacheKey, agentId);
    return NextResponse.json({ agent_id: agentId });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Agent creation failed" },
      { status: 500 }
    );
  }
}
