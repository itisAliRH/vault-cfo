"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Mic, MicOff, Video, VideoOff, Pause, PhoneOff, MessageSquare, MoreVertical, Download } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MeetingToolbarProps {
  isLive: boolean;
  micMuted: boolean;
  onMicToggle: () => void;
  cameraOn: boolean;
  onCameraToggle: () => void;
  onPause: () => void;
  onEnd: () => void;
  transcriptOpen: boolean;
  onTranscriptToggle: () => void;
  onDownloadTranscript?: () => void;
  onDownloadChat?: () => void;
  className?: string;
}

export function MeetingToolbar({
  isLive,
  micMuted,
  onMicToggle,
  cameraOn,
  onCameraToggle,
  onPause,
  onEnd,
  transcriptOpen,
  onTranscriptToggle,
  onDownloadTranscript,
  onDownloadChat,
  className,
}: MeetingToolbarProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 rounded-xl border border-border bg-card/95 px-4 py-3 shadow-lg backdrop-blur",
        className
      )}
    >
      <Button
        variant={micMuted ? "destructive" : "outline"}
        size="icon"
        onClick={onMicToggle}
        aria-label={micMuted ? "Unmute microphone" : "Mute microphone"}
        className="font-pixel size-10 rounded-full"
      >
        {micMuted ? <MicOff className="size-5" /> : <Mic className="size-5" />}
      </Button>
      <div className="flex flex-col items-center gap-0.5">
        <Button
          variant={cameraOn ? "outline" : "secondary"}
          size="icon"
          onClick={onCameraToggle}
          aria-label={cameraOn ? "Turn off camera" : "Turn on camera"}
          className="font-pixel size-10 rounded-full"
        >
          {cameraOn ? <Video className="size-5" /> : <VideoOff className="size-5" />}
        </Button>
      </div>
      {isLive && (
        <Button
          variant="outline"
          size="icon"
          onClick={onPause}
          aria-label="Pause meeting"
          className="font-pixel size-10 rounded-full"
        >
          <Pause className="size-5" />
        </Button>
      )}
      <Button
        variant="destructive"
        size="icon"
        onClick={onEnd}
        aria-label="End meeting"
        className="font-pixel size-10 rounded-full"
      >
        <PhoneOff className="size-5" />
      </Button>
      <div className="mx-1 h-6 w-px bg-border" aria-hidden />
      <Button
        variant={transcriptOpen ? "secondary" : "outline"}
        size="icon"
        onClick={onTranscriptToggle}
        aria-label={transcriptOpen ? "Hide transcript" : "Show transcript"}
        aria-pressed={transcriptOpen}
        className="font-pixel size-10 rounded-full"
      >
        <MessageSquare className="size-5" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            aria-label="More options"
            className="font-pixel size-10 rounded-full"
          >
            <MoreVertical className="size-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="font-pixel text-xs">
          {onDownloadTranscript && (
            <DropdownMenuItem onClick={onDownloadTranscript}>
              <Download className="size-4 mr-2" />
              Download transcript
            </DropdownMenuItem>
          )}
          {onDownloadChat && (
            <DropdownMenuItem onClick={onDownloadChat}>
              <Download className="size-4 mr-2" />
              Download chat history
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {cameraOn && (
          <span className="text-[9px] text-muted-foreground text-center max-w-[20rem] leading-tight" role="status">
            Camera is on but not shared with consultant
          </span>
        )}
    </div>
  );
}
