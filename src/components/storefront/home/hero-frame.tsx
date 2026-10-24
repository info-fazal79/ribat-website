import { useId } from "react";
import type { HeroSlideSetting } from "@/lib/validations/settings";
import { cn } from "@/lib/utils";

type Visual = HeroSlideSetting["visual"];
export type HeroShape = Visual["shape"];
export type HeroEffect = Visual["effect"];

/**
 * Frame shapes as paths in a 0–1 box (SVG objectBoundingBox units), so one path both clips the
 * visual and draws its outline at any size. The frame box is 3:4.2, so a y-radius of 0.357 makes
 * a true semicircle across the full width. `floating` shapes are closed at the bottom and sit
 * clear of the slide's lower edge; the others stand on it.
 */
export const HERO_SHAPES: Record<HeroShape, { label: string; path: string; floating: boolean }> = {
  islamic_arch: {
    label: "Islamic Dome",
    path: "M0,1 L0,0.357 A0.5,0.357 0 0 1 1,0.357 L1,1 Z",
    floating: false,
  },
  moroccan_arch: {
    label: "Moroccan Arch",
    path: "M0,1 L0,0.42 C0,0.3 0.09,0.22 0.21,0.24 C0.23,0.1 0.37,0.03 0.5,0 C0.63,0.03 0.77,0.1 0.79,0.24 C0.91,0.22 1,0.3 1,0.42 L1,1 Z",
    floating: false,
  },
  squircle: {
    label: "Squircle",
    path: "M0.22,0 L0.78,0 C0.95,0 1,0.05 1,0.16 L1,0.84 C1,0.95 0.95,1 0.78,1 L0.22,1 C0.05,1 0,0.95 0,0.84 L0,0.16 C0,0.05 0.05,0 0.22,0 Z",
    floating: true,
  },
  pill: {
    label: "Pill",
    path: "M0,0.357 A0.5,0.357 0 0 1 1,0.357 L1,0.643 A0.5,0.357 0 0 1 0,0.643 Z",
    floating: true,
  },
  rounded_card: {
    // Rendered with CSS radius + padding; the path is for the admin thumbnail.
    label: "Floating Card",
    path: "M0.12,0 L0.88,0 Q1,0 1,0.086 L1,0.914 Q1,1 0.88,1 L0.12,1 Q0,1 0,0.914 L0,0.086 Q0,0 0.12,0 Z",
    floating: true,
  },
  diagonal_cut: {
    // 0.14 of the width equals 0.1 of the height, so the chamfers are 45°.
    label: "Diagonal Cut",
    path: "M0.14,0 L1,0 L1,0.9 L0.86,1 L0,1 L0,0.1 Z",
    floating: true,
  },
  natural: {
    label: "Natural (no frame)",
    path: "M0,0 L1,0 L1,1 L0,1 Z",
    floating: false,
  },
};

export const HERO_EFFECTS: Record<HeroEffect, string> = {
  none: "None (static)",
  light_sheen: "Light sheen (diagonal glint)",
  ambient_glow: "Ambient glow (breathing backlight)",
  subtle_float: "Subtle float (gentle hover)",
  cinematic_zoom: "Cinematic zoom (slow scale-in)",
};

