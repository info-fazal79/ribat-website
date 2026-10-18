/**
 * Serializable catalog shapes returned by src/server/services/catalog.ts and
 * consumed by storefront (client) components. Money is a display-only number —
 * checkout always recomputes from variant IDs on the server.
 */

/** Silhouette used by placeholder art until real product photography exists. */
export type ArtKind = "panjabi" | "abaya" | "thobe" | "casual" | "fragrance";

export type ProductColor = { name: string; hex: string };

export type CatalogVariant = {
  id: string;
  sku: string;
  color: string | null;
  size: string | null;
  price: number;
  compareAtPrice: number | null;
  stock: number;
};

export type CatalogProduct = {
  id: string;
  slug: string;
  sku: string;
  name: string;
  nameBn: string | null;
  category: { slug: string; name: string } | null;
  art: ArtKind;
  type: "SIMPLE" | "VARIABLE";
  /** Lowest active variant price, and that variant's compare-at price. */
  price: number;
  compareAtPrice: number | null;
  rating: number;
  reviewCount: number;
  colors: ProductColor[];
  sizes: string[];
  badge: string | null;
  shortDescription: string | null;
  description: string | null;
  fabricCare: string | null;
  stock: number;
  isFeatured: boolean;
  createdAt: string;
  /** Active variants only. */
  variants: CatalogVariant[];
};

export type CatalogCategory = {
  slug: string;
  name: string;
  nameBn: string | null;
  description: string | null;
  productCount: number;
  art: ArtKind;
  tone: { from: string; to: string; ink: string };
};

/** Variant matching the selected colour/size (nulls match products without that option). */
export function findVariant(product: CatalogProduct, color: string | null, size: string | null) {
  return product.variants.find(
    (v) => (product.colors.length === 0 || v.color === color) && (product.sizes.length === 0 || v.size === size),
  );
}
