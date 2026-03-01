import { NextRequest, NextResponse } from "next/server";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const STT_MODEL_ID = "scribe_v1";

export async function POST(request: NextRequest) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ELEVENLABS_API_KEY not set" },
      { status: 503 }
    );
  }
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: "Missing or invalid file in form data (key: file)" },
        { status: 400 }
      );
    }
    const client = new ElevenLabsClient({ apiKey });
    const response = await client.speechToText.convert({
      modelId: STT_MODEL_ID,
      file: file as unknown as Blob,
    });
    const resolved = await response;
    const data = resolved && typeof resolved === "object" && "data" in resolved ? (resolved as { data: unknown }).data : resolved;
    if (!data || typeof data !== "object") {
      return NextResponse.json(
        { error: "Invalid STT response" },
        { status: 502 }
      );
    }
    const text =
      "text" in data && typeof (data as { text?: string }).text === "string"
        ? (data as { text: string }).text
        : "transcripts" in data && Array.isArray((data as { transcripts?: unknown[] }).transcripts)
        ? (data as { transcripts: { text?: string }[] }).transcripts
            .map((t) => t.text ?? "")
            .join(" ")
        : "";
    return NextResponse.json({ text: text.trim() });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "STT failed" },
      { status: 500 }
    );
  }
}
