import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutDashboard, FileText, MessageSquare, Shield } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="container max-w-4xl mx-auto px-4 py-16 space-y-20">
      <section className="text-center space-y-6">
        <h1 className="font-pixel text-3xl md:text-4xl text-foreground">
          Your private AI CFO
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Privacy-first personal finance. Dashboard, contracts, and an AI assistant—your data stays local.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Button asChild size="lg" className="font-pixel text-sm">
            <Link href="/signup">Get started</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="font-pixel text-sm">
            <Link href="/login">Log in</Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <Card className="pixel-border">
          <CardHeader>
            <LayoutDashboard className="size-8 text-accent mb-2" />
            <CardTitle className="font-pixel text-sm">Dashboard</CardTitle>
            <CardDescription>Income, expenses, cashflow, and spending by category at a glance.</CardDescription>
          </CardHeader>
        </Card>
        <Card className="pixel-border">
          <CardHeader>
            <FileText className="size-8 text-accent mb-2" />
            <CardTitle className="font-pixel text-sm">Contracts</CardTitle>
            <CardDescription>Upload contracts, extract terms, and see renewal and cancellation deadlines.</CardDescription>
          </CardHeader>
        </Card>
        <Card className="pixel-border">
          <CardHeader>
            <MessageSquare className="size-8 text-accent mb-2" />
            <CardTitle className="font-pixel text-sm">AI agent</CardTitle>
            <CardDescription>Ask questions, get savings tips, and explore your data with an on-device assistant.</CardDescription>
          </CardHeader>
        </Card>
        <Card className="pixel-border">
          <CardHeader>
            <Shield className="size-8 text-accent mb-2" />
            <CardTitle className="font-pixel text-sm">Privacy first</CardTitle>
            <CardDescription>Encrypted vault, local SQLite, optional online tools. You control your data.</CardDescription>
          </CardHeader>
        </Card>
      </section>

      <section className="text-center border-t border-border pt-12">
        <p className="text-muted-foreground text-sm mb-4">Ready to take control of your finances?</p>
        <Button asChild className="font-pixel text-sm">
          <Link href="/signup">Sign up free</Link>
        </Button>
      </section>
    </div>
  );
}
