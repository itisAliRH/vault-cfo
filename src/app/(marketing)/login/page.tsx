"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // Placeholder: no auth backend yet; redirect to app (onboarding guard will send to onboarding if needed)
      await new Promise((r) => setTimeout(r, 400));
      router.replace("/");
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-sm mx-auto px-4 py-16">
      <Card className="pixel-border">
        <CardHeader>
          <CardTitle className="font-pixel text-lg">Log in</CardTitle>
          <CardDescription>Enter your credentials to access your vault.</CardDescription>
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
                autoComplete="current-password"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full font-pixel text-sm" disabled={loading}>
              {loading ? "Signing in…" : "Log in"}
            </Button>
            <p className="text-muted-foreground text-xs">
              Don’t have an account?{" "}
              <Link href="/signup" className="text-accent hover:underline">Sign up</Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
