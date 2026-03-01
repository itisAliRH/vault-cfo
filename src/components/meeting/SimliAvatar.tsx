"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SimliClient, LogLevel } from "simli-client";
import type { TranscriptEntry } from "@/types/meeting";

type ElevenLabsWSEvent =
  | { type: "user_transcript"; user_transcription_event: { user_transcript: string } }
  | { type: "agent_response"; agent_response_event: { agent_response: string } }
  | { type: "audio"; audio_event: { audio_base_64: string; event_id: number } }
  | { type: "interruption"; interruption_event: { reason: string } }
  | { type: "ping"; ping_event: { event_id: number; ping_ms?: number } };

export interface SimliAvatarProps {
  /** Agent ID for ElevenLabs (used to fetch signed URL if signedUrl not provided) */
  agentId: string;
  /** Simli face ID (e.g. Tina or Hank). Required if server does not set SIMLI_FACE_ID. */
  faceId?: string;
  /** If true, starts the meeting immediately on mount (resume flow). */
  autoStart?: boolean;
  /** Called with { start, pause } once the component is ready, for external triggering. */
  onStartReady?: (fns: { start: () => void; pause: () => void }) => void;
  onTranscript?: (entries: TranscriptEntry[]) => void;
  onStatusChange?: (status: "connecting" | "connected" | "disconnected" | "error") => void;
  onEnd?: () => void;
  /** Called when meeting is paused (disconnected without ending). */
  onPause?: () => void;
  /** When true, do not send microphone audio to the agent. */
  micMuted?: boolean;
  /** Context string for the agent (e.g. shared vault data). */
  initialContextForAgent?: string;
  /** When true, agent should greet with "Nice to see you!" */
  cameraOn?: boolean;
  /** When true, do not render start/end buttons (parent provides controls). */
  hideControls?: boolean;
  className?: string;
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function float32ToBase64PCM(float32Array: Float32Array): string {
  const pcmArray = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const clamped = Math.max(-1, Math.min(1, float32Array[i]));
    pcmArray[i] = Math.floor(clamped * 32767);
  }
  const uint8Array = new Uint8Array(pcmArray.buffer);
  let binaryString = "";
  const chunkSize = 8192;
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.subarray(i, i + chunkSize);
    binaryString += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binaryString);
}

