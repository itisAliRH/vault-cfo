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

export async function POST(request: NextRequest) {
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
    upsertUserProfile({
      literacy_level,
      insight_style,
      online_consent: Boolean(online_consent),
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    console.error(e);
    const isBindings = err.message.includes("Could not locate the bindings");
    const status = isBindings ? 503 : 500;
    const body = isBindings
      ? { error: "Database not ready.", hint: "In the project folder run: pnpm rebuild better-sqlite3 then restart the dev server." }
      : { error: "Failed to save profile" };
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
