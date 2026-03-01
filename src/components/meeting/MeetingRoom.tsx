"use client";

import React, { useEffect, useState } from "react";
import { MeetingToolbar } from "@/components/meeting/MeetingToolbar";
import { MeetingTranscript, type TranscriptEntry } from "@/components/meeting/MeetingTranscript";
import { UserCamera } from "@/components/meeting/UserCamera";
import { cn } from "@/lib/utils";

export type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

export interface MeetingRoomProps {
  /** Main video area (e.g. SimliAvatar) */
  children: React.ReactNode;
  /** Consultant display name */
  consultantName: string;
  /** Connection status for status bar */
  connectionStatus: ConnectionStatus;
  /** Elapsed seconds to show in timer */
  durationSeconds: number;
  /** Transcript entries for the side panel */
  transcriptEntries: TranscriptEntry[];
  /** Whether transcript panel is open */
  transcriptOpen: boolean;
  onTranscriptToggle: () => void;
  /** Mic muted state */
  micMuted: boolean;
  onMicToggle: () => void;
  /** User camera on + stream for PiP */
  cameraOn: boolean;
  userCameraStream: MediaStream | null;
  onCameraToggle: () => void;
  /** Meeting is live (show pause button) */
  isLive: boolean;
  onPause: () => void;
  onEnd: () => void;
  onDownloadTranscript?: () => void;
  onDownloadChat?: () => void;
  className?: string;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function statusLabel(status: ConnectionStatus): string {
  switch (status) {
    case "connecting":
      return "Connecting…";
    case "connected":
      return "Live";
    case "disconnected":
      return "Disconnected";
    case "error":
      return "Error";
    default:
      return "—";
  }
}

export function MeetingRoom({
  children,
  consultantName,
  connectionStatus,
  durationSeconds,
  transcriptEntries,
  transcriptOpen,
  onTranscriptToggle,
  micMuted,
  onMicToggle,
  cameraOn,
  userCameraStream,
  onCameraToggle,
  isLive,
  onPause,
  onEnd,
  onDownloadTranscript,
  onDownloadChat,
  className,
}: MeetingRoomProps) {
  const [localTime, setLocalTime] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setLocalTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className={cn("flex flex-col h-full min-h-[500px]", className)}>
      {/* Top status bar */}
      <div className="flex items-center justify-between gap-2 rounded-t-xl border border-b-0 border-border bg-card/80 px-4 py-2">
        <span className="font-pixel text-xs text-muted-foreground">
          {consultantName}
        </span>
        <div className="flex items-center gap-3">
          <span
            className="font-mono text-xs text-muted-foreground tabular-nums"
            aria-live="polite"
            title="Local time"
          >
            {localTime.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </span>
          <span
            className="font-mono text-xs text-muted-foreground tabular-nums"
            aria-live="polite"
            title="Meeting duration"
          >
            {formatDuration(durationSeconds)}
          </span>
          <span
            className={cn(
              "font-pixel text-[10px] rounded-full px-2 py-0.5",
              connectionStatus === "connected" && "bg-green-500/20 text-green-700 dark:text-green-400",
              connectionStatus === "connecting" && "bg-amber-500/20 text-amber-700 dark:text-amber-400",
              connectionStatus === "error" && "bg-destructive/20 text-destructive",
              connectionStatus === "disconnected" && "bg-muted text-muted-foreground"
            )}
          >
            {statusLabel(connectionStatus)}
          </span>
        </div>
      </div>

      {/* Main area: video + optional transcript panel */}
      <div className="flex flex-1 min-h-0 rounded-b-xl border border-border bg-card overflow-hidden">
        <div className="flex-1 min-w-0 relative flex flex-col">
          <div className="relative flex-1 min-h-0 bg-muted flex items-center justify-center">
            {children}
            {cameraOn && <UserCamera stream={userCameraStream} />}
          </div>
          <div className="p-2 border-t border-border">
            <MeetingToolbar
              isLive={isLive}
              micMuted={micMuted}
              onMicToggle={onMicToggle}
              cameraOn={cameraOn}
              onCameraToggle={onCameraToggle}
              onPause={onPause}
              onEnd={onEnd}
              transcriptOpen={transcriptOpen}
              onTranscriptToggle={onTranscriptToggle}
              onDownloadTranscript={onDownloadTranscript}
              onDownloadChat={onDownloadChat}
            />
          </div>
        </div>

        {/* Transcript side panel */}
        <div
          className={cn(
            "border-l border-border bg-card flex flex-col transition-[width] duration-200 ease-out overflow-hidden",
            transcriptOpen ? "w-full sm:w-80 md:w-96" : "w-0"
          )}
        >
          {transcriptOpen && (
            <div className="p-2 flex-1 min-h-0 flex flex-col">
              <h3 className="font-pixel text-xs text-muted-foreground mb-2 px-1">
                Transcript
              </h3>
              <MeetingTranscript
                entries={transcriptEntries}
                className="flex-1 min-h-0 h-[200px]"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
