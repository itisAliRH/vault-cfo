"use client";

import React, { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MeetingTranscript, type TranscriptEntry } from "@/components/meeting/MeetingTranscript";
import { exportAsText, exportAsJSON, downloadBlob } from "@/lib/transcript-export";
import { Calendar, Clock, Download, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MeetingSummaryProps {
  meetingTitle: string;
  consultantName: string;
  durationSeconds: number;
  endedAt: string;
  transcript: TranscriptEntry[];
  onBackToMeetings: () => void;
  className?: string;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function MeetingSummary({
  meetingTitle,
  consultantName,
  durationSeconds,
  endedAt,
  transcript,
  onBackToMeetings,
  className,
}: MeetingSummaryProps) {
  const [transcriptExpanded, setTranscriptExpanded] = useState(false);

  const handleDownloadTranscriptTxt = useCallback(() => {
    const text = exportAsText(transcript, meetingTitle);
    const filename = `meeting-transcript-${meetingTitle.replace(/\s+/g, "-")}-${new Date(endedAt).toISOString().slice(0, 10)}.txt`;
    downloadBlob(text, filename, "text/plain;charset=utf-8");
  }, [transcript, meetingTitle, endedAt]);

  const handleDownloadTranscriptJson = useCallback(() => {
    const json = exportAsJSON(transcript);
    const filename = `meeting-transcript-${meetingTitle.replace(/\s+/g, "-")}-${new Date(endedAt).toISOString().slice(0, 10)}.json`;
    downloadBlob(json, filename, "application/json");
  }, [transcript, meetingTitle, endedAt]);

  return (
    <Card className={cn("border border-border", className)}>
      <CardHeader>
        <CardTitle className="font-pixel text-lg">Meeting summary</CardTitle>
        <p className="text-sm text-muted-foreground">
          Your meeting with {consultantName} has ended.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Calendar className="size-4" aria-hidden />
            {formatDate(endedAt)}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="size-4" aria-hidden />
            Duration: {formatDuration(durationSeconds)}
          </span>
        </div>

        <div>
          <button
            type="button"
            onClick={() => setTranscriptExpanded((e) => !e)}
            className="flex items-center justify-between w-full font-pixel text-sm text-left py-2 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <span>Transcript</span>
            {transcriptExpanded ? (
              <ChevronUp className="size-4" aria-hidden />
            ) : (
              <ChevronDown className="size-4" aria-hidden />
            )}
          </button>
          {transcriptExpanded && (
            <div className="mt-2 rounded-lg border border-border overflow-hidden">
              <MeetingTranscript
                entries={transcript}
                className="h-[240px] max-h-[40vh]"
              />
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadTranscriptTxt}
            className="font-pixel gap-1"
          >
            <Download className="size-4" aria-hidden />
            Download transcript (TXT)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadTranscriptJson}
            className="font-pixel gap-1"
          >
            <Download className="size-4" aria-hidden />
            Download transcript (JSON)
          </Button>
          <Button
            onClick={onBackToMeetings}
            className="font-pixel"
          >
            Back to meetings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
