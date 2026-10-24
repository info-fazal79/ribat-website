import Link from "next/link";
import { useId } from "react";
import { ArrowRight } from "lucide-react";
import { GeometricPattern, Silhouette } from "@/components/storefront/art";
import { HERO_SHAPES } from "@/components/storefront/home/hero-frame";
import type { HomeSectionOf } from "@/lib/validations/homepage";
import { cn } from "@/lib/utils";

type Promo = HomeSectionOf<"promo">;
export type PromoShape = Promo["frame"]["shape"];
type PromoBox = "standing" | "floating" | "square";

/** Eight-point star (khatam): outer points on r = 0.5, inner corners where the two squares cross. */
const starPath = (() => {
  const inner = (0.5 * Math.SQRT1_2) / Math.cos(Math.PI / 8);
  const points = Array.from({ length: 16 }, (_, i) => {
    const r = i % 2 ? inner : 0.5;
    const a = -Math.PI / 2 + (i * Math.PI) / 8;
    return `${(0.5 + r * Math.cos(a)).toFixed(4)},${(0.5 + r * Math.sin(a)).toFixed(4)}`;
  });
  return `M${points.join(" L")} Z`;
})();

/**
 * Frame shapes for the promo image. `path` is in a 0–1 box (SVG objectBoundingBox units) and is
 * both the clip and the outline; shapes with a CSS `radius` use border-radius instead, so the
 * mihrab stays a true semicircle at any width. `box`: "standing" frames rest on the banner's lower
 * edge, "floating" ones sit clear of it, "square" ones keep a 1:1 box.
 */
export const PROMO_SHAPES: Record<PromoShape, { label: string; box: PromoBox; path: string; radius?: string }> = {
  mihrab: { label: "Arch / Mihrab", box: "standing", path: HERO_SHAPES.islamic_arch.path, radius: "9999px 9999px 0 0" },
  moroccan: { label: "Moroccan Arch", box: "standing", path: HERO_SHAPES.moroccan_arch.path },
  pill: { label: "Pill", box: "floating", path: HERO_SHAPES.pill.path, radius: "9999px" },
  squircle: { label: "Squircle", box: "floating", path: HERO_SHAPES.squircle.path },
  octagon: { label: "Octagon", box: "floating", path: "M0.29,0 L0.71,0 L1,0.2 L1,0.8 L0.71,1 L0.29,1 L0,0.8 L0,0.2 Z" },
  star: { label: "Star-cut", box: "square", path: starPath },
  rectangle: { label: "Rectangle (no mask)", box: "standing", path: HERO_SHAPES.natural.path, radius: "0" },
};

/** Frame box per placement inside the image column (64% wide, or a centred 1:1 square). */
const BOX_CLASS: Record<PromoBox, Record<Promo["frame"]["align"], string>> = {
  standing: {
    start: "top-[10%] bottom-0 left-[6%] right-[30%]",
    center: "top-[10%] bottom-0 inset-x-[18%]",
    end: "top-[10%] bottom-0 left-[30%] right-[6%]",
  },
  floating: {
    start: "inset-y-[10%] left-[6%] right-[30%]",
    center: "inset-y-[10%] inset-x-[18%]",
    end: "inset-y-[10%] left-[30%] right-[6%]",
  },
  square: {
    start: "top-1/2 left-[6%] -translate-y-1/2",
    center: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
    end: "top-1/2 right-[6%] -translate-y-1/2",
  },
};

const LIGHT_INK = "#f6f1e7";
const DARK_INK = "#1d1a14";

function backgroundCss(bg: Promo["background"]) {
  if (bg.type === "gradient") {
    return bg.gradient === "radial"
      ? `radial-gradient(120% 90% at 75% 40%, ${bg.color} 0%, ${bg.color2} 100%)`
      : `linear-gradient(${bg.angle}deg, ${bg.color}, ${bg.color2})`;
  }
  // Solid, or the colour shown while an image/video loads.
  return bg.color;
}

function frameShadow(shadow: Promo["frame"]["shadow"], accent: string) {
  switch (shadow) {
    case "soft":
      return "drop-shadow(0 18px 30px rgba(0,0,0,0.28))";
    case "elevated":
      return "drop-shadow(0 40px 50px rgba(0,0,0,0.45)) drop-shadow(0 8px 12px rgba(0,0,0,0.25))";
    case "glow":
      return `drop-shadow(0 0 32px color-mix(in oklch, ${accent} 60%, transparent))`;
    case "none":
      return undefined;
  }
}

