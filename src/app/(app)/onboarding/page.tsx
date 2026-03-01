"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import type { UserProfile } from "@/types";

const LITERACY_OPTIONS: { value: UserProfile["literacy_level"]; label: string }[] = [
  { value: "beginner", label: "Beginner - I prefer simple explanations" },
  { value: "intermediate", label: "Intermediate - I can read charts and basics" },
  { value: "advanced", label: "Advanced - I want full analytics" },
];

const INSIGHT_OPTIONS: { value: UserProfile["insight_style"]; label: string }[] = [
  { value: "simple", label: "Simple tips" },
  { value: "deep", label: "Deep analytics" },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [literacyLevel, setLiteracyLevel] = useState<UserProfile["literacy_level"] | null>(null);
  const [insightStyle, setInsightStyle] = useState<UserProfile["insight_style"] | null>(null);
  const [onlineConsent, setOnlineConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    if (literacyLevel == null || insightStyle == null) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          literacy_level: literacyLevel,
          insight_style: insightStyle,
          online_consent: onlineConsent,
        }),
      });
      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as { error?: string; hint?: string };
        const msg = errBody.hint ? `${errBody.error ?? "Failed to save"} ${errBody.hint}` : (errBody.error ?? "Failed to save");
        throw new Error(msg);
      }
      router.replace("/dashboard");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-10 px-6 py-10">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="font-pixel text-2xl text-foreground">
            {step === 1 ? "Welcome to VaultCFO" : "Setup"}
          </h1>
          <span className="font-pixel text-xs text-muted-foreground">STEP {step}/3</span>
        </div>
      </div>

      {step === 1 && (
        <Card className="rounded-xl border border-border bg-card transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 dark:border-white/20">
          <CardHeader>
            <CardTitle className="font-pixel text-sm">Financial literacy</CardTitle>
            <CardDescription className="text-muted-foreground text-base">How comfortable are you with finance?</CardDescription>
            <p className="text-sm text-muted-foreground mt-1">This controls how technical the AI speaks to you. You can change it later in Settings.</p>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {LITERACY_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                type="button"
                variant="ghost"
                className={cn(
                  "min-w-0 w-full rounded-lg border-2 p-4 h-auto text-left text-sm transition-colors font-pixel justify-start whitespace-normal break-words",
                  literacyLevel === opt.value
                    ? "border-primary bg-primary/20 text-foreground hover:text-foreground ring-2 ring-primary/40 dark:ring-primary/50"
                    : "border-foreground/50 text-foreground hover:text-foreground hover:border-foreground/80 hover:bg-muted/30 dark:border-white/40 dark:hover:border-white/70"
                )}
                onClick={() => setLiteracyLevel(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </CardContent>
          <CardFooter>
            <Button
              className="font-pixel text-xs"
              disabled={literacyLevel == null}
              onClick={() => setStep(2)}
            >
              Next
            </Button>
          </CardFooter>
        </Card>
      )}

      {step === 2 && (
        <Card className="rounded-xl border border-border bg-card transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 dark:border-white/20">
          <CardHeader>
            <CardTitle className="font-pixel text-sm">Insight style</CardTitle>
            <CardDescription className="text-muted-foreground text-base">How would you like insights?</CardDescription>
            <p className="text-sm text-muted-foreground mt-1">Simple tips = actionable one-liners; Deep analytics = detailed breakdowns with projections and comparisons.</p>
          </CardHeader>
          <CardContent className="flex gap-4">
            {INSIGHT_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                variant={insightStyle === opt.value ? "default" : "outline"}
                className={cn(
                  "font-pixel text-xs",
                  insightStyle === opt.value && "ring-2 ring-primary/40 dark:ring-primary/50",
                  insightStyle !== opt.value && "dark:border-white/40 dark:hover:border-white/70"
                )}
                onClick={() => setInsightStyle(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button variant="ghost" className="font-pixel text-xs" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button
              className="font-pixel text-xs"
              disabled={insightStyle == null}
              onClick={() => setStep(3)}
            >
              Next
            </Button>
          </CardFooter>
        </Card>
      )}

      {step === 3 && (
        <Card className="rounded-xl border border-border bg-card transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 dark:border-white/20">
          <CardHeader>
            <CardTitle className="font-pixel text-sm">Privacy</CardTitle>
            <CardDescription className="text-muted-foreground text-base">Your data stays local by default.</CardDescription>
            <p className="text-sm text-muted-foreground mt-1">VaultCFO runs entirely locally by default. Enabling online tools lets the AI search current rates — only when you explicitly ask.</p>
          </CardHeader>
          <CardContent>
            <Label className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-foreground/50 p-4 text-foreground font-pixel text-sm hover:border-foreground/80 hover:bg-muted/50 dark:border-white/40 dark:hover:border-white/70">
              <input
                type="checkbox"
                checked={onlineConsent}
                onChange={(e) => setOnlineConsent(e.target.checked)}
                className="size-4 rounded border-primary"
              />
              <span>Allow online tools when I explicitly ask</span>
            </Label>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button variant="ghost" className="font-pixel text-xs" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button
              className="font-pixel text-xs"
              disabled={literacyLevel == null || insightStyle == null || submitting}
              onClick={handleSubmit}
            >
              {submitting ? "Saving…" : "Finish"}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
