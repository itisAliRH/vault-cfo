import { NextRequest, NextResponse } from "next/server";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM";

export async function POST(request: NextRequest) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ELEVENLABS_API_KEY not set" }, { status: 503 });
  }
  try {
    const { text } = (await request.json()) as { text?: string };
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Missing text" }, { status: 400 });
    }
    const client = new ElevenLabsClient({ apiKey });
    const stream = await client.textToSpeech.convert(DEFAULT_VOICE_ID, {
      text: text.slice(0, 5000),
    });
    return new NextResponse(stream, {
      headers: {
        "Content-Type": "audio/mpeg",
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "TTS failed" },
      { status: 500 }
    );
  }
}
