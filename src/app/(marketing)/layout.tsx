import Link from "next/link";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border px-4 py-3 flex items-center justify-between">
        <Link href="/landing" className="font-pixel text-sm text-foreground hover:text-accent transition-colors">
          VaultCFO
        </Link>
        <nav className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/login"
            className="font-pixel text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-md"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="font-pixel text-xs bg-accent text-accent-foreground hover:bg-accent/90 px-3 py-2 rounded-md transition-colors"
          >
            Sign up
          </Link>
        </nav>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
