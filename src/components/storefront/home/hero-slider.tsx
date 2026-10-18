"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { GeometricPattern, Silhouette } from "@/components/storefront/art";
import type { HeroSlide } from "@/lib/mock/content";
import { cn } from "@/lib/utils";

const INTERVAL_MS = 6500;

export function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const go = useCallback((next: number) => setIndex((next + slides.length) % slides.length), [slides.length]);

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setTimeout(() => go(index + 1), INTERVAL_MS);
    return () => window.clearTimeout(t);
  }, [index, paused, go]);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured collections"
      className="relative h-[min(88vh,760px)] min-h-[560px] overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {slides.map((slide, i) => {
        const active = i === index;
        const light = slide.tone.text === "light";
        return (
          <div
            key={slide.id}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${slides.length}`}
            aria-hidden={!active}
            inert={!active}
            className={cn(
              "absolute inset-0 transition-opacity duration-1000 ease-out",
              active ? "z-10 opacity-100" : "z-0 opacity-0",
            )}
            style={{ background: `radial-gradient(120% 90% at 75% 40%, ${slide.tone.from} 0%, ${slide.tone.to} 100%)` }}
          >
            <GeometricPattern color={slide.tone.ink} opacity={0.14} />

            {/* Arch with garment */}
            <div
              className={cn(
                "absolute top-[10%] right-[4%] bottom-0 hidden aspect-[3/4.2] rounded-t-full border md:block lg:right-[8%]",
                "transition-all duration-[1400ms] ease-out",
                active ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
              )}
              style={{
                borderColor: `color-mix(in oklch, ${slide.tone.ink} 45%, transparent)`,
                background: `linear-gradient(180deg, color-mix(in oklch, ${slide.tone.ink} 16%, transparent), transparent 75%)`,
              }}
            >
              <Silhouette
                category={slide.art}
                fill={`color-mix(in oklch, ${slide.tone.ink} ${light ? 30 : 55}%, ${slide.tone.from})`}
                stroke={slide.tone.ink}
                className={cn(
                  "absolute inset-x-0 bottom-[4%] mx-auto h-[82%] w-auto transition-transform duration-[2000ms] ease-out",
                  active ? "scale-100" : "scale-95",
                )}
              />
            </div>

            <div className="relative z-10 container mx-auto flex h-full items-center px-4">
              <div
                className={cn(
                  "max-w-xl space-y-6 transition-all delay-200 duration-1000 ease-out",
                  active ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
                  light ? "text-[#f6f1e7]" : "text-[#1d1a14]",
                )}
              >
                <p className="text-[11px] font-medium tracking-[0.35em] uppercase" style={{ color: slide.tone.ink }}>
                  {slide.eyebrow}
                </p>
                {i === 0 ? (
                  <h1 className="text-5xl leading-[1.02] font-medium md:text-7xl">{slide.title}</h1>
                ) : (
                  <h2 className="text-5xl leading-[1.02] font-medium md:text-7xl">{slide.title}</h2>
                )}
                <p className="font-bengali text-lg opacity-90">{slide.titleBn}</p>
                <p className="max-w-md text-sm leading-relaxed opacity-75 md:text-base">{slide.body}</p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <Link
                    href={slide.primary.href}
                    className={cn(
                      "group inline-flex h-12 items-center gap-2 px-7 text-xs font-semibold tracking-[0.2em] uppercase transition",
                      light ? "bg-[#f6f1e7] text-[#13231e] hover:bg-white" : "bg-[#1d1a14] text-[#f6f1e7] hover:bg-black",
                    )}
                  >
                    {slide.primary.label}
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link
                    href={slide.secondary.href}
                    className={cn(
                      "inline-flex h-12 items-center border px-7 text-xs font-semibold tracking-[0.2em] uppercase transition",
                      light ? "border-[#f6f1e7]/40 hover:border-[#f6f1e7]" : "border-[#1d1a14]/30 hover:border-[#1d1a14]",
                    )}
                  >
                    {slide.secondary.label}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Controls */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-8 z-20 container mx-auto flex items-center justify-between px-4",
          slides[index].tone.text === "light" ? "text-[#f6f1e7]" : "text-[#1d1a14]",
        )}
      >
        <div className="flex items-center gap-4">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => go(i)}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === index}
              className="group flex flex-col gap-2 text-left"
            >
              <span className="text-[10px] font-medium tracking-[0.2em] opacity-70">0{i + 1}</span>
              <span className="relative block h-px w-14 overflow-hidden bg-current/25 md:w-20">
                {i === index && (
                  <span
                    key={`${index}-${paused}`}
                    className="absolute inset-0 origin-left bg-current"
                    style={{
                      animation: paused ? undefined : `ribat-progress ${INTERVAL_MS}ms linear forwards`,
                      transform: paused ? "scaleX(1)" : undefined,
                    }}
                  />
                )}
              </span>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="Previous slide"
            className="grid size-11 place-items-center rounded-full border border-current/30 transition hover:border-current"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Next slide"
            className="grid size-11 place-items-center rounded-full border border-current/30 transition hover:border-current"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
