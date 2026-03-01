import { NextRequest, NextResponse } from "next/server";
import { SIMLI_FACE_IDS } from "@/lib/simli";

const SIMLI_API = "https://api.simli.ai";

const ALLOWED_FACE_IDS = new Set<string>(Object.values(SIMLI_FACE_IDS));

function getFaceId(request: NextRequest): string | null {
  const param = request.nextUrl.searchParams.get("face_id");
  if (param && ALLOWED_FACE_IDS.has(param)) return param;
  return process.env.SIMLI_FACE_ID ?? null;
}

export async function GET(request: NextRequest) {
  const apiKey = process.env.SIMLI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "SIMLI_API_KEY must be set" },
      { status: 503 }
    );
  }
  const faceId = getFaceId(request);
  if (!faceId) {
    return NextResponse.json(
      {
        error:
          "face_id required: use ?face_id=" +
          SIMLI_FACE_IDS.tina +
          " (Tina) or ?face_id=" +
          SIMLI_FACE_IDS.hank +
          " (Hank)",
      },
      { status: 400 }
    );
  }

  try {
    const [tokenRes, iceRes] = await Promise.all([
      fetch(`${SIMLI_API}/compose/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-simli-api-key": apiKey,
        },
        body: JSON.stringify({
          faceId,
          handleSilence: true,
          maxSessionLength: 600,
          maxIdleTime: 600,
        }),
      }),
      fetch(`${SIMLI_API}/compose/ice`, {
        method: "GET",
        headers: { "x-simli-api-key": apiKey },
      }),
    ]);

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error("Simli token error:", tokenRes.status, err);
      return NextResponse.json(
        { error: "Failed to get Simli session token" },
        { status: 502 }
      );
    }

    const tokenData = (await tokenRes.json()) as { session_token?: string };
    const sessionToken = tokenData?.session_token;
    if (!sessionToken || typeof sessionToken !== "string") {
      return NextResponse.json(
        { error: "Invalid Simli token response" },
        { status: 502 }
      );
    }

    let iceServers: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }];
    if (iceRes.ok) {
      const ice = (await iceRes.json()) as RTCIceServer[];
      if (Array.isArray(ice) && ice.length > 0) iceServers = ice;
    }

    return NextResponse.json({ session_token: sessionToken, ice_servers: iceServers });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Simli token failed" },
      { status: 500 }
    );
  }
}
