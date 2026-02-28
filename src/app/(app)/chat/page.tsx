"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown, ChevronRight, Mic, Send } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const SUGGESTED_PROMPTS = [
  "How can I save 200€/month?",
  "Which contracts can I cancel?",
  "Show my top spending categories",
];

export default function ChatPage() {
  const [input, setInput] = useState("");
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat" }), []);
  const { messages, sendMessage, status } = useChat({
    transport,
  });
  const [toolTraceOpen, setToolTraceOpen] = useState(true);
  const isLoading = status === "submitted" || status === "streaming";

  const handleSubmit = (e?: { preventDefault?: () => void }) => {
    e?.preventDefault?.();
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    sendMessage({ text });
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
    <div className="flex h-[calc(100vh-4rem)] gap-4 p-4">
      <div className="flex flex-1 flex-col gap-4">
        <h1 className="font-pixel text-xl text-primary">Agent Chat</h1>
        <ScrollArea className="flex-1 rounded-lg border border-border p-4">
          <div className="space-y-4">
            {messages.length === 0 && (
              <p className="text-muted-foreground text-sm">
                Ask your CFO anything. Try: &quot;How can I save 200€/month?&quot; or &quot;Show my top spending categories.&quot;
              </p>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {"content" in m && typeof (m as { content: unknown }).content === "string" ? (
                    <p className="text-sm whitespace-pre-wrap">{(m as { content: string }).content}</p>
                  ) : "parts" in m ? (
                    <MessageParts parts={(m as { parts: unknown[] }).parts} />
                  ) : (
                    <p className="text-sm">[Message]</p>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                  Thinking…
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="flex gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="button" variant="outline" size="icon" className="font-pixel shrink-0" aria-label="Voice (press-to-talk)">
                <Mic className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Ask your CFO with voice. Set ELEVENLABS_API_KEY for TTS.</p>
            </TooltipContent>
          </Tooltip>
          <form onSubmit={handleSubmit} className="flex flex-1 gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask your CFO..."
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <Button type="submit" disabled={isLoading} className="font-pixel text-xs">
              <Send className="size-4" />
            </Button>
          </form>
        </div>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_PROMPTS.map((prompt) => (
            <Button
              key={prompt}
              variant="outline"
              size="sm"
              className="font-pixel text-[10px]"
              onClick={() => {
                setInput(prompt);
              }}
            >
              {prompt}
            </Button>
          ))}
        </div>
      </div>

      <Card className="w-80 shrink-0 pixel-border">
        <CardHeader className="cursor-pointer py-3" onClick={() => setToolTraceOpen(!toolTraceOpen)}>
          <CardTitle className="flex items-center gap-2 font-pixel text-xs">
            {toolTraceOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
            Tool trace
          </CardTitle>
        </CardHeader>
        {toolTraceOpen && (
          <CardContent className="pt-0">
            <ScrollArea className="h-[300px] text-xs">
              {toolCallsFromMessages.length === 0 && (
                <p className="text-muted-foreground">No tool calls yet.</p>
              )}
              {toolCallsFromMessages.map((inv: unknown, i: number) => {
                const t = inv as { toolName?: string; state?: string; input?: unknown; output?: unknown };
                return (
                  <div key={i} className="mb-3 rounded border border-border p-2">
                    <p className="font-pixel text-[10px] text-primary">{t.toolName ?? "tool"}</p>
                    {t.input != null && (
                      <pre className="mt-1 overflow-x-auto text-[10px] text-muted-foreground">
                        {JSON.stringify(t.input, null, 0).slice(0, 200)}
                      </pre>
                    )}
                    {(t.state === "result" || t.output != null) && t.output != null && (
                      <pre className="mt-1 max-h-24 overflow-auto text-[10px] text-muted-foreground">
                        {typeof t.output === "string"
                          ? t.output.slice(0, 300)
                          : JSON.stringify(t.output).slice(0, 300)}
                      </pre>
                    )}
                  </div>
                );
              })}
            </ScrollArea>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

function MessageParts({ parts }: { parts: unknown[] }) {
  const text = parts
    .filter((p): p is { type: string; text?: string } => typeof p === "object" && p !== null && "type" in p && (p as { type: string }).type === "text")
    .map((p) => p.text ?? "")
    .join("");
  return <p className="text-sm whitespace-pre-wrap">{text || "[No text]"}</p>;
}
