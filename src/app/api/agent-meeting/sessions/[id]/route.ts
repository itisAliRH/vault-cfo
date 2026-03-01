import { NextRequest, NextResponse } from "next/server";
import {
  getAgentMeeting,
  updateAgentMeeting,
  deleteAgentMeeting,
} from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const meeting = getAgentMeeting(id);
    if (!meeting) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    return NextResponse.json(meeting);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to get session" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const meeting = getAgentMeeting(id);
  if (!meeting) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  try {
    const body = (await request.json()) as {
      status?: "active" | "paused" | "ended";
      transcript?: string | null;
      ended_at?: string | null;
      duration_seconds?: number | null;
      sharing_config?: string | null;
      summary?: string | null;
    };
    const updates: Parameters<typeof updateAgentMeeting>[1] = {};
    if (body.status !== undefined) updates.status = body.status;
    if (body.transcript !== undefined) updates.transcript = body.transcript;
    if (body.ended_at !== undefined) updates.ended_at = body.ended_at;
    if (body.duration_seconds !== undefined) updates.duration_seconds = body.duration_seconds;
    if (body.sharing_config !== undefined) updates.sharing_config = body.sharing_config;
    if (body.summary !== undefined) updates.summary = body.summary;
    if (Object.keys(updates).length > 0) updateAgentMeeting(id, updates);
    const updated = getAgentMeeting(id);
    return NextResponse.json(updated);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to update session" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const meeting = getAgentMeeting(id);
  if (!meeting) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  try {
    deleteAgentMeeting(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to delete session" },
      { status: 500 }
    );
  }
}
