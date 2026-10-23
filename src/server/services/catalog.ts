import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { categoryArt } from "@/config/category-art";
import type { Prisma } from "@/generated/prisma/client";
import type { CatalogCategory, CatalogProduct, ProductColor } from "@/lib/catalog/types";
import { toNumber } from "@/lib/money";
import { db } from "@/server/db";

/** Storefront catalog cache. Product/category mutations must call updateTag(catalogTag). */
export const catalogTag = "catalog";

const productInclude = {
  category: { select: { slug: true, name: true } },
  variants: {
    where: { isActive: true },
    orderBy: { position: "asc" },
    include: { options: { include: { attribute: { select: { slug: true } }, attributeValue: true } } },
  },
} satisfies Prisma.ProductInclude;

type ProductWithVariants = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

const optionValue = (v: ProductWithVariants["variants"][number], attribute: string) =>
  v.options.find((o) => o.attribute.slug === attribute)?.attributeValue ?? null;

export function toCatalogProduct(p: ProductWithVariants): CatalogProduct {
  const art = categoryArt(p.category?.slug);
  const colors: ProductColor[] = [];
  const sizes: string[] = [];
  const variants = p.variants.map((v) => {
    const color = optionValue(v, "color");
    const size = optionValue(v, "size");
    if (color && !colors.some((c) => c.name === color.value))
      colors.push({ name: color.value, hex: color.swatchHex ?? art.productColor });
    if (size && !sizes.includes(size.value)) sizes.push(size.value);
    return {
      id: v.id,
      sku: v.sku,
      color: color?.value ?? null,
      size: size?.value ?? null,
      price: toNumber(v.price),
      compareAtPrice: v.compareAtPrice ? toNumber(v.compareAtPrice) : null,
      stock: v.stock,
    };
  });
  const cheapest = variants.reduce<(typeof variants)[number] | undefined>(
    (min, v) => (!min || v.price < min.price ? v : min),
    undefined,
  );

  return {
    id: p.id,
    slug: p.slug,
    sku: variants[0]?.sku ?? "",
    name: p.name,
    nameBn: p.nameBn,
    category: p.category,
    art: art.kind,
    type: p.type,
    price: cheapest?.price ?? toNumber(p.minPrice),
    compareAtPrice: cheapest?.compareAtPrice ?? null,
    rating: toNumber(p.ratingAvg),
    reviewCount: p.reviewCount,
    colors,
    sizes,
    badge: p.badge,
    shortDescription: p.shortDescription,
    description: p.description,
    fabricCare: p.fabricCare,
    stock: variants.reduce((n, v) => n + v.stock, 0),
    isFeatured: p.isFeatured,
    createdAt: p.createdAt.toISOString(),
    variants,
  };
}

export async function getCategories(): Promise<CatalogCategory[]> {
  "use cache";
  cacheTag(catalogTag);
  cacheLife("hours");

  const rows = await db.category.findMany({
    where: { isActive: true },
    orderBy: { position: "asc" },
    include: { _count: { select: { products: { where: { status: "ACTIVE" } } } } },
  });
  return rows.map((c) => {
    const art = categoryArt(c.slug);
    return {
      slug: c.slug,
      name: c.name,
      nameBn: c.nameBn,
      description: c.description,
      productCount: c._count.products,
      art: art.kind,
      tone: art.tone,
    };
  });
}

export async function getCategory(slug: string) {
  return (await getCategories()).find((c) => c.slug === slug) ?? null;
}

export async function getActiveProducts(opts: { categorySlug?: string; featured?: boolean } = {}) {
  "use cache";
  cacheTag(catalogTag);
  cacheLife("hours");

  const rows = await db.product.findMany({
    where: {
      status: "ACTIVE",
      ...(opts.categorySlug && { category: { slug: opts.categorySlug } }),
      ...(opts.featured && { isFeatured: true }),
    },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    include: productInclude,
  });
  return rows.map(toCatalogProduct);
}

export async function getProductBySlug(slug: string) {
  "use cache";
  cacheTag(catalogTag);
  cacheLife("hours");

  const row = await db.product.findFirst({ where: { slug, status: "ACTIVE" }, include: productInclude });
  return row ? toCatalogProduct(row) : null;
}

export type SearchResult = {
  slug: string;
  name: string;
  nameBn: string | null;
  category: string | null;
  price: number;
  compareAtPrice: number | null;
  imageUrl: string | null;
  art: CatalogProduct["art"];
  color: string;
};

/** Header live search: active products whose name (EN/BN) or category matches. */
export async function searchProducts(query: string, limit = 8): Promise<SearchResult[]> {
  "use cache";
  cacheTag(catalogTag);
  cacheLife("hours");

  const q = query.trim();
  if (!q) return [];
  const rows = await db.product.findMany({
    where: {
      status: "ACTIVE",
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { nameBn: { contains: q, mode: "insensitive" } },
        { category: { name: { contains: q, mode: "insensitive" } } },
        { category: { slug: { contains: q, mode: "insensitive" } } },
      ],
    },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    take: limit,
    select: {
      slug: true,
      name: true,
      nameBn: true,
      minPrice: true,
      category: { select: { slug: true, name: true } },
      images: { orderBy: { position: "asc" }, take: 1, select: { url: true } },
      variants: { where: { isActive: true }, orderBy: { price: "asc" }, take: 1, select: { price: true, compareAtPrice: true } },
    },
  });
  return rows.map((p) => {
    const art = categoryArt(p.category?.slug);
    const cheapest = p.variants[0];
    return {
      slug: p.slug,
      name: p.name,
      nameBn: p.nameBn,
      category: p.category?.name ?? null,
      price: toNumber(cheapest?.price ?? p.minPrice),
      compareAtPrice: cheapest?.compareAtPrice ? toNumber(cheapest.compareAtPrice) : null,
      imageUrl: p.images[0]?.url ?? null,
      art: art.kind,
      color: art.productColor,
    };
  });
}
