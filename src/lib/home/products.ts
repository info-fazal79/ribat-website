import type { CatalogProduct } from "@/lib/catalog/types";
import type { productSources } from "@/lib/validations/homepage";

/** Most products a single widget ships to the client (load more / pagination page through these). */
export const MAX_WIDGET_PRODUCTS = 48;

/**
 * Products for a grid/slider widget, from the catalog (already featured-first, then newest).
 * "trending" puts recent best sellers first and keeps the rest after them, so it is never empty.
 */
export function productsForSource(
  source: (typeof productSources)[number],
  categorySlug: string,
  products: CatalogProduct[],
  trendingIds: string[],
): CatalogProduct[] {
  let pool: CatalogProduct[];
  switch (source) {
    case "featured":
      pool = products.filter((p) => p.isFeatured);
      break;
    case "category":
      pool = products.filter((p) => p.category?.slug === categorySlug);
      break;
    case "trending": {
      const rank = new Map(trendingIds.map((id, i) => [id, i]));
      pool = [...products].sort((a, b) => (rank.get(a.id) ?? Infinity) - (rank.get(b.id) ?? Infinity));
      break;
    }
    case "all":
      pool = products;
      break;
  }
  return pool.slice(0, MAX_WIDGET_PRODUCTS);
}
