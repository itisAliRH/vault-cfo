import { NextResponse } from "next/server";
import { getNetworkAudit } from "@/lib/db";

export async function GET() {
  try {
    const entries = getNetworkAudit();
    return NextResponse.json({ entries });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to get network log" }, { status: 500 });
  }
}
