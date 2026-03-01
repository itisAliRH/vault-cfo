"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, Plus, Trash2, Calendar, Clock } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";

interface Session {
  id: string;
  title: string;
  status: string;
  agent_id: string;
  transcript: string | null;
  created_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDuration(seconds: number | null) {
  if (seconds == null) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function AgentMeetingPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  const fetchSessions = useCallback(() => {
    setLoading(true);
    fetch("/api/agent-meeting/sessions")
      .then((r) => r.json())
      .then((data: { sessions?: Session[] }) => {
        setSessions(Array.isArray(data.sessions) ? data.sessions : []);
      })
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleNewMeeting = async () => {
    setCreating(true);
    try {
      await fetch("/api/agent-meeting/agent", { method: "POST" });
      const sessionRes = await fetch("/api/agent-meeting/sessions", {
        method: "POST",
      });
      if (!sessionRes.ok) {
        const err = await sessionRes.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Failed to create session");
      }
      const session = (await sessionRes.json()) as { id?: string };
      if (session?.id) {
        window.location.href = `/agent-meeting/${session.id}`;
        return;
      }
      throw new Error("No session ID returned");
    } catch (err) {
      toast({
        title: "Could not start meeting",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "error",
      });
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/agent-meeting/sessions/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      fetchSessions();
      toast({ title: "Meeting deleted", variant: "success" });
    } catch {
      toast({
        title: "Could not delete meeting",
        variant: "error",
      });
    }
  };

  return (
    <div className="container max-w-4xl mx-auto px-6 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold font-pixel tracking-tight">
            Agent Meeting
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Talk with your VaultCFO finance consultant using voice and a live avatar.
          </p>
        </div>
        <Button
          onClick={handleNewMeeting}
          disabled={creating}
          className="font-pixel gap-2 bg-orange-500 hover:bg-orange-600"
        >
          <Plus className="size-4" aria-hidden />
          {creating ? "Starting…" : "New meeting"}
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <Card className="border border-border bg-card">
          <CardHeader>
            <div className="flex justify-center mb-2">
              <div className="rounded-2xl bg-muted p-6">
                <Video className="size-12 text-muted-foreground" aria-hidden />
              </div>
            </div>
            <CardTitle className="text-center font-pixel text-lg">
              No meetings yet
            </CardTitle>
            <CardDescription className="text-center max-w-sm mx-auto">
              Start a new meeting to have a voice conversation with your finance
              consultant. You&apos;ll see a live avatar and can discuss budgeting,
              spending, and more. Add ELEVENLABS_API_KEY and SIMLI_API_KEY to
              .env.local, then restart the dev server so the app can use them.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button
              onClick={handleNewMeeting}
              disabled={creating}
              className="font-pixel gap-2 bg-orange-500 hover:bg-orange-600"
            >
              <Plus className="size-4" aria-hidden />
              {creating ? "Starting…" : "Start your first meeting"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-4">
          {sessions.map((session) => (
            <Card key={session.id} className="border border-border bg-card">
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="font-pixel text-base truncate">
                      {session.title}
                    </CardTitle>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3" aria-hidden />
                        {formatDate(session.created_at)}
                      </span>
                      {session.duration_seconds != null && (
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" aria-hidden />
                          {formatDuration(session.duration_seconds)}
                        </span>
                      )}
                      <span
                        className={
                          session.status === "active"
                            ? "text-green-600 dark:text-green-400"
                            : ""
                        }
                      >
                        {session.status === "active" ? "Active" : "Ended"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {session.status === "active" && (
                      <Button variant="outline" size="sm" asChild className="font-pixel">
                        <Link href={`/agent-meeting/${session.id}?auto=1`}>Resume</Link>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      aria-label={`Delete meeting ${session.title}`}
                      onClick={() => handleDelete(session.id)}
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </ul>
      )}
    </div>
  );
}
