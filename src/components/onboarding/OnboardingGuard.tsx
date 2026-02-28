"use client";

import { useOnboarding } from "@/hooks/use-onboarding";

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  useOnboarding();
  return <>{children}</>;
}
