"use client";

import { Suspense, use, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { SimliAvatar } from "@/components/meeting/SimliAvatar";
import { MeetingSetup } from "@/components/meeting/MeetingSetup";
import { MeetingRoom, type ConnectionStatus } from "@/components/meeting/MeetingRoom";
import { MeetingSummary } from "@/components/meeting/MeetingSummary";
import { CameraPromptDialog } from "@/components/meeting/CameraPromptDialog";
import { PausedOverlay } from "@/components/meeting/PausedOverlay";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { SIMLI_FACE_IDS } from "@/lib/simli";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { exportAsText, exportAsJSON, downloadBlob } from "@/lib/transcript-export";
import type { TranscriptEntry } from "@/types/meeting";
import type { SharingConfig } from "@/types/meeting";

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

interface SessionData {
  title: string;
  status: string;
  agent_id: string;
  transcript: string | null;
  created_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
}

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

  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [accumulatedDurationSeconds, setAccumulatedDurationSeconds] = useState(0);
  const [faceChoice, setFaceChoice] = useState<FaceChoice>("tina");
  const [liveAgentId, setLiveAgentId] = useState<string | null>(null);
  const [envCheck, setEnvCheck] = useState<{ ELEVENLABS_API_KEY: boolean; SIMLI_API_KEY: boolean } | null>(null);

  const [setupComplete, setSetupComplete] = useState(false);
  const [sharingConfig, setSharingConfig] = useState<SharingConfig>({});
  const [contextForAgent, setContextForAgent] = useState<string>("");
  const [showCameraPrompt, setShowCameraPrompt] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [userCameraStream, setUserCameraStream] = useState<MediaStream | null>(null);
  const [meetingStarted, setMeetingStarted] = useState(false);
  const [meetingEnded, setMeetingEnded] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [micMuted, setMicMuted] = useState(false);

  const [finalSummary, setFinalSummary] = useState<{
    title: string;
    consultantName: string;
    durationSeconds: number;
    endedAt: string;
    transcript: TranscriptEntry[];
  } | null>(null);

  const startRef = useRef<(() => void) | null>(null);
  const pauseRef = useRef<(() => void) | null>(null);

  const sessionStatus = sessionData?.agent_id ?? null;
  const isPending = sessionStatus === "pending";

  useEffect(() => {
    if (!id) return;
    fetch(`/api/agent-meeting/sessions/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Session not found");
        return r.json();
      })
      .then((data: SessionData) => {
        setSessionData(data);
        if (data.transcript) {
          try {
            const parsed = JSON.parse(data.transcript) as TranscriptEntry[];
            if (Array.isArray(parsed) && parsed.length > 0) setTranscript(parsed);
          } catch { /* ignore */ }
        }
        if (data.duration_seconds != null) setAccumulatedDurationSeconds(data.duration_seconds);
        if (data.status === "paused") {
          setIsPaused(true);
          setSetupComplete(true);
          setMeetingStarted(true);
        }
        if (data.status === "ended" && data.ended_at) {
          let summaryTranscript: TranscriptEntry[] = [];
          if (data.transcript) {
            try {
              const parsed = JSON.parse(data.transcript) as TranscriptEntry[];
              if (Array.isArray(parsed)) summaryTranscript = parsed;
            } catch { /* ignore */ }
          }
          setFinalSummary({
            title: data.title,
            consultantName: "Consultant",
            durationSeconds: data.duration_seconds ?? 0,
            endedAt: data.ended_at,
            transcript: summaryTranscript,
          });
          setMeetingEnded(true);
        }
        setSessionError(null);
      })
      .catch(() => setSessionError("Session not found"));
  }, [id]);

  useEffect(() => {
    if (!sessionStatus || sessionStatus === "pending") return;
    setLiveAgentId(null);
    fetch(`/api/agent-meeting/agent?face=${faceChoice}`, { method: "POST" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: { agent_id?: string }) => setLiveAgentId(data.agent_id ?? null))
      .catch(() => setLiveAgentId(null));
  }, [faceChoice, sessionStatus]);

  useEffect(() => {
    if (sessionStatus !== "pending") return;
    fetch("/api/agent-meeting/env-check")
      .then((r) => (r.ok ? r.json() : null))
      .then(setEnvCheck)
      .catch(() => setEnvCheck(null));
  }, [sessionStatus]);

  const handleSetupComplete = useCallback(
    async (config: SharingConfig) => {
      setSharingConfig(config);
      setSetupComplete(true);
      if (Object.keys(config).length > 0) {
        const res = await fetch("/api/agent-meeting/shareable-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(config),
        });
        if (res.ok) {
          const data = (await res.json()) as { contextForAgent?: string };
          setContextForAgent(data.contextForAgent ?? "");
        }
      }
      setShowCameraPrompt(true);
    },
    []
  );

  const handleCameraConfirm = useCallback(
    (cameraOnChoice: boolean, stream: MediaStream | null) => {
      setShowCameraPrompt(false);
      setCameraOn(!!cameraOnChoice);
      setUserCameraStream(stream);
      setMeetingStarted(true);
      setTimeout(() => startRef.current?.(), 0);
    },
    []
  );

  const handleCameraConfirmInMeeting = useCallback(
    (cameraOnChoice: boolean, stream: MediaStream | null) => {
      setShowCameraPrompt(false);
      setCameraOn(!!cameraOnChoice);
      setUserCameraStream(stream);
    },
    []
  );

  const handleTranscript = useCallback((entries: TranscriptEntry[]) => {
    setTranscript(entries);
  }, []);

  const handleStatusChange = useCallback((s: ConnectionStatus) => {
    setStatus(s);
    if (s === "connected") setStartedAt((t) => (t == null ? Date.now() : t));
  }, []);

  const savePauseOrEnd = useCallback(
    async (newStatus: "paused" | "ended") => {
      if (!id) return;
      const segmentSeconds = startedAt != null ? Math.round((Date.now() - startedAt) / 1000) : 0;
      const totalDuration = accumulatedDurationSeconds + segmentSeconds;
      const payload: Record<string, unknown> = {
        status: newStatus,
        duration_seconds: totalDuration,
        transcript:
          transcript.length > 0
            ? JSON.stringify(transcript.map((e) => ({ role: e.role, text: e.text, ...(e.timestamp != null && { timestamp: e.timestamp }) })))
            : null,
      };
      if (newStatus === "ended") {
        payload.ended_at = new Date().toISOString();
      }
      try {
        await fetch(`/api/agent-meeting/sessions/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch { /* ignore */ }
      setAccumulatedDurationSeconds(totalDuration);
      setStartedAt(null);
      return totalDuration;
    },
    [id, startedAt, accumulatedDurationSeconds, transcript]
  );

  const handleEnd = useCallback(async () => {
    if (!id || !sessionData) return;
    const totalDuration = await savePauseOrEnd("ended");
    const endedAt = new Date().toISOString();
    pauseRef.current?.();
    setMeetingEnded(true);
    const segmentSeconds = startedAt != null ? Math.round((Date.now() - startedAt) / 1000) : 0;
    setFinalSummary({
      title: sessionData.title,
      consultantName: FACE_DETAILS[faceChoice].title,
      durationSeconds: totalDuration ?? accumulatedDurationSeconds + segmentSeconds,
      endedAt,
      transcript: [...transcript],
    });
  }, [id, sessionData, faceChoice, transcript, savePauseOrEnd, startedAt, accumulatedDurationSeconds]);

  const handlePause = useCallback(async () => {
    await savePauseOrEnd("paused");
    pauseRef.current?.();
    setIsPaused(true);
  }, [savePauseOrEnd]);

  const handleResume = useCallback(() => {
    setIsPaused(false);
    setTimeout(() => startRef.current?.(), 0);
  }, []);

  const handleBackToMeetings = useCallback(() => {
    router.push("/agent-meeting");
  }, [router]);

  const durationSeconds =
    accumulatedDurationSeconds +
    (startedAt != null ? Math.round((Date.now() - startedAt) / 1000) : 0);

  const handleDownloadTranscript = useCallback(() => {
    const title = sessionData?.title ?? "Meeting";
    const text = exportAsText(transcript, title);
    const filename = `meeting-transcript-${title.replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.txt`;
    downloadBlob(text, filename, "text/plain;charset=utf-8");
  }, [transcript, sessionData?.title]);

  const handleDownloadChat = useCallback(() => {
    const json = exportAsJSON(transcript);
    const title = sessionData?.title ?? "Meeting";
    const filename = `meeting-chat-${title.replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.json`;
    downloadBlob(json, filename, "application/json");
  }, [transcript, sessionData?.title]);

  if (!id || sessionError) {
    return (
      <div className="container max-w-4xl mx-auto px-6 py-12 text-center">
        <p className="text-muted-foreground mb-4">{sessionError ?? "Invalid session"}</p>
        <Button asChild variant="outline" className="font-pixel">
          <Link href="/agent-meeting">Back to meetings</Link>
        </Button>
      </div>
    );
  }

  if (!sessionData) {
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

  if (isPending) {
    return (
      <div className="container max-w-4xl mx-auto px-6 py-12 space-y-6">
        <Button variant="ghost" size="sm" asChild className="font-pixel gap-1">
          <Link href="/agent-meeting">
            <ArrowLeft className="size-4" aria-hidden />
            Back
          </Link>
        </Button>
        <div className="rounded-xl border border-border bg-card p-6 text-center space-y-4">
          <h2 className="font-pixel text-lg font-medium">Voice meeting requires API keys</h2>
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
                <>Keys are set on the server. Restart the dev server if you just added them.</>
              )}
            </p>
          )}
          <Button asChild variant="outline" className="font-pixel">
            <Link href="/agent-meeting">Back to meetings</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (meetingEnded && finalSummary) {
    return (
      <div className="container max-w-4xl mx-auto px-6 py-6">
        <MeetingSummary
          meetingTitle={finalSummary.title}
          consultantName={finalSummary.consultantName}
          durationSeconds={finalSummary.durationSeconds}
          endedAt={finalSummary.endedAt}
          transcript={finalSummary.transcript}
          onBackToMeetings={handleBackToMeetings}
        />
      </div>
    );
  }

  if (!setupComplete && status === "disconnected" && !isPaused) {
    return (
      <div className="container max-w-80% mx-auto px-6 py-6 space-y-6">
        <Button variant="ghost" size="sm" asChild className="font-pixel gap-1">
          <Link href="/agent-meeting">
            <ArrowLeft className="size-4" aria-hidden />
            Back
          </Link>
        </Button>
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <p className="font-pixel text-xs text-muted-foreground">Choose your consultant</p>
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
                    <div
                      className={cn(
                        "size-10 rounded-full flex items-center justify-center font-pixel text-lg font-bold border-2",
                        faceChoice === key
                          ? "border-orange-500 bg-orange-500/20 text-orange-600"
                          : "border-border bg-muted text-muted-foreground"
                      )}
                    >
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
                      <span
                        key={s}
                        className="rounded-full border border-border bg-muted/50 px-2 py-0.5 font-pixel text-[9px] text-muted-foreground"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        <MeetingSetup onComplete={handleSetupComplete} />
        <CameraPromptDialog open={showCameraPrompt} onConfirm={handleCameraConfirm} />
      </div>
    );
  }

  if (!liveAgentId) {
    return (
      <div className="container max-w-4xl mx-auto px-6 py-6 space-y-3">
        <Skeleton className="aspect-video max-w-2xl mx-auto rounded-xl" />
        <div className="flex justify-center gap-2 text-sm text-muted-foreground">
          <span className="font-pixel text-xs">Preparing {FACE_DETAILS[faceChoice].title}…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-80% mx-auto px-6 py-6 space-y-6 h-90%">
      <Button variant="ghost" size="sm" asChild className="font-pixel gap-1">
        <Link href="/agent-meeting">
          <ArrowLeft className="size-4" aria-hidden />
          Back
        </Link>
      </Button>
      <MeetingRoom
        consultantName={FACE_DETAILS[faceChoice].title}
        connectionStatus={status}
        durationSeconds={durationSeconds}
        transcriptEntries={transcript}
        transcriptOpen={transcriptOpen}
        onTranscriptToggle={() => setTranscriptOpen((o) => !o)}
        micMuted={micMuted}
        onMicToggle={() => setMicMuted((m) => !m)}
        cameraOn={cameraOn}
        userCameraStream={userCameraStream}
        onCameraToggle={() => {
          if (userCameraStream) {
            userCameraStream.getTracks().forEach((t) => t.stop());
            setUserCameraStream(null);
            setCameraOn(false);
          } else {
            setShowCameraPrompt(true);
          }
        }}
        isLive={status === "connected"}
        onPause={handlePause}
        onEnd={handleEnd}
        onDownloadTranscript={handleDownloadTranscript}
        onDownloadChat={handleDownloadChat}
      >
        <div className="relative w-full aspect-video max-w-2xl mx-auto rounded-xl overflow-hidden bg-muted border border-border">
          <SimliAvatar
            agentId={liveAgentId}
            faceId={SIMLI_FACE_IDS[faceChoice]}
            onTranscript={handleTranscript}
            onStatusChange={handleStatusChange}
            onEnd={handleEnd}
            onPause={() => setIsPaused(true)}
            micMuted={micMuted}
            initialContextForAgent={contextForAgent || undefined}
            cameraOn={cameraOn}
            hideControls
            onStartReady={(fns) => {
              startRef.current = fns?.start ?? null;
              pauseRef.current = fns?.pause ?? null;
            }}
            className="w-full h-full"
          />
          {isPaused && <PausedOverlay onResume={handleResume} />}
        </div>
      </MeetingRoom>
      <CameraPromptDialog
        open={showCameraPrompt}
        onConfirm={meetingStarted ? handleCameraConfirmInMeeting : handleCameraConfirm}
      />
    </div>
  );
}
