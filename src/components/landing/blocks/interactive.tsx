"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Img } from "@/components/landing/blocks/media";
import { cn } from "@/lib/utils";

/** Large image with swipe/arrow navigation and a clickable thumbnail strip. */
export function GallerySlider({ images }: { images: { url: string; alt: string }[] }) {
  const [rawIndex, setIndex] = useState(0);
  // Clamp: the builder can remove images while a later one is showing.
  const index = Math.min(rawIndex, images.length - 1);
  const touchX = useRef<number | null>(null);
  const go = (i: number) => setIndex((i + images.length) % images.length);

  return (
    <div className="mx-auto max-w-3xl space-y-3">
      <div
        className="group relative aspect-square overflow-hidden rounded-3xl bg-card shadow-lg @3xl:aspect-[4/3]"
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
          touchX.current = null;
        }}
      >
        {images.map((img, i) => (
          <Img
            key={img.url}
            src={img.url}
            alt={img.alt}
            className={cn(
              "absolute inset-0 size-full object-cover transition-[opacity,transform] duration-500 ease-out",
              i === index ? "scale-100 opacity-100" : "pointer-events-none scale-[1.03] opacity-0",
            )}
          />
        ))}
        {images.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={() => go(index - 1)}
              className="absolute top-1/2 left-3 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-background/85 shadow backdrop-blur transition hover:bg-background"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={() => go(index + 1)}
              className="absolute top-1/2 right-3 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-background/85 shadow backdrop-blur transition hover:bg-background"
            >
              <ChevronRight className="size-5" />
            </button>
            <span className="absolute right-3 bottom-3 rounded-full bg-black/55 px-2.5 py-0.5 font-sans text-xs text-white tabular-nums">
              {index + 1} / {images.length}
            </span>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          {images.map((img, i) => (
            <button
              key={img.url}
              type="button"
              aria-label={`Show image ${i + 1}`}
              aria-current={i === index}
              onClick={() => setIndex(i)}
              className={cn(
                "size-16 shrink-0 overflow-hidden rounded-xl border-2 transition @3xl:size-20",
                i === index ? "border-primary" : "border-transparent opacity-60 hover:opacity-100",
              )}
            >
              <Img src={img.url} alt="" className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Horizontal snap carousel with prev/next buttons (scrolls one card at a time). */
export function SnapCarousel({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) => {
    const el = ref.current;
    const card = el?.firstElementChild as HTMLElement | null;
    if (el && card) el.scrollBy({ left: dir * (card.offsetWidth + 16), behavior: "smooth" });
  };
  return (
    <div className="relative">
      <div ref={ref} className={cn("-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-5 px-5 pb-2 [scrollbar-width:none]", className)}>
        {children}
      </div>
      <div className="mt-4 flex justify-center gap-2">
        {([-1, 1] as const).map((dir) => (
          <button
            key={dir}
            type="button"
            aria-label={dir < 0 ? "Previous" : "Next"}
            onClick={() => scroll(dir)}
            className="grid size-10 place-items-center rounded-full border bg-card shadow-sm transition hover:border-primary"
          >
            {dir < 0 ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />}
          </button>
        ))}
      </div>
    </div>
  );
}
