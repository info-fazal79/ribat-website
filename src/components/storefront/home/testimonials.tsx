"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BadgeCheck, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { SectionHeading } from "@/components/storefront/home/section-heading";
import { StarRating } from "@/components/storefront/star-rating";
import type { Testimonial } from "@/lib/mock/content";
import { cn } from "@/lib/utils";

export function Testimonials({ items }: { items: Testimonial[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const scrollTo = useCallback((i: number) => {
    const el = track.current;
    if (!el) return;
    const card = el.children[i] as HTMLElement | undefined;
    if (card) el.scrollTo({ left: card.offsetLeft - el.offsetLeft, behavior: "smooth" });
  }, []);

  // Track the slide nearest the left edge as the user swipes.
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const onScroll = () => {
      const width = (el.children[0] as HTMLElement | undefined)?.offsetWidth ?? 1;
      setActive(Math.round(el.scrollLeft / width));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setTimeout(() => {
      const el = track.current;
      const atEnd = el && el.scrollLeft + el.clientWidth >= el.scrollWidth - 8;
      scrollTo(atEnd ? 0 : active + 1);
    }, 5000);
    return () => window.clearTimeout(t);
  }, [active, paused, scrollTo]);

  return (
    <section className="bg-secondary/60 py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between">
          <SectionHeading
            eyebrow="Customer Love"
            title="4.8 ★ from 12,000+ orders"
            titleBn="আমাদের গ্রাহকদের কথা"
            className="md:mb-14"
          />
          <div className="mb-14 hidden gap-2 md:flex">
            <button
              type="button"
              onClick={() => scrollTo(Math.max(0, active - 1))}
              aria-label="Previous review"
              className="grid size-11 place-items-center rounded-full border transition hover:border-foreground"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollTo(Math.min(items.length - 1, active + 1))}
              aria-label="Next review"
              className="grid size-11 place-items-center rounded-full border transition hover:border-foreground"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>

        <div
          ref={track}
          aria-roledescription="carousel"
          aria-label="Customer reviews"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={() => setPaused(true)}
          className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 pb-2 [scrollbar-width:none] md:gap-6"
        >
          {items.map((t) => (
            <figure
              key={t.id}
              className="flex w-[85%] shrink-0 snap-start flex-col gap-5 bg-background p-8 sm:w-[60%] md:p-10 lg:w-[calc((100%-3rem)/3)]"
            >
              <div className="flex items-center justify-between">
                <StarRating rating={t.rating} size="md" />
                <Quote className="size-8 text-gold/40" strokeWidth={1} />
              </div>
              <blockquote className={cn("flex-1 text-[15px] leading-relaxed", t.bengali && "font-bengali")}>
                “{t.quote}”
              </blockquote>
              <figcaption className="flex items-center gap-3 border-t pt-5">
                <span className="grid size-10 place-items-center rounded-full bg-primary font-heading text-lg text-primary-foreground">
                  {t.name.charAt(0)}
                </span>
                <div className="min-w-0">
                  <p className={cn("flex items-center gap-1 text-sm font-medium", t.bengali && "font-bengali")}>
                    {t.name}
                    <BadgeCheck className="size-3.5 text-primary" aria-label="Verified buyer" />
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    <span className={cn(t.bengali && "font-bengali")}>{t.city}</span> · {t.product}
                  </p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>

        <div className="mt-8 flex justify-center gap-2">
          {items.map((t, i) => (
            <button
              key={t.id}
              type="button"
              onClick={() => scrollTo(i)}
              aria-label={`Go to review ${i + 1}`}
              className={cn("h-1 rounded-full transition-all", i === active ? "w-8 bg-foreground" : "w-3 bg-foreground/20")}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
