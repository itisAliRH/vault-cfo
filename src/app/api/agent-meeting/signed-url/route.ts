import { NextRequest, NextResponse } from "next/server";
import { getAgentConfig } from "@/lib/db";

const ELEVENLABS_AGENT_CONFIG_KEY = "vaultcfo_convai_agent_id";

export async function GET(request: NextRequest) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ELEVENLABS_API_KEY not set" },
      { status: 503 }
    );
  }

  const agentId =
    request.nextUrl.searchParams.get("agent_id") ??
    getAgentConfig(ELEVENLABS_AGENT_CONFIG_KEY);
  if (!agentId) {
    return NextResponse.json(
      { error: "No agent_id; create agent first via POST /api/agent-meeting/agent" },
      { status: 400 }
    );
  }

  try {
    const url = new URL("https://api.elevenlabs.io/v1/convai/conversation/get-signed-url");
    url.searchParams.set("agent_id", agentId);

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: { "xi-api-key": apiKey },
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("ElevenLabs signed URL error:", res.status, err);
      return NextResponse.json(
        { error: "Failed to get signed URL", details: err },
        { status: res.status >= 500 ? 502 : res.status }
      );
    }

    const data = (await res.json()) as { signed_url?: string };
    const signedUrl = data?.signed_url;
    if (!signedUrl || typeof signedUrl !== "string") {
      return NextResponse.json(
        { error: "Invalid signed URL response" },
        { status: 502 }
      );
    }

    return NextResponse.json({ signed_url: signedUrl });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Signed URL failed" },
      { status: 500 }
    );
  }
}
