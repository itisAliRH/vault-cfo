import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

export function HeroSection() {
  return (
    <section
      className="hero-gradient-mistral relative min-h-[85vh] flex flex-col items-center justify-center px-6 py-24 text-center"
      aria-label="Hero"
    >
      <div className="container max-w-4xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/90 dark:bg-black/20 px-3 py-1.5 font-pixel text-xs uppercase tracking-wider hero-subtitle-mistral animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
          <span className="size-2 rounded-full bg-current opacity-80" aria-hidden />
          New: Privacy-first finance
        </div>
        <h1 className="font-pixel text-4xl md:text-5xl lg:text-6xl font-bold hero-heading-mistral animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
          Your private AI CFO.
        </h1>
        <p className="hero-subtitle-mistral text-lg md:text-xl max-w-2xl mx-auto animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
          Privacy-first personal finance. Dashboard, contracts, and an AI
          assistant—your data stays local.
        </p>
        <div className="flex flex-wrap gap-4 justify-center pt-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
          <Button
            asChild
            size="lg"
            className="font-pixel text-sm bg-orange-500 text-white hover:bg-orange-600 border-0 hover:scale-[1.02] transition-all duration-200 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--mistral-hero-gradient-end)]"
          >
            <Link href="/signup" className="group inline-flex items-center gap-2">
              Get started
              <ChevronRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="font-pixel text-sm hero-cta-outline-mistral bg-transparent border-2 hover:scale-[1.02] transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[var(--mistral-hero-cta-outline)] focus-visible:ring-offset-2"
          >
            <Link href="/login" className="group inline-flex items-center gap-2">
              Log in
              <ChevronRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
