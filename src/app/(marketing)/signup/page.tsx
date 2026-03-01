"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronRight } from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      // No auth backend — new users always go to onboarding first
      router.replace("/onboarding");
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-sm mx-auto px-6 py-20">
      <Card className="rounded-xl border border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="font-pixel text-lg">Sign up</CardTitle>
          <CardDescription>Create an account to start using VaultCFO.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <p className="text-sm text-destructive font-pixel">{error}</p>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="font-pixel text-xs text-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="font-pixel text-sm"
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="font-pixel text-xs text-foreground">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="font-pixel text-sm"
                autoComplete="new-password"
                minLength={8}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="font-pixel text-xs text-foreground">Confirm password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="font-pixel text-sm"
                autoComplete="new-password"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button
              type="submit"
              className="w-full font-pixel text-sm bg-orange-500 text-white hover:bg-orange-600 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 disabled:opacity-50"
              disabled={loading}
            >
              <span className="inline-flex items-center gap-2">
                {loading ? "Creating account…" : "Sign up"}
                {!loading && <ChevronRight className="size-4" aria-hidden />}
              </span>
            </Button>
            <p className="text-muted-foreground text-xs">
              Already have an account?{" "}
              <Link href="/login" className="text-orange-600 dark:text-orange-400 hover:underline font-pixel focus-visible:ring-2 focus-visible:ring-ring rounded">
                Log in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
