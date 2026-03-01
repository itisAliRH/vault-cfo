"use client";

import { Suspense, use, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { SimliAvatar } from "@/components/meeting/SimliAvatar";
import {
  MeetingTranscript,
  type TranscriptEntry,
} from "@/components/meeting/MeetingTranscript";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { SIMLI_FACE_IDS, SIMLI_FACE_LABELS } from "@/lib/simli";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

type FaceChoice = keyof typeof SIMLI_FACE_IDS;
const FACE_OPTIONS: FaceChoice[] = ["tina", "hank"];

const FACE_DETAILS: Record<FaceChoice, { title: string; role: string; description: string; specialty: string[] }> = {
  tina: {
    title: "Tina",
    role: "Personal Finance Advisor",
    description: "Warm and approachable. Specialises in budgeting, savings goals, and everyday money management.",
    specialty: ["Budgeting", "Savings", "Debt reduction"],
  },
  hank: {
    title: "Hank",
    role: "Investment & Tax Consultant",
    description: "Direct and analytical. Focuses on investments, tax optimisation, and long-term wealth building.",
    specialty: ["Investments", "Tax planning", "Wealth strategy"],
  },
};

type PageProps = { params: Promise<{ id: string }> };

export default function AgentMeetingSessionPage({ params }: PageProps) {
  return (
    <Suspense>
      <AgentMeetingSessionInner params={params} />
    </Suspense>
  );
}

function AgentMeetingSessionInner({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const autoStart = searchParams.get("auto") === "1";
  // "pending" = API keys missing, null = loading, string = valid session token
  const [sessionStatus, setSessionStatus] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [faceChoice, setFaceChoice] = useState<FaceChoice>("tina");
  // The actual ElevenLabs agent ID for the selected face
  const [liveAgentId, setLiveAgentId] = useState<string | null>(null);
  const [envCheck, setEnvCheck] = useState<{
    ELEVENLABS_API_KEY: boolean;
    SIMLI_API_KEY: boolean;
  } | null>(null);
  const startRef = useRef<(() => void) | null>(null);

  // Load session (validity check + saved transcript)
  useEffect(() => {
    if (!id) return;
    fetch(`/api/agent-meeting/sessions/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Session not found");
        return r.json();
      })
      .then((data: { agent_id?: string; transcript?: string | null }) => {
        setSessionStatus(data.agent_id ?? "pending");
        // Restore previous transcript when resuming
        if (data.transcript) {
          try {
            const parsed = JSON.parse(data.transcript) as TranscriptEntry[];
            if (Array.isArray(parsed) && parsed.length > 0) setTranscript(parsed);
          } catch { /* ignore */ }
        }
        setSessionError(null);
      })
      .catch(() => setSessionError("Session not found"));
  }, [id]);

  // Fetch the face-specific ElevenLabs agent whenever face changes (or session loads)
  useEffect(() => {
    if (!sessionStatus || sessionStatus === "pending") return;
    setLiveAgentId(null);
    fetch(`/api/agent-meeting/agent?face=${faceChoice}`, { method: "POST" })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((data: { agent_id?: string }) => setLiveAgentId(data.agent_id ?? null))
      .catch(() => setLiveAgentId(null));
  }, [faceChoice, sessionStatus]);

  useEffect(() => {
    if (sessionStatus !== "pending") return;
    fetch("/api/agent-meeting/env-check")
      .then((r) => r.ok ? r.json() : null)
      .then(setEnvCheck)
      .catch(() => setEnvCheck(null));
  }, [sessionStatus]);

  const handleTranscript = useCallback((entries: TranscriptEntry[]) => {
    setTranscript(entries);
  }, []);

  const handleStatusChange = useCallback((s: ConnectionStatus) => {
    setStatus(s);
    if (s === "connected") setStartedAt((t) => (t == null ? Date.now() : t));
  }, []);

  const handleEnd = useCallback(async () => {
    if (!id) return;
    const endedAt = new Date().toISOString();
    const durationSeconds =
      startedAt != null ? Math.round((Date.now() - startedAt) / 1000) : null;
    try {
      await fetch(`/api/agent-meeting/sessions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "ended",
          ended_at: endedAt,
          duration_seconds: durationSeconds,
          transcript:
            transcript.length > 0
              ? JSON.stringify(
                  transcript.map((e) => ({ role: e.role, text: e.text }))
                )
              : null,
        }),
      });
    } catch {
      // best-effort save
    }
    router.push("/agent-meeting");
  }, [id, startedAt, transcript, router]);

  if (!id || sessionError) {
    return (
      <div className="container max-w-4xl mx-auto px-6 py-12 text-center">
        <p className="text-muted-foreground mb-4">
          {sessionError ?? "Invalid session"}
        </p>
        <Button asChild variant="outline" className="font-pixel">
          <Link href="/agent-meeting">Back to meetings</Link>
        </Button>
      </div>
    );
  }

  if (!sessionStatus) {
    return (
      <div className="container max-w-4xl mx-auto px-6 py-8 space-y-6">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="aspect-video max-w-2xl mx-auto rounded-xl" />
        <div className="flex gap-3 max-w-2xl mx-auto">
          <Skeleton className="flex-1 h-28 rounded-xl" />
          <Skeleton className="flex-1 h-28 rounded-xl" />
        </div>
      </div>
    );
  }

  if (sessionStatus === "pending") {
    return (
      <div className="container max-w-4xl mx-auto px-6 py-12 space-y-6">
        <Button variant="ghost" size="sm" asChild className="font-pixel gap-1">
          <Link href="/agent-meeting">
            <ArrowLeft className="size-4" aria-hidden />
            Back
          </Link>
        </Button>
        <div className="rounded-xl border border-border bg-card p-6 text-center space-y-4">
          <h2 className="font-pixel text-lg font-medium">
            Voice meeting requires API keys
          </h2>
          {envCheck && (
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {!envCheck.ELEVENLABS_API_KEY && (
                <>Server: <code className="rounded bg-muted px-1">ELEVENLABS_API_KEY</code> is not set.</>
              )}
              {!envCheck.ELEVENLABS_API_KEY && !envCheck.SIMLI_API_KEY && " "}
              {!envCheck.SIMLI_API_KEY && (
                <>Server: <code className="rounded bg-muted px-1">SIMLI_API_KEY</code> is not set.</>
              )}
              {envCheck.ELEVENLABS_API_KEY && envCheck.SIMLI_API_KEY && (
                <>Keys are set on the server. Restart the dev server if you just added them, then start a new meeting.</>
              )}
            </p>
          )}
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Add the missing variable(s) to <code className="rounded bg-muted px-1">vaultcfo/.env.local</code> (exact names above).{" "}
            <strong>Restart the dev server</strong> after saving — Next.js only reads env at startup. Then start a new meeting from Agent Meeting.
          </p>
          <Button asChild variant="outline" className="font-pixel">
            <Link href="/agent-meeting">Back to meetings</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-6 py-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Button variant="ghost" size="sm" asChild className="font-pixel gap-1">
          <Link href="/agent-meeting">
            <ArrowLeft className="size-4" aria-hidden />
            Back
          </Link>
        </Button>
        <span
          className="text-xs font-pixel text-muted-foreground"
          aria-live="polite"
        >
          {status === "connecting" && "Connecting…"}
          {status === "connected" && "Live"}
          {status === "disconnected" && "Disconnected"}
          {status === "error" && "Error"}
        </span>
      </div>

      {status === "disconnected" && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <p className="font-pixel text-xs text-muted-foreground">
            Choose your consultant
          </p>
          <div className="grid grid-cols-2 gap-3">
            {FACE_OPTIONS.map((key) => {
              const details = FACE_DETAILS[key];
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFaceChoice(key)}
                  className={cn(
                    "rounded-xl border-2 p-4 text-left transition-colors",
                    faceChoice === key
                      ? "border-orange-500 bg-orange-500/10"
                      : "border-border bg-muted/30 hover:bg-muted/60"
                  )}
                  aria-pressed={faceChoice === key}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={cn(
                      "size-10 rounded-full flex items-center justify-center font-pixel text-lg font-bold border-2",
                      faceChoice === key ? "border-orange-500 bg-orange-500/20 text-orange-600" : "border-border bg-muted text-muted-foreground"
                    )}>
                      {details.title[0]}
                    </div>
                    <div>
                      <p className="font-pixel text-sm font-semibold">{details.title}</p>
                      <p className="text-xs text-muted-foreground">{details.role}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-2">{details.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {details.specialty.map((s) => (
                      <span key={s} className="rounded-full border border-border bg-muted/50 px-2 py-0.5 font-pixel text-[9px] text-muted-foreground">
                        {s}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {liveAgentId ? (
        <SimliAvatar
          agentId={liveAgentId}
          faceId={SIMLI_FACE_IDS[faceChoice]}
          onTranscript={handleTranscript}
          onStatusChange={handleStatusChange}
          onEnd={handleEnd}
          autoStart={autoStart}
          onStartReady={(fn) => { startRef.current = fn; }}
        />
      ) : (
        <div className="space-y-3">
          <Skeleton className="aspect-video max-w-2xl mx-auto rounded-xl" />
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="font-pixel text-xs">Preparing {FACE_DETAILS[faceChoice].title}…</span>
          </div>
        </div>
      )}

      <div>
        <h2 className="font-pixel text-sm text-muted-foreground mb-2">
          Transcript
        </h2>
        <MeetingTranscript
          entries={transcript}
          className="h-[200px] max-h-[40vh]"
        />
      </div>
    </div>
  );
}