/** The slide's right-side visual: shaped frame, photo (or `children` fallback art) and effect. */
export function HeroFrame({
  visual,
  photo,
  alt,
  accent,
  active,
  first,
  outline,
  className,
  children,
}: {
  visual: Pick<Visual, "shape" | "effect" | "fit">;
  photo: string;
  alt: string;
  accent: string;
  active: boolean;
  first: boolean;
  /** Outline colour; defaults to the accent at 45%. "transparent" hides it. */
  outline?: string;
  /** Replaces the hero placement (right-aligned, slide-height); the box must keep the 3:4.2 ratio. */
  className?: string;
  /** Fallback art when there is no photo. */
  children: React.ReactNode;
}) {
  const clipId = `hero-clip-${useId().replace(/:/g, "")}`;
  const { shape, effect } = visual;
  const { path, floating } = HERO_SHAPES[shape];
  const natural = shape === "natural";
  const card = shape === "rounded_card";
  // Only the visible slide animates; reduced-motion users get the static frame.
  const animate = (on: boolean, cls: string) => on && active && cls;
  const border = outline ?? `color-mix(in oklch, ${accent} 45%, transparent)`;
  const tint = natural ? undefined : `linear-gradient(180deg, color-mix(in oklch, ${accent} 16%, transparent), transparent 75%)`;

  const contain = natural || visual.fit === "contain";
  const zoom = effect === "cinematic_zoom";
  const media = (
    <div
      className={cn(
        "absolute inset-0 transition-transform ease-out",
        zoom ? "duration-[7000ms] will-change-transform" : "duration-[2000ms]",
        active ? "scale-100" : zoom ? "scale-[1.18]" : "scale-95",
      )}
    >
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element -- media library / product asset
        <img
          src={photo}
          alt={alt}
          fetchPriority={first ? "high" : undefined}
          className={cn(
            "absolute inset-0 size-full",
            !contain
              ? "object-cover"
              : cn(
                  "object-contain drop-shadow-[0_18px_28px_rgba(0,0,0,0.28)] lg:drop-shadow-[0_28px_44px_rgba(0,0,0,0.32)]",
                  floating ? "p-[7%]" : "object-bottom p-[6%] pb-0",
                ),
          )}
        />
      ) : (
        children
      )}
      {effect === "light_sheen" && (photo || !natural) && (
        <div
          aria-hidden
          className={cn("pointer-events-none absolute inset-0 overflow-hidden", natural && "pt-[6%] pr-[6%] pl-[6%]")}
          style={
            // With no frame, the glint follows the cut-out's own silhouette (same box as the <img>).
            natural
              ? {
                  maskImage: `url(${JSON.stringify(photo)})`,
                  maskSize: "contain",
                  maskRepeat: "no-repeat",
                  maskPosition: "bottom",
                  maskOrigin: "content-box",
                  maskClip: "content-box",
                }
              : undefined
          }
        >
          <span
            className={cn(
              "absolute -top-1/2 left-0 h-[200%] w-[38%] will-change-transform",
              "bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.08)_30%,rgba(255,255,255,0.42)_50%,rgba(255,255,255,0.08)_70%,transparent)]",
              animate(true, "motion-safe:animate-[ribat-sheen_4.5s_ease-in-out_0.8s_infinite]"),
            )}
            style={{ transform: "translate(-180%, -20%) rotate(20deg)" }}
          />
        </div>
      )}
    </div>
  );

  return (
    <div
      className={cn(
        className ?? [
          // Right-aligned in its grid cell, which ends exactly at the hero container's content edge.
          "absolute right-0 aspect-[3/4.2]",
          floating ? "top-[9%] bottom-[14%]" : "top-[10%] bottom-0",
        ],
        "transition-[opacity,translate] duration-[1400ms] ease-out",
        active ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
      )}
    >
      {effect === "ambient_glow" && (
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute -inset-[14%] opacity-60 blur-3xl will-change-transform",
            animate(true, "motion-safe:animate-[ribat-glow_5s_ease-in-out_infinite]"),
          )}
          style={{
            background: `radial-gradient(closest-side, color-mix(in oklch, ${accent} 75%, transparent), color-mix(in oklch, #1f6b52 50%, transparent) 60%, transparent)`,
          }}
        />
      )}
      <div
        className={cn(
          "relative size-full",
          effect === "subtle_float" && "will-change-transform",
          animate(effect === "subtle_float", "motion-safe:animate-[ribat-float_6s_ease-in-out_infinite]"),
        )}
      >
        {natural ? (
          <div className="absolute inset-0">{media}</div>
        ) : card ? (
          <div
            className="absolute inset-0 rounded-[28px] border p-[3.5%] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.5)] backdrop-blur-sm"
            style={{ borderColor: border, background: `color-mix(in oklch, ${accent} 12%, rgb(255 255 255 / 0.06))` }}
          >
            <div className="relative size-full overflow-hidden rounded-[20px]" style={{ background: tint }}>
              {media}
            </div>
          </div>
        ) : (
          <>
            <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `url(#${clipId})`, background: tint }}>
              {media}
            </div>
            <svg aria-hidden className="pointer-events-none absolute inset-0 size-full overflow-visible" viewBox="0 0 1 1" preserveAspectRatio="none">
              <defs>
                <clipPath id={clipId} clipPathUnits="objectBoundingBox">
                  <path d={path} />
                </clipPath>
              </defs>
              <path d={path} fill="none" stroke={border} strokeWidth={1} vectorEffect="non-scaling-stroke" />
            </svg>
          </>
        )}
      </div>
    </div>
  );
}
