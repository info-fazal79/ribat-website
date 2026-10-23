"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { GeometricPattern, Silhouette } from "@/components/storefront/art";
import type { HeroSlideSetting, SettingValue } from "@/lib/validations/settings";
import { cn } from "@/lib/utils";

type HeroSettings = SettingValue<"hero_slides">;

export function HeroSlider({ settings }: { settings: HeroSettings }) {
  const { slides, autoplay, pauseOnHover } = settings;
  const intervalMs = settings.interval * 1000;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const go = useCallback((next: number) => setIndex((next + slides.length) % slides.length), [slides.length]);
  const running = autoplay && !paused && slides.length > 1;

  useEffect(() => {
    if (!running || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setTimeout(() => go(index + 1), intervalMs);
    return () => window.clearTimeout(t);
  }, [index, running, go, intervalMs]);

  const pause = pauseOnHover ? () => setPaused(true) : undefined;
  const resume = pauseOnHover ? () => setPaused(false) : undefined;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured collections"
      className="relative h-[min(88vh,760px)] min-h-[560px] overflow-hidden"
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {slides.map((slide, i) => (
        <HeroSlideView
          key={slide.id}
          slide={slide}
          active={i === index}
          first={i === 0}
          label={`${i + 1} of ${slides.length}`}
          className={cn("absolute inset-0 transition-opacity duration-1000 ease-out", i === index ? "z-10 opacity-100" : "z-0 opacity-0")}
        />
      ))}

      {slides.length > 1 && (
        <div
          className={cn(
            "absolute inset-x-0 bottom-8 z-20 container mx-auto flex items-center justify-between px-4",
            slides[index].text === "light" ? "text-[#f6f1e7]" : "text-[#1d1a14]",
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
                <span className="text-[10px] font-medium tracking-[0.2em] opacity-70">{String(i + 1).padStart(2, "0")}</span>
                <span className="relative block h-px w-14 overflow-hidden bg-current/25 md:w-20">
                  {i === index && (
                    <span
                      key={`${index}-${running}`}
                      className="absolute inset-0 origin-left bg-current"
                      style={{
                        animation: running ? `ribat-progress ${intervalMs}ms linear forwards` : undefined,
                        transform: running ? undefined : "scaleX(1)",
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
      )}
    </section>
  );
}

function backgroundCss(bg: HeroSlideSetting["background"]) {
  if (bg.type === "solid") return bg.color;
  if (bg.type === "gradient") {
    return bg.direction === "radial"
      ? `radial-gradient(120% 90% at 75% 40%, ${bg.color} 0%, ${bg.color2} 100%)`
      : `linear-gradient(${bg.direction}, ${bg.color} 0%, ${bg.color2} 100%)`;
  }
  // Image/video: the colour shows while media loads.
  return bg.color;
}

/** One slide. Also used by the admin Hero Slider preview. */
export function HeroSlideView({
  slide,
  active,
  first = false,
  label,
  className,
}: {
  slide: HeroSlideSetting;
  active: boolean;
  first?: boolean;
  label?: string;
  className?: string;
}) {
  const light = slide.text === "light";
  const { background: bg, visual, accent } = slide;
  const media = bg.type === "image" ? bg.imageUrl : bg.type === "video" ? bg.videoUrl : "";
  const Heading = first ? "h1" : "h2";

  return (
    <div
      role="group"
      aria-roledescription="slide"
      aria-label={label}
      aria-hidden={!active}
      inert={!active}
      className={className}
      style={{ background: backgroundCss(bg) }}
    >
      {bg.type === "image" && media && (
        // eslint-disable-next-line @next/next/no-img-element -- media library asset
        <img
          src={media}
          alt=""
          fetchPriority={first ? "high" : undefined}
          className={cn("absolute inset-0 size-full object-cover transition-transform duration-[8000ms] ease-out", active ? "scale-105" : "scale-100")}
        />
      )}
      {bg.type === "video" && media && (
        <video
          src={media}
          autoPlay
          muted
          loop
          playsInline
          preload={first ? "auto" : "metadata"}
          poster={bg.imageUrl || undefined}
          className="absolute inset-0 size-full object-cover"
        />
      )}
      {media && bg.overlay > 0 && <div className="absolute inset-0 bg-black" style={{ opacity: bg.overlay / 100 }} />}
      {bg.pattern && <GeometricPattern color={accent} opacity={0.14} />}

      {/* Right-side visual: arch with the drawn garment or a real photo */}
      {visual.type !== "none" && (
        <div
          className={cn(
            "absolute top-[10%] right-[4%] bottom-0 hidden aspect-[3/4.2] overflow-hidden rounded-t-full border md:block lg:right-[8%]",
            "transition-all duration-[1400ms] ease-out",
            active ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
          )}
          style={{
            borderColor: `color-mix(in oklch, ${accent} 45%, transparent)`,
            background: `linear-gradient(180deg, color-mix(in oklch, ${accent} 16%, transparent), transparent 75%)`,
          }}
        >
          {visual.type === "image" && visual.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- media library asset
            <img
              src={visual.imageUrl}
              alt=""
              className={cn(
                "absolute inset-0 size-full transition-transform duration-[2000ms] ease-out",
                visual.fit === "cover" ? "object-cover" : "object-contain object-bottom p-[6%] pb-0",
                active ? "scale-100" : "scale-95",
              )}
            />
          ) : (
            visual.type === "illustration" && (
              <Silhouette
                kind={visual.art}
                fill={`color-mix(in oklch, ${accent} ${light ? 30 : 55}%, ${bg.color})`}
                stroke={accent}
                className={cn(
                  "absolute inset-x-0 bottom-[4%] mx-auto h-[82%] w-auto transition-transform duration-[2000ms] ease-out",
                  active ? "scale-100" : "scale-95",
                )}
              />
            )
          )}
        </div>
      )}

      <div className="relative z-10 container mx-auto flex h-full items-center px-4">
        <div
          className={cn(
            "max-w-xl space-y-6 transition-all delay-200 duration-1000 ease-out",
            active ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
            light ? "text-[#f6f1e7]" : "text-[#1d1a14]",
          )}
        >
          {slide.eyebrow && (
            <p className="text-[11px] font-medium tracking-[0.35em] uppercase" style={{ color: accent }}>
              {slide.eyebrow}
            </p>
          )}
          <Heading className="text-5xl leading-[1.02] font-medium md:text-7xl">{slide.title}</Heading>
          {slide.titleBn && <p className="font-bengali text-lg opacity-90">{slide.titleBn}</p>}
          {slide.body && <p className="max-w-md text-sm leading-relaxed opacity-75 md:text-base">{slide.body}</p>}
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href={slide.primary.url}
              className={cn(
                "group inline-flex h-12 items-center gap-2 px-7 text-xs font-semibold tracking-[0.2em] uppercase transition",
                light ? "bg-[#f6f1e7] text-[#13231e] hover:bg-white" : "bg-[#1d1a14] text-[#f6f1e7] hover:bg-black",
              )}
            >
              {slide.primary.label}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
            {slide.secondary.enabled && slide.secondary.label && slide.secondary.url && (
              <Link
                href={slide.secondary.url}
                className={cn(
                  "inline-flex h-12 items-center border px-7 text-xs font-semibold tracking-[0.2em] uppercase transition",
                  light ? "border-[#f6f1e7]/40 hover:border-[#f6f1e7]" : "border-[#1d1a14]/30 hover:border-[#1d1a14]",
                )}
              >
                {slide.secondary.label}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
