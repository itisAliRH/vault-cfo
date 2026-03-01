"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChevronDown,
  ChevronRight,
  Mic,
  Send,
  Plus,
  Lightbulb,
  Wrench,
  Volume2,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ChatEmptyIcon } from "@/components/chat/ChatEmptyIcon";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const SUGGESTED_PROMPTS = [
  "How can I save 200€/month?",
  "Which contracts can I cancel?",
  "Show my top spending categories",
];

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [thinkMode, setThinkMode] = useState(false);
  const [toolTraceOpen, setToolTraceOpen] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [sttError, setSttError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/chat" }),
    []
  );

  const { messages, sendMessage, status, setMessages } = useChat({ transport });
  const { toast } = useToast();
  const isLoading = status === "submitted" || status === "streaming";
  const hasMessages = messages.length > 0;

  // Track whether we've finished restoring history so we don't re-save it
  const restoredRef = useRef(false);
  const prevMessageCount = useRef(0);

  // Restore chat history on mount (run once)
  useEffect(() => {
    fetch("/api/chat/history")
      .then((r) => r.json())
      .then((data: { messages?: { id: string; role: string; content: string }[] }) => {
        if (data.messages && data.messages.length > 0) {
          const restored = data.messages.map((m) => ({
            id: m.id,
            role: m.role as "user" | "assistant",
            content: m.content,
            parts: [{ type: "text" as const, text: m.content }],
          }));
          prevMessageCount.current = restored.length;
          setMessages(restored);
        }
        restoredRef.current = true;
      })
      .catch(() => { restoredRef.current = true; });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist only newly added messages after restore is done
  useEffect(() => {
    if (!restoredRef.current) return;
    if (status !== "ready" && status !== "error") return;
    const newMessages = messages.slice(prevMessageCount.current);
    if (newMessages.length === 0) return;
    prevMessageCount.current = messages.length;
    for (const m of newMessages) {
      if (m.role !== "user" && m.role !== "assistant") continue;
      const content =
        "content" in m && typeof (m as { content: unknown }).content === "string"
          ? (m as { content: string }).content
          : "parts" in m
          ? (m as { parts: { type: string; text?: string }[] }).parts
              .filter((p) => p.type === "text")
              .map((p) => p.text ?? "")
              .join("")
          : "";
      if (!content) continue;
      fetch("/api/chat/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: m.role, content }),
      }).catch(() => {});
    }
  }, [messages, status]);

  const handleSubmit = (e?: { preventDefault?: () => void }) => {
    e?.preventDefault?.();
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    // Pass thinkMode in body so the API route receives it (metadata is not always sent with messages)
    sendMessage({ text }, { body: { thinkMode } });
  };

  const handleTTS = useCallback(async (text: string, msgId: string) => {
    if (playingId === msgId) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }
    setPlayingId(msgId);
    try {
      const res = await fetch("/api/voice/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) {
        setPlayingId(null);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setPlayingId(null);
      audio.play().catch(() => setPlayingId(null));
    } catch {
      setPlayingId(null);
    }
  }, [playingId]);

  const handleVoiceInput = useCallback(async () => {
    if (isLoading) return;
    setSttError(null);

    if (isRecording) {
      const mr = mediaRecorderRef.current;
      if (mr && mr.state !== "inactive") {
        mr.stop();
      }
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm";
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mimeType });
        if (blob.size === 0) {
          setSttError("No audio recorded");
          return;
        }
        try {
          const formData = new FormData();
          formData.append("file", blob, "recording.webm");
          const res = await fetch("/api/voice/stt", { method: "POST", body: formData });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            const msg = (err as { error?: string }).error ?? "Speech recognition failed";
            setSttError(msg);
            if (res.status === 503) {
              toast({ title: "Voice input unavailable", description: "Set ELEVENLABS_API_KEY for STT.", variant: "error" });
            }
            return;
          }
          const { text } = (await res.json()) as { text?: string };
          if (text && text.trim()) {
            setInput(text.trim());
            sendMessage({ text: text.trim() }, { body: { thinkMode } });
          } else {
            setSttError("No speech detected");
          }
        } catch {
          setSttError("Failed to transcribe");
        }
      };
      recorder.start(100);
      setIsRecording(true);
    } catch {
      setSttError("Microphone access denied");
      toast({ title: "Microphone access denied", variant: "error" });
    }
  }, [isRecording, isLoading, thinkMode, sendMessage, toast]);

  const handleClearHistory = async () => {
    await fetch("/api/chat/history", { method: "DELETE" });
    setMessages([]);
    prevMessageCount.current = 0;
  };

  const toolCallsFromMessages = messages.flatMap((m) => {
    if (m.role !== "assistant") return [];
    const parts = "parts" in m ? (m as { parts?: unknown[] }).parts : [];
    return (parts ?? []).filter(
      (p: unknown) =>
        typeof p === "object" && p !== null && "toolName" in p
    );
  });

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col md:flex-row gap-6 p-6 bg-background">
      <div className="flex flex-1 flex-col min-h-0 max-w-4xl w-full mx-auto">
        {!hasMessages ? (
          <div
            className="flex-1 flex flex-col items-center justify-center gap-6 px-4 py-12 min-h-[200px]"
            style={{ background: "var(--chat-empty-bg)" }}
          >
            <div className="rounded-2xl bg-card border border-border p-6 shadow-sm text-muted-foreground flex items-center justify-center">
              <ChatEmptyIcon className="text-orange-500 dark:text-orange-400" />
            </div>
            <p className="text-center text-muted-foreground text-sm max-w-sm font-pixel">
              Ask your CFO anything. Try a suggested prompt or type your question.
            </p>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 rounded-lg border border-border bg-card p-4 min-h-0">
              <div className="space-y-4">
                {messages.map((m) => {
                  const textContent =
                    "content" in m && typeof (m as { content: unknown }).content === "string"
                      ? (m as { content: string }).content
                      : "parts" in m
                      ? (m as { parts: { type: string; text?: string }[] }).parts
                          .filter((p) => p.type === "text")
                          .map((p) => p.text ?? "")
                          .join("")
                      : "";
                  return (
                    <div
                      key={m.id}
                      className={cn(
                        "flex animate-in fade-in-0 slide-in-from-bottom-2 duration-200",
                        m.role === "user" ? "justify-end" : "justify-start"
                      )}
                      role="article"
                      aria-label={m.role === "user" ? "Your message" : "Assistant message"}
                    >
                      <div
                        className={cn(
                          "max-w-[85%] rounded-xl px-4 py-2.5",
                          m.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {"content" in m &&
                        typeof (m as { content: unknown }).content === "string" ? (
                          <p className="text-sm whitespace-pre-wrap">
                            {(m as { content: string }).content}
                          </p>
                        ) : "parts" in m ? (
                          <MessageParts parts={(m as { parts: unknown[] }).parts} />
                        ) : (
                          <p className="text-sm text-muted-foreground">…</p>
                        )}
                        {m.role === "assistant" && textContent && (
                          <button
                            type="button"
                            onClick={() => handleTTS(textContent, m.id)}
                            className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                            aria-label={playingId === m.id ? "Stop audio" : "Play audio"}
                          >
                            <Volume2 className="size-3" aria-hidden />
                            {playingId === m.id ? "Stop" : "Listen"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {isLoading && (
                  <div className="flex justify-start animate-in fade-in-0 slide-in-from-bottom-2 duration-200">
                    <div className="rounded-xl bg-muted px-4 py-2.5 text-sm text-muted-foreground">
                      Thinking…
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </>
        )}

        <div className="flex flex-col gap-3 pt-2">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 shadow-sm transition-[box-shadow,border-color] focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:border-ring focus-within:shadow-md">
            <div className="flex items-center gap-1 shrink-0">
              <div
                className="size-8 rounded-lg bg-muted flex items-center justify-center shrink-0 border border-border"
                aria-hidden
              >
                <ChatEmptyIcon className="size-4 text-muted-foreground" />
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground hover:text-foreground rounded-lg"
                    aria-label="New chat"
                    onClick={handleClearHistory}
                  >
                    <Plus className="size-4" aria-hidden />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>New chat (clears history)</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className={cn(
                      "text-muted-foreground hover:text-foreground",
                      thinkMode && "bg-accent/20 text-accent"
                    )}
                    aria-label={thinkMode ? "Think mode on" : "Think mode off"}
                    aria-pressed={thinkMode}
                    onClick={() => setThinkMode((v) => !v)}
                  >
                    <Lightbulb className="size-4" aria-hidden />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Think: deeper reasoning {thinkMode ? "(ON)" : "(OFF)"}</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className={cn(
                      "text-muted-foreground hover:text-foreground",
                      toolTraceOpen && "bg-accent/20 text-accent"
                    )}
                    aria-label={toolTraceOpen ? "Hide tools" : "Show tools"}
                    aria-pressed={toolTraceOpen}
                    onClick={() => setToolTraceOpen((v) => !v)}
                  >
                    <Wrench className="size-4" aria-hidden />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Toggle tool trace panel</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-1 gap-2 min-w-0">
              <div className="flex flex-1 flex-col min-w-0">
                <input
                  value={input}
                  onChange={(e) => { setInput(e.target.value); setSttError(null); }}
                  placeholder="Ask VaultCFO…"
                  className="flex-1 min-w-0 rounded-md border-0 bg-transparent px-2 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0"
                  aria-label="Message"
                />
                {sttError && (
                  <p className="text-destructive text-[10px] px-2 pb-0.5" role="alert">{sttError}</p>
                )}
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn("font-pixel shrink-0", isRecording && "bg-destructive/20 text-destructive")}
                    aria-label={isRecording ? "Stop recording" : "Voice input (press to talk)"}
                    onClick={handleVoiceInput}
                    disabled={isLoading}
                  >
                    <Mic className="size-4" aria-hidden />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isRecording ? "Click again to stop and send" : "Ask your CFO with voice. Set ELEVENLABS_API_KEY for STT/TTS."}</p>
                </TooltipContent>
              </Tooltip>
              <Button
                type="submit"
                disabled={isLoading}
                size="icon"
                className="font-pixel shrink-0 size-9 rounded-lg bg-orange-500 text-white hover:bg-orange-600 focus-visible:ring-2 focus-visible:ring-orange-400"
                aria-label="Send message"
              >
                <Send className="size-4" aria-hidden />
              </Button>
            </form>
          </div>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <Button
                key={prompt}
                variant="outline"
                size="sm"
                className="font-pixel text-[10px] hover:scale-[1.02] transition-transform"
                onClick={() => setInput(prompt)}
              >
                {prompt}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <Card className="w-full md:w-80 shrink-0 rounded-xl border border-border bg-card transition-all duration-200 hover:shadow-lg">
        <CardHeader
          className="cursor-pointer py-3 flex flex-row items-center gap-2"
          onClick={() => setToolTraceOpen((v) => !v)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setToolTraceOpen((v) => !v);
            }
          }}
          role="button"
          tabIndex={0}
          aria-expanded={toolTraceOpen}
          aria-label={toolTraceOpen ? "Collapse tool trace" : "Expand tool trace"}
        >
          <CardTitle className="flex items-center gap-2 font-pixel text-xs">
            {toolTraceOpen ? (
              <ChevronDown className="size-4" aria-hidden />
            ) : (
              <ChevronRight className="size-4" aria-hidden />
            )}
            Tool trace
          </CardTitle>
        </CardHeader>
        {toolTraceOpen && (
          <CardContent className="pt-0">
            <ScrollArea className="h-[300px] text-xs">
              {toolCallsFromMessages.length === 0 ? (
                <p className="text-muted-foreground">No tool calls yet.</p>
              ) : (
                toolCallsFromMessages.map((inv: unknown, i: number) => {
                  const t = inv as {
                    toolName?: string;
                    state?: string;
                    input?: unknown;
                    output?: unknown;
                  };
                  return (
                    <div
                      key={i}
                      className="mb-3 rounded-lg border border-border p-2 bg-muted/30"
                    >
                      <p className="font-pixel text-[10px] text-primary">
                        {t.toolName ?? "tool"}
                      </p>
                      {t.input != null && (
                        <pre className="mt-1 overflow-x-auto text-[10px] text-muted-foreground">
                          {JSON.stringify(t.input, null, 0).slice(0, 200)}
                        </pre>
                      )}
                      {(t.state === "result" || t.output != null) &&
                        t.output != null && (
                          <pre className="mt-1 max-h-24 overflow-auto text-[10px] text-muted-foreground">
                            {typeof t.output === "string"
                              ? t.output.slice(0, 300)
                              : JSON.stringify(t.output).slice(0, 300)}
                          </pre>
                        )}
                    </div>
                  );
                })
              )}
            </ScrollArea>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

function MessageParts({ parts }: { parts: unknown[] }) {
  const text = parts
    .filter(
      (p): p is { type: string; text?: string } =>
        typeof p === "object" &&
        p !== null &&
        "type" in p &&
        (p as { type: string }).type === "text"
    )
    .map((p) => p.text ?? "")
    .join("");
  if (!text.trim()) return <p className="text-sm text-muted-foreground">…</p>;
  return <p className="text-sm whitespace-pre-wrap">{text}</p>;
}
