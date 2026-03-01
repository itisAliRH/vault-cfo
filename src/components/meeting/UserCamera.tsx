"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export interface UserCameraProps {
  stream: MediaStream | null;
  muted?: boolean;
  className?: string;
}

export function UserCamera({ stream, muted = true, className }: UserCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream) return;
    video.srcObject = stream;
    return () => {
      video.srcObject = null;
    };
  }, [stream]);

  if (!stream) return null;

  return (
    <div
      className={cn(
        "absolute bottom-4 right-4 z-10 w-32 overflow-hidden rounded-lg border-2 border-border bg-muted shadow-lg md:w-40",
        className
      )}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        className="aspect-video w-full object-cover"
        aria-label="Your camera"
      />
    </div>
  );
}
