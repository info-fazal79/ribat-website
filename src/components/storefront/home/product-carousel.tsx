"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/storefront/product-card";
import { SectionHeading } from "@/components/storefront/home/section-heading";
import type { CatalogProduct } from "@/lib/catalog/types";
import type { HomeSectionOf } from "@/lib/validations/homepage";
import { cn } from "@/lib/utils";

// Card widths per "items per view" on desktop (static class names for Tailwind); phones ~1.5, tablets ~2.5.
const cardWidth = {
  2: "lg:w-[calc((100%-1.5rem)/2)]",
  3: "lg:w-[calc((100%-3rem)/3)]",
  4: "lg:w-[calc((100%-4.5rem)/4)]",
  5: "lg:w-[calc((100%-6rem)/5)]",
  6: "lg:w-[calc((100%-7.5rem)/6)]",
} as const;

/** Horizontally scrolling product slider with arrows and optional autoplay. */
export function ProductCarousel({ section, products }: { section: HomeSectionOf<"productCarousel">; products: CatalogProduct[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const items = products.slice(0, section.limit);
  const perView = Math.min(6, Math.max(2, section.perView)) as keyof typeof cardWidth;

  const step = useCallback((dir: 1 | -1) => {
    const el = track.current;
    const card = el?.firstElementChild as HTMLElement | null;
    if (!el || !card) return;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8;
    if (dir === 1 && atEnd) el.scrollTo({ left: 0, behavior: "smooth" });
    else el.scrollBy({ left: dir * (card.offsetWidth + 24), behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (!section.autoplay || paused || items.length <= perView) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setInterval(() => step(1), section.interval * 1000);
    return () => window.clearInterval(t);
  }, [section.autoplay, section.interval, paused, items.length, perView, step]);

  if (items.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-20 md:py-28">
      <div className="flex items-end justify-between gap-4">
        <SectionHeading
          eyebrow={section.eyebrow}
          title={section.title}
          titleBn={section.titleBn || undefined}
          href={section.viewAllUrl || undefined}
          linkLabel={section.viewAllLabel || undefined}
          className="flex-1"
        />
        <div className="mb-14 hidden shrink-0 gap-2 md:flex">
          {([-1, 1] as const).map((dir) => (
            <button
              key={dir}
              type="button"
              onClick={() => step(dir)}
              aria-label={dir < 0 ? "Previous products" : "Next products"}
              className="grid size-11 place-items-center rounded-full border transition hover:border-foreground"
            >
              {dir < 0 ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />}
            </button>
          ))}
        </div>
      </div>
      <div
        ref={track}
        aria-roledescription="carousel"
        aria-label={section.title || "Products"}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        className="-mx-4 flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-px-4 px-4 pb-2 [scrollbar-width:none]"
      >
        {items.map((product) => (
          <div key={product.id} className={cn("w-[62%] shrink-0 snap-start sm:w-[38%]", cardWidth[perView])}>
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
