import { NextRequest, NextResponse } from "next/server";
import { exportVault, wipeVault } from "@/lib/db";

export async function GET() {
  try {
    const data = exportVault();
    return NextResponse.json(data);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const confirm = searchParams.get("confirm");
    if (confirm !== "wipe") {
      return NextResponse.json(
        { error: "Add ?confirm=wipe to confirm vault wipe" },
        { status: 400 }
      );
    }
    wipeVault();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Wipe failed" }, { status: 500 });
  }
}
