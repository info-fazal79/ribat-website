import type { CatalogProduct } from "@/lib/catalog/types";
import type { HeroSlideSetting } from "@/lib/validations/settings";

/** The slice of a published product a hero slide needs (serializable, client-safe). */
export type HeroProduct = {
  id: string;
  slug: string;
  name: string;
  nameBn: string | null;
  badge: string | null;
  shortDescription: string | null;
  price: number;
  compareAtPrice: number | null;
  /** Featured image (first gallery photo), or "" when the product has none. */
  image: string;
};

export const toHeroProduct = (p: CatalogProduct): HeroProduct => ({
  id: p.id,
  slug: p.slug,
  name: p.name,
  nameBn: p.nameBn,
  badge: p.badge,
  shortDescription: p.shortDescription,
  price: p.price,
  compareAtPrice: p.compareAtPrice,
  image: p.images[0]?.url ?? "",
});

export const productHref = (p: Pick<HeroProduct, "slug">) => `/products/${p.slug}`;

/**
 * Fills a "Linked Product" slide from its product: headline, badge, photo and primary link,
 * unless the admin overrode the headline/badge. Custom slides, and linked slides whose product
 * is no longer published, render their stored fields as-is.
 */
export function resolveHeroSlide(
  slide: HeroSlideSetting,
  products: readonly HeroProduct[],
): { slide: HeroSlideSetting; product: HeroProduct | null } {
  if (slide.mode !== "product") return { slide, product: null };
  const product = products.find((p) => p.id === slide.product.id);
  if (!product) return { slide, product: null };
  return {
    product,
    slide: {
      ...slide,
      title: slide.product.overrideTitle ? slide.title : product.name,
      titleBn: slide.product.overrideTitle ? slide.titleBn : (product.nameBn ?? ""),
      body: slide.product.overrideTitle ? slide.body : (product.shortDescription ?? ""),
      eyebrow: slide.product.overrideBadge ? slide.eyebrow : (product.badge ?? "Featured"),
      primary: { ...slide.primary, url: productHref(product) },
      visual: product.image
        ? { ...slide.visual, type: "image", imageUrl: product.image }
        : { ...slide.visual, type: slide.visual.type === "none" ? "none" : "image", imageUrl: "" },
    },
  };
}
