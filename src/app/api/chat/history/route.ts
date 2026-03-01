import { NextRequest, NextResponse } from "next/server";
import { getChatMessages, insertChatMessage, clearChatHistory } from "@/lib/db";
import { randomUUID } from "node:crypto";

export async function GET() {
  try {
    const messages = getChatMessages();
    return NextResponse.json({ messages });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ messages: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { role, content } = (await request.json()) as { role?: string; content?: string };
    if (!role || !content) {
      return NextResponse.json({ error: "Missing role or content" }, { status: 400 });
    }
    insertChatMessage({ id: randomUUID(), role: role as "user" | "assistant", content });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to save message" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    clearChatHistory();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to clear history" }, { status: 500 });
  }
}
