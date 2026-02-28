import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import {
  insertContract,
  insertContractFacts,
  getAllContractsWithFacts,
} from "@/lib/db";
import { extractTextFromPDF } from "@/lib/ingest/pdf";
import { extractContractFacts } from "@/lib/ingest/contract-extract";

export async function GET() {
  try {
    const contracts = getAllContractsWithFacts();
    return NextResponse.json({ contracts });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to list contracts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    let text: string;

    let filename = "pasted.txt";
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      const pasted = formData.get("text") as string | null;
      if (pasted && pasted.trim()) {
        text = pasted.trim();
      } else if (file) {
        filename = file.name ?? "upload.pdf";
        const buffer = Buffer.from(await file.arrayBuffer());
        const name = (file.name ?? "").toLowerCase();
        if (name.endsWith(".pdf")) {
          text = await extractTextFromPDF(buffer);
        } else {
          text = await file.text();
        }
      } else {
        return NextResponse.json({ error: "Missing file or text" }, { status: 400 });
      }
    } else if (contentType.includes("application/json")) {
      const body = await request.json();
      text = body.text ?? body.content ?? "";
      if (!text.trim()) {
        return NextResponse.json({ error: "Missing text" }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: "Expect multipart/form-data or application/json" }, { status: 400 });
    }

    const id = randomUUID();
    insertContract({ id, filename, raw_text_hash: undefined });

    let facts: Awaited<ReturnType<typeof extractContractFacts>>;
    try {
      facts = await extractContractFacts(text);
    } catch (err) {
      // #region agent log
      fetch("http://127.0.0.1:7524/ingest/0bfddef5-e779-4680-895c-1765323b8807", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "237f40",
        },
        body: JSON.stringify({
          sessionId: "237f40",
          runId: "pre-fix",
          hypothesisId: "H1",
          location: "api/contracts/route.ts:POST:fallback",
          message: "extractContractFacts failed, using fallback facts",
          data: {
            error: err instanceof Error ? err.message : String(err),
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion

      facts = {
        provider_name: "Unknown",
        monthly_cost: 0,
        currency: "EUR",
        renewal_date: new Date().toISOString().slice(0, 10),
        key_clauses: [],
      };
    }
    insertContractFacts({
      contract_id: id,
      provider: facts.provider_name,
      monthly_cost: facts.monthly_cost,
      currency: facts.currency,
      renewal_date: facts.renewal_date,
      notice_period_days: facts.notice_period_days,
      cancellation_deadline: facts.cancellation_deadline,
      penalty_amount: facts.penalty_amount,
      penalty_description: facts.penalty_description,
      key_clauses: facts.key_clauses,
    });

    // #region agent log
    fetch("http://127.0.0.1:7524/ingest/0bfddef5-e779-4680-895c-1765323b8807", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "237f40",
      },
      body: JSON.stringify({
        sessionId: "237f40",
        runId: "pre-fix",
        hypothesisId: "H2",
        location: "api/contracts/route.ts:POST:inserted",
        message: "contract facts inserted",
        data: {
          contract_id: id,
          provider: facts.provider_name,
          monthly_cost: facts.monthly_cost,
          currency: facts.currency,
          renewal_date: facts.renewal_date,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    return NextResponse.json({ ok: true, id });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to process contract" },
      { status: 500 }
    );
  }
}
