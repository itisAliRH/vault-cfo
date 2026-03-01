"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Video, VideoOff } from "lucide-react";

export interface CameraPromptDialogProps {
  open: boolean;
  onConfirm: (cameraOn: boolean, stream: MediaStream | null) => void;
}

export function CameraPromptDialog({ open, onConfirm }: CameraPromptDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleYes = async () => {
    setLoading(true);
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false,
      });
      onConfirm(true, stream);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not access camera");
    } finally {
      setLoading(false);
    }
  };

  const handleNo = () => {
    onConfirm(false, null);
  };

  return (
    <Dialog open={open}>
      <DialogContent
        className="sm:max-w-md font-pixel overflow-hidden min-w-0 max-w-[calc(100vw-2rem)]"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="min-w-0 pr-6">
          <DialogTitle className="text-base break-words">
            Turn on your camera?
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground break-words min-w-0">
            Your video is only for you — we never share it with the consultant. It can help you feel more present during the meeting.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-4">
          <Button
            variant="ghost"
            onClick={handleNo}
            disabled={loading}
            className="font-pixel gap-2 order-2 sm:order-1"
          >
            <VideoOff className="size-4 shrink-0" aria-hidden />
            No thanks
          </Button>
          <Button
            onClick={handleYes}
            disabled={loading}
            className="font-pixel gap-2 bg-orange-500 hover:bg-orange-600 text-white order-1 sm:order-2"
          >
            <Video className="size-4 shrink-0" aria-hidden />
            {loading ? "Opening…" : "Yes, turn on camera"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
