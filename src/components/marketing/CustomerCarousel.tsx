"use client";

import { useRef, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const CUSTOMERS = [
  {
    id: "1",
    quote: "VaultCFO helps us keep contract renewals and spending under control.",
    industry: "Finance",
    logo: "V1",
  },
  {
    id: "2",
    quote: "Privacy-first analytics without sending data to the cloud.",
    industry: "Technology",
    logo: "V2",
  },
  {
    id: "3",
    quote: "Our team uses the AI agent daily for budget questions.",
    industry: "Operations",
    logo: "V3",
  },
] as const;

export function CustomerCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const scrollTo = (i: number) => {
    const next = Math.max(0, Math.min(i, CUSTOMERS.length - 1));
    setIndex(next);
    scrollRef.current?.querySelector(`[data-index="${next}"]`)?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  };

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const cards = el.querySelectorAll("[data-index]");
    const scrollLeft = el.scrollLeft;
    const width = el.clientWidth;
    let current = 0;
    cards.forEach((card, i) => {
      const left = (card as HTMLElement).offsetLeft;
      if (scrollLeft >= left - width / 2) current = i;
    });
    setIndex(current);
  }, []);

  return (
    <section
      className="bg-card border-y border-border py-16 px-4"
      aria-labelledby="customers-heading"
    >
      <div className="container max-w-5xl mx-auto">
        <h2
          id="customers-heading"
          className="font-pixel text-2xl md:text-3xl text-foreground text-center mb-10"
        >
          Meet our customers
        </h2>
        <div className="relative">
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-4 scroll-smooth scrollbar-hide"
            style={{ scrollbarWidth: "none" }}
            role="region"
            aria-label="Customer testimonials"
          >
            {CUSTOMERS.map((customer, i) => (
              <article
                key={customer.id}
                data-index={i}
                className="flex-shrink-0 w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] snap-center rounded-xl border border-border bg-background p-6 shadow-sm"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-muted font-pixel text-lg text-muted-foreground">
                  {customer.logo}
                </div>
                <p className="text-foreground text-sm mb-2">"{customer.quote}"</p>
                <p className="font-pixel text-xs text-muted-foreground uppercase tracking-wider">
                  {customer.industry}
                </p>
              </article>
            ))}
          </div>
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => scrollTo(index - 1)}
              disabled={index === 0}
              className="rounded-lg border border-border bg-background p-2 text-foreground hover:bg-muted disabled:opacity-50 disabled:pointer-events-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="Previous customer"
            >
              <ChevronLeft className="size-5" aria-hidden />
            </button>
            <span className="font-pixel text-xs text-muted-foreground">
              {index + 1} / {CUSTOMERS.length}
            </span>
            <button
              type="button"
              onClick={() => scrollTo(index + 1)}
              disabled={index === CUSTOMERS.length - 1}
              className="rounded-lg border border-border bg-background p-2 text-foreground hover:bg-muted disabled:opacity-50 disabled:pointer-events-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="Next customer"
            >
              <ChevronRight className="size-5" aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