export function SimliAvatar({
  agentId,
  faceId: faceIdProp,
  autoStart,
  onStartReady,
  onTranscript,
  onStatusChange,
  onEnd,
  onPause,
  micMuted = false,
  initialContextForAgent,
  cameraOn = false,
  hideControls = false,
  className,
}: SimliAvatarProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const simliRef = useRef<SimliClient | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const transcriptRef = useRef<TranscriptEntry[]>([]);
  const micMutedRef = useRef(micMuted);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  micMutedRef.current = micMuted;

  const reportTranscript = useCallback(() => {
    if (onTranscript && transcriptRef.current.length > 0) {
      onTranscript([...transcriptRef.current]);
    }
  }, [onTranscript]);

  const stopVoiceStream = useCallback(() => {
    if (processorRef.current) {
      try {
        processorRef.current.disconnect();
      } catch {
        // ignore
      }
      processorRef.current.onaudioprocess = null;
      processorRef.current = null;
    }
    if (sourceRef.current) {
      try {
        sourceRef.current.disconnect();
      } catch {
        // ignore
      }
      sourceRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const connectElevenLabs = useCallback(
    async (
      signedUrl: string,
      initPayload?: { contextForAgent?: string; cameraOn?: boolean }
    ) => {
      return new Promise<WebSocket>((resolve, reject) => {
        const ws = new WebSocket(signedUrl);
        wsRef.current = ws;

        ws.onopen = async () => {
          const extra: Record<string, unknown> = {};
          if (initPayload?.contextForAgent) {
            extra.user_context = initPayload.contextForAgent;
          }
          if (initPayload?.cameraOn) {
            extra.camera_greeting =
              "Start your first message with: Nice to see you! Welcome to VaultCFO. How can I help you today?";
          }
          ws.send(
            JSON.stringify({
              type: "conversation_initiation_client_data",
              conversation_initiation_client_data: {
                custom_llm_extra_body: extra,
              },
            })
          );

          try {
            const stream = await navigator.mediaDevices.getUserMedia({
              audio: {
                sampleRate: 16000,
                channelCount: 1,
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
              },
            });
            streamRef.current = stream;
            const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)({
              sampleRate: 16000,
            });
            audioContextRef.current = audioContext;
            const source = audioContext.createMediaStreamSource(stream);
            sourceRef.current = source;
            const bufferSize = 4096;
            const processor = audioContext.createScriptProcessor(bufferSize, 1, 1);
            processorRef.current = processor;
            let processing = false;
            processor.onaudioprocess = (event: AudioProcessingEvent) => {
              if (processing || ws.readyState !== WebSocket.OPEN || micMutedRef.current) return;
              processing = true;
              try {
                const inputData = event.inputBuffer.getChannelData(0);
                const hasAudio = inputData.some((s) => Math.abs(s) > 0.01);
                if (hasAudio) {
                  ws.send(
                    JSON.stringify({
                      user_audio_chunk: float32ToBase64PCM(inputData),
                    })
                  );
                }
              } finally {
                processing = false;
              }
            };
            source.connect(processor);
            processor.connect(audioContext.destination);
          } catch (err) {
            setError("Microphone access denied");
            onStatusChange?.("error");
            reject(err);
            return;
          }

          setIsLive(true);
          onStatusChange?.("connected");
          resolve(ws);
        };

        ws.onmessage = (event: MessageEvent) => {
          try {
            const data = JSON.parse(event.data as string) as ElevenLabsWSEvent;
            if (data.type === "ping") {
              const pingMs = data.ping_event?.ping_ms ?? 0;
              setTimeout(() => {
                if (ws.readyState === WebSocket.OPEN) {
                  ws.send(
                    JSON.stringify({
                      type: "pong",
                      event_id: data.ping_event.event_id,
                    })
                  );
                }
              }, pingMs);
            }
            if (data.type === "user_transcript") {
              const text = data.user_transcription_event?.user_transcript?.trim();
              if (text) {
                transcriptRef.current.push({
                  role: "user",
                  text,
                  timestamp: Date.now(),
                });
                reportTranscript();
              }
            }
            if (data.type === "agent_response") {
              const text = data.agent_response_event?.agent_response?.trim();
              if (text) {
                transcriptRef.current.push({
                  role: "agent",
                  text,
                  timestamp: Date.now(),
                });
                reportTranscript();
              }
            }
            if (data.type === "audio") {
              const b64 = data.audio_event?.audio_base_64;
              if (b64 && simliRef.current) {
                simliRef.current.sendAudioData(base64ToUint8Array(b64));
              }
            }
          } catch {
            // ignore parse errors
          }
        };

        ws.onerror = () => reject(new Error("WebSocket error"));
        ws.onclose = () => {
          wsRef.current = null;
          setIsLive(false);
          stopVoiceStream();
          onStatusChange?.("disconnected");
        };
      });
    },
    [onStatusChange, reportTranscript, stopVoiceStream]
  );

  const handleStart = useCallback(async () => {
    if (!videoRef.current || !audioRef.current) return;
    setError(null);
    onStatusChange?.("connecting");

    try {
      const tokenUrl =
        faceIdProp != null
          ? `/api/agent-meeting/simli-token?face_id=${encodeURIComponent(faceIdProp)}`
          : "/api/agent-meeting/simli-token";
      const [tokenRes, signedRes] = await Promise.all([
        fetch(tokenUrl),
        fetch(`/api/agent-meeting/signed-url?agent_id=${encodeURIComponent(agentId)}`).then((r) => r.json()),
      ]);

      if (!tokenRes.ok) {
        const err = await tokenRes.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Simli token failed");
      }
      const tokenData = (await tokenRes.json()) as {
        session_token?: string;
        ice_servers?: RTCIceServer[];
      };
      const sessionToken = tokenData?.session_token;
      const iceServers = tokenData?.ice_servers ?? [{ urls: "stun:stun.l.google.com:19302" }];
      if (!sessionToken) throw new Error("No Simli session token");

      const signedUrl = (signedRes as { signed_url?: string }).signed_url;
      if (!signedUrl) throw new Error("No ElevenLabs signed URL");

      const client = new SimliClient(
        sessionToken,
        videoRef.current,
        audioRef.current,
        iceServers,
        LogLevel.ERROR,
        "livekit"
      );
      simliRef.current = client;

      client.on("start", async () => {
        const silence = new Uint8Array(6000).fill(0);
        client.sendAudioData(silence);
        await connectElevenLabs(signedUrl, {
          contextForAgent: initialContextForAgent,
          cameraOn,
        });
      });

      client.on("stop", () => {
        onStatusChange?.("disconnected");
      });
      client.on("error", (detail: string) => {
        setError(detail || "Simli error");
        onStatusChange?.("error");
      });
      client.on("startup_error", (message: string) => {
        setError(message || "Simli startup failed");
        onStatusChange?.("error");
      });

      await client.start();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to start";
      setError(msg);
      onStatusChange?.("error");
    }
  }, [agentId, faceIdProp, connectElevenLabs, onStatusChange, initialContextForAgent, cameraOn]);

  const handleStop = useCallback(() => {
    // Stop voice capture first so no more audio is sent
    stopVoiceStream();
    // Stop SimliClient before closing the WS so it can send its final message
    const simli = simliRef.current;
    simliRef.current = null;
    const ws = wsRef.current;
    wsRef.current = null;
    if (simli) {
      simli.stop().catch(() => {}).finally(() => {
        ws?.close();
      });
    } else {
      ws?.close();
    }
    setIsLive(false);
    onStatusChange?.("disconnected");
    onEnd?.();
  }, [onEnd, onStatusChange, stopVoiceStream]);

  const handlePause = useCallback(() => {
    stopVoiceStream();
    const simli = simliRef.current;
    simliRef.current = null;
    const ws = wsRef.current;
    wsRef.current = null;
    if (simli) {
      simli.stop().catch(() => {}).finally(() => {
        ws?.close();
        onStatusChange?.("disconnected");
        onPause?.();
      });
    } else {
      ws?.close();
      onStatusChange?.("disconnected");
      onPause?.();
    }
    setIsLive(false);
  }, [onPause, onStatusChange, stopVoiceStream]);

  useEffect(() => {
    return () => {
      stopVoiceStream();
      const simli = simliRef.current;
      simliRef.current = null;
      const ws = wsRef.current;
      wsRef.current = null;
      if (simli) {
        simli.stop().catch(() => {}).finally(() => ws?.close());
      } else {
        ws?.close();
      }
    };
  }, [stopVoiceStream]);

  // Expose start and pause for toolbar / resume flow
  useEffect(() => {
    onStartReady?.({ start: handleStart, pause: handlePause });
  }, [handleStart, handlePause, onStartReady]);

  useEffect(() => {
    if (autoStart) handleStart();
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={className}>
      <div className="relative w-full h-full min-h-0 rounded-xl overflow-hidden bg-muted border-0">
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className="w-full h-full object-cover"
          aria-label="Agent avatar"
        />
        <audio ref={audioRef} autoPlay className="hidden" aria-hidden />
        {!hideControls && !isLive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-muted/95">
            <p className="text-sm text-muted-foreground text-center px-4">
              Start the meeting to see your finance consultant.
            </p>
          </div>
        )}
      </div>
      {!hideControls && error && (
        <p className="mt-2 text-sm text-destructive text-center" role="alert">
          {error}
        </p>
      )}
      {!hideControls && (
        <div className="mt-4 flex justify-center gap-2">
          {!isLive ? (
            <button
              type="button"
              onClick={handleStart}
              disabled={!!error}
              className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium font-pixel hover:bg-orange-600 disabled:opacity-50"
            >
              Start meeting
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowEndConfirm(true)}
              className="px-4 py-2 rounded-lg border border-destructive bg-destructive/10 text-destructive text-sm font-medium font-pixel hover:bg-destructive/20"
            >
              End meeting
            </button>
          )}
        </div>
      )}

      {!hideControls && (
        <Dialog open={showEndConfirm} onOpenChange={setShowEndConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-pixel text-sm">End the meeting?</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">The conversation will be saved and you&apos;ll return to the meeting list.</p>
            <div className="flex gap-2 pt-2">
              <Button
                variant="destructive"
                className="font-pixel text-xs"
                onClick={() => { setShowEndConfirm(false); handleStop(); }}
              >
                End meeting
              </Button>
              <Button
                variant="ghost"
                className="font-pixel text-xs"
                onClick={() => setShowEndConfirm(false)}
              >
                Continue
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
