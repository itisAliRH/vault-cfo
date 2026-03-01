import { NextRequest, NextResponse } from "next/server";
import { getUserProfile, upsertUserProfile, deleteUserProfile } from "@/lib/db";
import type { UserProfile } from "@/types";

export async function GET() {
  try {
    const profile = getUserProfile();
    if (!profile) {
      return NextResponse.json({ profile: null }, { status: 404 });
    }
    return NextResponse.json({ profile });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ profile: null }, { status: 500 });
  }
}

const DEBUG_INGEST =
  "http://127.0.0.1:7524/ingest/0bfddef5-e779-4680-895c-1765323b8807";

function logDebug(payload: {
  location: string;
  message: string;
  data?: Record<string, unknown>;
  hypothesisId?: string;
}) {
  const body = {
    sessionId: "1cc13d",
    location: payload.location,
    message: payload.message,
    data: payload.data ?? {},
    hypothesisId: payload.hypothesisId ?? "onboarding",
    timestamp: Date.now(),
  };
  fetch(DEBUG_INGEST, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "1cc13d" },
    body: JSON.stringify(body),
  }).catch(() => {});
}

export async function POST(request: NextRequest) {
  // #region agent log
  logDebug({
    location: "onboarding/route.ts:POST:entry",
    message: "POST /api/onboarding received",
    hypothesisId: "A",
  });
  // #endregion
  try {
    const body = await request.json();
    const { literacy_level, insight_style, online_consent } = body as Partial<UserProfile>;
    if (
      !literacy_level ||
      !["beginner", "intermediate", "advanced"].includes(literacy_level) ||
      !insight_style ||
      !["simple", "deep"].includes(insight_style)
    ) {
      return NextResponse.json(
        { error: "Invalid body: literacy_level (beginner|intermediate|advanced), insight_style (simple|deep), online_consent (boolean)" },
        { status: 400 }
      );
    }
    // #region agent log
    logDebug({
      location: "onboarding/route.ts:POST:before-upsert",
      message: "Calling upsertUserProfile",
      data: { literacy_level, insight_style },
      hypothesisId: "B",
    });
    // #endregion
    upsertUserProfile({
      literacy_level,
      insight_style,
      online_consent: Boolean(online_consent),
    });
    // #region agent log
    logDebug({
      location: "onboarding/route.ts:POST:after-upsert",
      message: "upsertUserProfile succeeded",
      hypothesisId: "C",
    });
    // #endregion
    return NextResponse.json({ ok: true });
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    const errMessage = err.message;
    const errName = err.name;
    const isBindings = errMessage.includes("Could not locate the bindings");
    const isErofs =
      errMessage.includes("EROFS") ||
      errMessage.includes("read-only") ||
      errMessage.includes("EACCES");
    // #region agent log
    logDebug({
      location: "onboarding/route.ts:POST:catch",
      message: "POST /api/onboarding threw",
      data: {
        errMessage,
        errName,
        isBindings,
        isErofs,
      },
      hypothesisId: "D",
    });
    // #endregion
    console.error(e);
    const status = isBindings ? 503 : 500;
    const body: { error: string; hint?: string; debug?: { message: string; name: string } } = isBindings
      ? { error: "Database not ready.", hint: "In the project folder run: pnpm rebuild better-sqlite3 then restart the dev server." }
      : { error: "Failed to save profile" };
    if (process.env.DEBUG_ONBOARDING === "1") {
      body.debug = { message: errMessage, name: errName };
    }
    return NextResponse.json(body, { status });
  }
}

export async function DELETE() {
  try {
    deleteUserProfile();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to reset onboarding" }, { status: 500 });
  }
}
