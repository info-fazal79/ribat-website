/** Shared by the seed and the product service — keep free of server-only imports. */

/** "Dusty Rose" → "dusty-rose", "XL" → "xl" (AttributeValue.slug). */
export function valueSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-");
}

/** ProductVariant.optionKey: sorted attribute value IDs joined with "|" ("default" for simple products). */
export function optionKeyFor(attributeValueIds: string[]) {
  return attributeValueIds.length ? [...attributeValueIds].sort().join("|") : "default";
}

/** "Black / XL" */
export function variantTitle(color: string | null, size: string | null) {
  return [color, size].filter(Boolean).join(" / ") || "Default";
}
