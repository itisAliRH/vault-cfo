import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Shield,
  Check,
  ChevronRight,
} from "lucide-react";

const features = [
  {
    href: "/signup",
    icon: LayoutDashboard,
    title: "Dashboard",
    bullets: [
      "Income, expenses, and cashflow at a glance",
      "Spending by category",
      "6-month trends",
    ],
    linkLabel: "Discover Dashboard",
  },
  {
    href: "/signup",
    icon: FileText,
    title: "Contracts",
    bullets: [
      "Upload contracts, extract terms",
      "Renewal and cancellation deadlines",
      "All data stays local",
    ],
    linkLabel: "Discover Contracts",
  },
  {
    href: "/signup",
    icon: MessageSquare,
    title: "AI agent",
    bullets: [
      "Ask questions in plain language",
      "Savings tips and insights",
      "On-device assistant",
    ],
    linkLabel: "Discover Agent",
  },
  {
    href: "/signup",
    icon: Shield,
    title: "Privacy first",
    bullets: [
      "Encrypted vault",
      "Local SQLite, optional cloud",
      "You control your data",
    ],
    linkLabel: "Discover more",
  },
] as const;

const CARD_TINTS = ["bg-orange-500/5 border-orange-500/20", "bg-amber-500/5 border-amber-500/20", "bg-orange-600/5 border-orange-600/20", "bg-amber-600/5 border-amber-600/20"] as const;

export function FeatureSection() {
  return (
    <section
      id="features"
      className="bg-background py-20 md:py-28 px-6"
      aria-labelledby="features-heading"
    >
      <div className="container max-w-5xl mx-auto px-2">
        <h2
          id="features-heading"
          className="font-pixel text-2xl md:text-3xl text-foreground text-center mb-12 md:mb-16"
        >
          What VaultCFO can do for you
        </h2>
        <ScrollReveal>
        <div className="grid gap-6 md:grid-cols-2">
          {features.map(({ href, icon: Icon, title, bullets, linkLabel }, i) => (
            <Card
              key={title}
              className={`rounded-xl border ${CARD_TINTS[i % CARD_TINTS.length]} bg-card text-card-foreground transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2`}
            >
              <CardHeader>
                <Icon
                  className="size-8 text-orange-500 dark:text-orange-400 mb-2"
                  aria-hidden
                />
                <h3 className="font-pixel text-sm font-semibold text-foreground">
                  {title}
                </h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2">
                      <Check
                        className="size-4 text-orange-500 dark:text-orange-400 shrink-0 mt-0.5"
                        aria-hidden
                      />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={href}
                  className="inline-flex items-center gap-1.5 font-pixel text-xs text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
                >
                  {linkLabel}
                  <ChevronRight className="size-4" aria-hidden />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
