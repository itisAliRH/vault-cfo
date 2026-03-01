import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HeroSection } from "@/components/marketing/HeroSection";
import { CustomerCarousel } from "@/components/marketing/CustomerCarousel";
import { ChevronRight } from "lucide-react";
import { FeatureSection } from "@/components/marketing/FeatureSection";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <HeroSection />
      <CustomerCarousel />
      <FeatureSection />
      <section
        id="cta"
        className="bg-card border-t border-border py-16 px-6 text-center"
        aria-labelledby="cta-heading"
      >
        <h2 id="cta-heading" className="sr-only">
          Get started
        </h2>
        <p className="text-muted-foreground text-sm mb-6">
          Ready to take control of your finances?
        </p>
        <Button asChild className="font-pixel text-sm bg-orange-500 text-white hover:bg-orange-600 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2">
          <Link href="/signup" className="inline-flex items-center gap-2">
            Sign up free
            <ChevronRight className="size-4" aria-hidden />
          </Link>
        </Button>
      </section>
    </div>
  );
}
