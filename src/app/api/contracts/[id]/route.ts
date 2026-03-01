import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    db.prepare(`DELETE FROM contract_facts WHERE contract_id = ?`).run(id);
    db.prepare(`DELETE FROM contracts WHERE id = ?`).run(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete contract" }, { status: 500 });
  }
}
