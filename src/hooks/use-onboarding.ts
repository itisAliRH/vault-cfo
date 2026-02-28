"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { UserProfile } from "@/types";

export function useOnboarding() {
  const [profile, setProfile] = useState<UserProfile | null | undefined>(undefined);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname === "/onboarding") return;
    fetch("/api/onboarding")
      .then((r) => (r.ok ? r.json() : { profile: null }))
      .then((data) => setProfile(data.profile ?? null))
      .catch(() => setProfile(null));
  }, [pathname]);

  useEffect(() => {
    if (profile === undefined || pathname === "/onboarding") return;
    if (profile === null) {
      router.replace("/onboarding");
    }
  }, [profile, pathname, router]);

  return { profile, hasProfile: profile != null };
}
