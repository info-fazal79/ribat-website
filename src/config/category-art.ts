import type { ArtKind } from "@/lib/catalog/types";

/**
 * Placeholder art per category slug, used until categories/products have
 * uploaded images (Category.imageUrl / ProductImage). Unknown slugs fall back.
 */
const art: Record<string, { kind: ArtKind; tone: { from: string; to: string; ink: string }; productColor: string }> = {
  panjabi: { kind: "panjabi", tone: { from: "#1f3b33", to: "#0f241e", ink: "#d8c08a" }, productColor: "#efe7d6" },
  abaya: { kind: "abaya", tone: { from: "#2a2522", to: "#151210", ink: "#cbb38a" }, productColor: "#151515" },
  thobe: { kind: "thobe", tone: { from: "#e9e1d3", to: "#d6cab4", ink: "#5b4a2f" }, productColor: "#f7f5ef" },
  casual: { kind: "casual", tone: { from: "#c9b79c", to: "#a8926f", ink: "#2b2418" }, productColor: "#d8ccb4" },
  fragrance: { kind: "fragrance", tone: { from: "#4a2f24", to: "#2a1a14", ink: "#e2c48e" }, productColor: "#8a5a2b" },
};

const fallback = art.casual;

export function categoryArt(slug: string | null | undefined) {
  return (slug && art[slug]) || fallback;
}