export function EditorialBanner({ section }: { section: Promo }) {
  const lines = section.title.split("\n");
  const { background: bg, accent } = section;
  const light = section.text === "light";
  const media = bg.type === "image" ? bg.imageUrl : bg.type === "video" ? bg.videoUrl : "";
  return (
    <section className="container mx-auto px-4">
      <div
        className="relative grid overflow-hidden md:grid-cols-2"
        style={{ background: backgroundCss(bg), color: light ? LIGHT_INK : DARK_INK }}
      >
        {bg.type === "image" && media && (
          // eslint-disable-next-line @next/next/no-img-element -- media library asset
          <img src={media} alt="" className="absolute inset-0 size-full" style={{ objectFit: bg.size, objectPosition: bg.position }} />
        )}
        {bg.type === "video" && media && (
          <video
            key={media}
            src={media}
            poster={bg.posterUrl || undefined}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden
            className="absolute inset-0 size-full object-cover"
          />
        )}
        {bg.overlay > 0 && <div aria-hidden className="absolute inset-0" style={{ background: bg.overlayColor, opacity: bg.overlay / 100 }} />}
        {bg.pattern && <GeometricPattern color={accent} opacity={0.16} />}
        <div className={cn("relative z-10 flex flex-col justify-center gap-5 p-10 md:p-16", section.imagePosition === "left" && "md:order-2")}>
          {section.eyebrow && (
            <p className="text-[11px] font-medium tracking-[0.35em] uppercase" style={{ color: accent }}>
              {section.eyebrow}
            </p>
          )}
          <h2 className="text-4xl leading-tight font-medium md:text-6xl">
            {lines.map((line, i) => (
              <span key={i}>
                {i > 0 && <br />}
                {line}
              </span>
            ))}
          </h2>
          {section.titleBn && <p className="font-bengali text-base opacity-90">{section.titleBn}</p>}
          {section.body && <p className="max-w-md text-sm leading-relaxed opacity-75">{section.body}</p>}
          {(section.ctaLabel || section.note) && (
            <div className="flex flex-wrap items-center gap-6 pt-2">
              {section.ctaLabel && section.ctaUrl && <PromoButton section={section} />}
              {section.note && <span className="text-xs tracking-wider opacity-70">{section.note}</span>}
            </div>
          )}
        </div>
        <PromoFrame section={section} />
      </div>
    </section>
  );
}

function PromoButton({ section }: { section: Promo }) {
  const style = section.ctaStyle;
  return (
    <Link
      href={section.ctaUrl}
      style={{ "--cta": section.accent } as React.CSSProperties}
      className={cn(
        "group inline-flex items-center gap-2 text-xs font-semibold tracking-[0.2em] uppercase transition",
        style === "solid" && "h-12 bg-(--cta) px-7 text-[#13231e] hover:bg-[color-mix(in_oklch,var(--cta),white_30%)]",
        style === "outline" && "h-12 border border-(--cta) px-7 hover:bg-[color-mix(in_oklch,var(--cta)_15%,transparent)]",
        style === "link" && "text-(--cta) underline decoration-current/40 underline-offset-8 hover:decoration-current",
      )}
    >
      {section.ctaLabel}
      <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
    </Link>
  );
}

/** The image column: shaped, outlined frame with the photo (or the drawn garment). */
function PromoFrame({ section }: { section: Promo }) {
  const clipId = `promo-clip-${useId().replace(/:/g, "")}`;
  const { frame, accent, imageUrl } = section;
  const shape = PROMO_SHAPES[frame.shape];
  const standing = shape.box === "standing";
  const stroke =
    frame.border === "accent" ? `color-mix(in oklch, ${accent} 40%, transparent)` : frame.border === "white" ? "rgb(255 255 255 / 0.5)" : undefined;
  const tint = `linear-gradient(180deg, color-mix(in oklch, ${accent} 18%, transparent), transparent 80%)`;

  const silhouette = (className: string) => (
    <Silhouette kind="panjabi" fill="#d9c39a" stroke="rgba(60,47,25,0.5)" className={cn("absolute inset-x-0 mx-auto w-auto drop-shadow-[0_20px_30px_rgba(0,0,0,0.35)]", className)} />
  );
  const content = imageUrl ? (
    // eslint-disable-next-line @next/next/no-img-element -- media library asset
    <img
      src={imageUrl}
      alt=""
      className={cn(
        "absolute inset-0 size-full",
        section.imageFit === "cover"
          ? "object-cover"
          : cn("object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.35)]", standing ? "object-bottom p-[6%] pb-0" : "p-[8%]"),
      )}
    />
  ) : (
    // Standing frames let the garment overflow the frame as before; closed shapes keep it inside.
    !standing && silhouette("bottom-[8%] h-[80%]")
  );

  return (
    <div className="relative min-h-80 md:min-h-[520px]">
      <div
        className={cn("absolute", BOX_CLASS[shape.box][frame.align], shape.box === "square" && "aspect-square h-[80%] max-w-[88%]")}
        style={{ filter: frameShadow(frame.shadow, accent) }}
      >
        {shape.radius !== undefined ? (
          <div
            className={cn("absolute inset-0 overflow-hidden", stroke && "border")}
            style={{ borderRadius: shape.radius, borderColor: stroke, background: tint }}
          >
            {content}
          </div>
        ) : (
          <>
            <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `url(#${clipId})`, background: tint }}>
              {content}
            </div>
            <svg aria-hidden className="pointer-events-none absolute inset-0 size-full overflow-visible" viewBox="0 0 1 1" preserveAspectRatio="none">
              <defs>
                <clipPath id={clipId} clipPathUnits="objectBoundingBox">
                  <path d={shape.path} />
                </clipPath>
              </defs>
              {stroke && <path d={shape.path} fill="none" stroke={stroke} strokeWidth={1} vectorEffect="non-scaling-stroke" />}
            </svg>
          </>
        )}
      </div>
      {!imageUrl && standing && silhouette("bottom-[4%] h-[80%]")}
    </div>
  );
}
