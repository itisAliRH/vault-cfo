import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserProfile, upsertUserProfile, deleteUserProfile } from "@/lib/db";
import type { UserProfile } from "@/types";

const PROFILE_COOKIE = "vaultcfo_profile";
const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 365,
  path: "/",
};

function getProfileFromCookie(cookieStore: Awaited<ReturnType<typeof cookies>>): UserProfile | null {
  const cookie = cookieStore.get(PROFILE_COOKIE)?.value;
  if (!cookie) return null;
  try {
    const parsed = JSON.parse(cookie) as unknown;
    if (
      parsed &&
      typeof parsed === "object" &&
      ["beginner", "intermediate", "advanced"].includes((parsed as UserProfile).literacy_level) &&
      ["simple", "deep"].includes((parsed as UserProfile).insight_style)
    ) {
      return parsed as UserProfile;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export async function GET() {
  try {
    let profile = getUserProfile();
    if (!profile && process.env.VERCEL === "1") {
      const cookieStore = await cookies();
      profile = getProfileFromCookie(cookieStore);
    }
    if (!profile) {
      return NextResponse.json({ profile: null }, { status: 404 });
    }
    return NextResponse.json({ profile });
  } catch (e) {
    console.error(e);
    if (process.env.VERCEL === "1") {
      try {
        const cookieStore = await cookies();
        const profile = getProfileFromCookie(cookieStore);
        if (profile) return NextResponse.json({ profile });
      } catch {
        /* ignore */
      }
    }
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
    const res = NextResponse.json({ ok: true });
    if (process.env.VERCEL === "1") {
      const profile = getUserProfile();
      if (profile) {
        res.cookies.set(PROFILE_COOKIE, JSON.stringify(profile), COOKIE_OPTS);
      }
    }
    return res;
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
    const res = NextResponse.json({ ok: true });
    if (process.env.VERCEL === "1") {
      res.cookies.delete(PROFILE_COOKIE);
    }
    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to reset onboarding" }, { status: 500 });
  }
}
