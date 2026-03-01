import { NextResponse } from "next/server";

/**
 * GET /api/agent-meeting/env-check
 * Returns which env vars are set (names only, no values) so the UI can show what's missing.
 * Next.js only reads .env.local when the server starts — restart after changing.
 */
export async function GET() {
  return NextResponse.json({
    ELEVENLABS_API_KEY: Boolean(process.env.ELEVENLABS_API_KEY),
    SIMLI_API_KEY: Boolean(process.env.SIMLI_API_KEY),
  });
}
