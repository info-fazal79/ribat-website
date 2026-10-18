import { useId } from "react";
import type { CategorySlug } from "@/lib/mock/catalog";
import { cn } from "@/lib/utils";

/**
 * Placeholder art used until real product photography is uploaded.
 * Studio-style backdrop + a garment silhouette tinted with the selected colour,
 * so swatch selection visibly changes the "photo".
 */

// viewBox 0 0 100 130
const silhouettes: Record<CategorySlug, { body: string; details: string }> = {
  panjabi: {
    body: "M38 14 L50 18 L62 14 L80 22 L93 58 L83 62 L74 42 L75 108 L25 108 L26 42 L17 62 L7 58 L20 22 Z",
    details: "M50 18 L50 46 M47 24 h6 M47 31 h6 M47 38 h6",
  },
  thobe: {
    body: "M39 12 L50 15 L61 12 L79 20 L92 60 L82 64 L73 42 L74 124 L26 124 L27 42 L18 64 L8 60 L21 20 Z",
    details: "M50 15 L50 40 M50 40 l0 10 M66 70 l0 14 M34 70 l0 14",
  },
  abaya: {
    body: "M41 12 L50 15 L59 12 L77 20 L97 74 L87 78 L71 42 L86 125 L14 125 L29 42 L13 78 L3 74 L23 20 Z",
    details: "M50 15 L50 125 M33 100 q17 6 34 0",
  },
  casual: {
    body: "M38 22 L50 26 L62 22 L80 30 L92 60 L82 64 L74 48 L75 98 L25 98 L26 48 L18 64 L8 60 L20 30 Z",
    details: "M50 26 L50 46 M44 26 L50 34 L56 26",
  },
  fragrance: {
    body: "M41 22 h18 v14 h-18 Z M45 36 h10 v8 h-10 Z M30 44 h40 q9 0 9 9 v52 q0 11 -11 11 h-36 q-11 0 -11 -11 v-52 q0 -9 9 -9 Z",
    details: "M30 70 h40 M34 82 h32",
  },
};

/** Relative luminance (0–1) of a #rrggbb colour. */
function luminance(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function GeometricPattern({ color, opacity = 0.12, className }: { color: string; opacity?: number; className?: string }) {
  const id = useId();
  return (
    <svg aria-hidden className={cn("pointer-events-none absolute inset-0 size-full", className)}>
      <defs>
        <pattern id={id} width="56" height="56" patternUnits="userSpaceOnUse">
          {/* Eight-point star (khatam) lattice */}
          <g fill="none" stroke={color} strokeWidth="0.8" opacity={opacity}>
            <rect x="16" y="16" width="24" height="24" />
            <rect x="16" y="16" width="24" height="24" transform="rotate(45 28 28)" />
            <path d="M0 28 H11 M45 28 H56 M28 0 V11 M28 45 V56" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

export function Silhouette({
  category,
  fill,
  stroke,
  className,
}: {
  category: CategorySlug;
  fill: string;
  stroke: string;
  className?: string;
}) {
  const id = useId();
  const shape = silhouettes[category];
  return (
    <svg viewBox="0 0 100 130" aria-hidden className={className}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={fill} />
          <stop offset="1" stopColor={`color-mix(in oklch, ${fill} 78%, black)`} />
        </linearGradient>
      </defs>
      <path d={shape.body} fill={`url(#${id})`} stroke={stroke} strokeWidth="0.6" strokeLinejoin="round" />
      <path d={shape.details} fill="none" stroke={stroke} strokeWidth="0.6" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

/** Studio "product shot": soft backdrop, arch frame, tinted garment, floor shadow. */
export function ProductArt({
  category,
  color,
  className,
}: {
  category: CategorySlug;
  color: string;
  className?: string;
}) {
  const light = luminance(color) > 0.55;
  const stroke = light ? "rgba(60,48,30,0.45)" : "rgba(255,248,235,0.28)";
  return (
    <div
      className={cn("relative isolate overflow-hidden bg-[linear-gradient(170deg,#f4efe6_0%,#e7dfd0_100%)]", className)}
    >
      <GeometricPattern color="#8a7650" opacity={0.18} />
      {/* Arch window */}
      <div className="absolute inset-x-[14%] top-[8%] bottom-[10%] rounded-t-full bg-[linear-gradient(180deg,rgba(255,255,255,0.55),rgba(255,255,255,0.08))]" />
      {/* Floor shadow */}
      <div className="absolute bottom-[7%] left-1/2 h-[4%] w-[48%] -translate-x-1/2 rounded-[50%] bg-black/15 blur-md" />
      <Silhouette
        category={category}
        fill={color}
        stroke={stroke}
        className="absolute inset-x-0 bottom-[8%] mx-auto h-[78%] w-auto drop-shadow-[0_10px_18px_rgba(40,30,15,0.18)] transition-transform duration-700 ease-out group-hover/art:scale-[1.04]"
      />
    </div>
  );
}

/** Editorial tile: deep tone, geometric pattern, oversized ink silhouette. */
export function EditorialArt({
  category,
  tone,
  className,
}: {
  category: CategorySlug;
  tone: { from: string; to: string; ink: string };
  className?: string;
}) {
  return (
    <div
      className={cn("absolute inset-0 isolate overflow-hidden", className)}
      style={{ background: `linear-gradient(160deg, ${tone.from} 0%, ${tone.to} 100%)` }}
    >
      <GeometricPattern color={tone.ink} opacity={0.22} />
      <Silhouette
        category={category}
        fill={`color-mix(in oklch, ${tone.ink} 22%, transparent)`}
        stroke={tone.ink}
        className="absolute right-[-6%] bottom-[-4%] h-[92%] w-auto opacity-80 transition-transform duration-700 ease-out group-hover:scale-105"
      />
    </div>
  );
}
