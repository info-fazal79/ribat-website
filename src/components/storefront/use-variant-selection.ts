"use client";

import { useState } from "react";
import { toast } from "sonner";
import { categoryArt } from "@/config/category-art";
import { cart } from "@/lib/cart/store";
import { findVariant, type CatalogProduct } from "@/lib/catalog/types";

/** Colour/size selection shared by the product card and product page. */
export function useVariantSelection(product: CatalogProduct) {
  const [colorIndex, setColorIndex] = useState(() => {
    // Start on the first colour that has stock.
    const i = product.colors.findIndex((c) => product.variants.some((v) => v.color === c.name && v.stock > 0));
    return Math.max(0, i);
  });
  const [size, setSize] = useState<string | null>(null);

  const color = product.colors[colorIndex] ?? null;
  const swatch = color ?? { name: "", hex: categoryArt(product.category?.slug).productColor };
  const needsSize = product.sizes.length > 0;
  const variant = needsSize && !size ? null : (findVariant(product, color?.name ?? null, size) ?? null);
  /** Variant used for price display: the exact match, else the cheapest in the selected colour. */
  const priced =
    variant ??
    product.variants
      .filter((v) => !color || v.color === color.name)
      .reduce<CatalogProduct["variants"][number] | null>((min, v) => (!min || v.price < min.price ? v : min), null);

  const sizeInStock = (s: string) => (findVariant(product, color?.name ?? null, s)?.stock ?? 0) > 0;
  const soldOut = product.variants.every((v) => v.stock <= 0);

  function selectColor(i: number) {
    setColorIndex(i);
    // Keep the size only if it's still available in the new colour.
    if (size && (findVariant(product, product.colors[i]?.name ?? null, size)?.stock ?? 0) <= 0) setSize(null);
  }

  /** Adds the selected variant; returns false (and toasts) if selection is incomplete or out of stock. */
  function addToCart(quantity: number, open: boolean) {
    if (needsSize && !size) {
      toast.error("Please select a size first");
      return false;
    }
    if (!variant || variant.stock <= 0) {
      toast.error("This option is out of stock");
      return false;
    }
    cart.add(
      {
        variantId: variant.id,
        productId: product.id,
        slug: product.slug,
        name: product.name,
        art: product.art,
        color: swatch,
        size,
        price: variant.price,
        compareAtPrice: variant.compareAtPrice,
      },
      Math.min(quantity, variant.stock),
      { open },
    );
    return true;
  }

  return { colorIndex, color, swatch, size, setSize, selectColor, variant, priced, needsSize, sizeInStock, soldOut, addToCart };
}
