import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import {
  getAgentMeetings,
  insertAgentMeeting,
  getAgentConfig,
} from "@/lib/db";

export async function GET() {
  try {
    const meetings = getAgentMeetings();
    return NextResponse.json({ sessions: meetings });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to list sessions" },
      { status: 500 }
    );
  }
}

const PENDING_AGENT_ID = "pending";

export async function POST() {
  // Check both legacy key and face-specific keys (tina is the default face)
  const agentId =
    getAgentConfig("vaultcfo_convai_agent_id") ??
    getAgentConfig("vaultcfo_convai_agent_id_tina") ??
    getAgentConfig("vaultcfo_convai_agent_id_hank") ??
    PENDING_AGENT_ID;

  try {
    const id = randomUUID();
    const now = new Date().toISOString();
    insertAgentMeeting({
      id,
      title: `Meeting ${now.slice(0, 10)}`,
      status: "active",
      agent_id: agentId,
      transcript: null,
      created_at: now,
    });
    return NextResponse.json({
      id,
      title: `Meeting ${now.slice(0, 10)}`,
      status: "active",
      agent_id: agentId,
      created_at: now,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}
