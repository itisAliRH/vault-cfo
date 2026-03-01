import { NextRequest, NextResponse } from "next/server";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM";
const TTS_CACHE_MAX = 50;

/** In-memory TTS cache by text to avoid repeated ElevenLabs calls for the same phrase. */
const ttsCache = new Map<string, Buffer>();

function evictTtsCacheIfNeeded() {
  if (ttsCache.size > TTS_CACHE_MAX) {
    const firstKey = ttsCache.keys().next().value;
    if (firstKey !== undefined) ttsCache.delete(firstKey);
  }
}

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
    const key = text.slice(0, 5000);
    const cached = ttsCache.get(key);
    if (cached) {
      return new NextResponse(new Uint8Array(cached), {
        headers: {
          "Content-Type": "audio/mpeg",
          "X-TTS-Cache": "HIT",
        },
      });
    }
    const client = new ElevenLabsClient({ apiKey });
    const stream = await client.textToSpeech.convert(DEFAULT_VOICE_ID, { text: key });
    let buffer: Buffer;
    if (stream instanceof Uint8Array || Buffer.isBuffer(stream)) {
      buffer = Buffer.from(stream);
    } else if (typeof (stream as unknown as { arrayBuffer?: () => Promise<ArrayBuffer> }).arrayBuffer === "function") {
      const ab = await (stream as unknown as Blob).arrayBuffer();
      buffer = Buffer.from(ab);
    } else {
      const chunks: Uint8Array[] = [];
      const r = stream as AsyncIterable<Uint8Array> | ReadableStream<Uint8Array>;
      if (typeof (r as ReadableStream).getReader === "function") {
        const reader = (r as ReadableStream<Uint8Array>).getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) chunks.push(value);
        }
      } else {
        for await (const chunk of r as AsyncIterable<Uint8Array>) {
          chunks.push(chunk);
        }
      }
      buffer = Buffer.concat(chunks);
    }
    ttsCache.set(key, buffer);
    evictTtsCacheIfNeeded();
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "audio/mpeg",
        "X-TTS-Cache": "MISS",
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
