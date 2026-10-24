import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GeometricPattern, Silhouette } from "@/components/storefront/art";
import { HeroFrame } from "@/components/storefront/home/hero-frame";
import type { HomeSectionOf } from "@/lib/validations/homepage";
import { cn } from "@/lib/utils";

type Promo = HomeSectionOf<"promo">;
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

const JUSTIFY: Record<Promo["frame"]["align"], string> = { start: "md:justify-start", center: "md:justify-center", end: "md:justify-end" };

/**
 * The image column: the Hero Slider's own frame (same shapes, outline, sheen and effects) in a
 * width-capped 3:4.2 portrait box, so it never stretches with the column.
 */
function PromoFrame({ section }: { section: Promo }) {
  const { frame, accent, imageUrl } = section;
  const outline = frame.border === "white" ? "rgb(255 255 255 / 0.5)" : frame.border === "none" ? "transparent" : undefined;
  return (
    <div className={cn("relative flex items-center justify-center px-10 pb-12 md:px-12 md:py-16", JUSTIFY[frame.align])}>
      <div className="relative aspect-[3/4.2] w-full max-w-[280px] sm:max-w-[320px] lg:max-w-[380px]" style={{ filter: frameShadow(frame.shadow, accent) }}>
        <HeroFrame
          className="absolute inset-0"
          visual={{ shape: frame.shape, effect: frame.effect, fit: section.imageFit }}
          photo={imageUrl}
          alt=""
          accent={accent}
          outline={outline}
          active
          first={false}
        >
          <Silhouette
            kind="panjabi"
            fill="#d9c39a"
            stroke="rgba(60,47,25,0.5)"
            className="absolute inset-x-0 bottom-[4%] mx-auto h-[82%] w-auto drop-shadow-[0_20px_30px_rgba(0,0,0,0.35)]"
          />
        </HeroFrame>
      </div>
    </div>
  );
}
