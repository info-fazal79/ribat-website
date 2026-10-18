import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { categoryArt } from "@/config/category-art";
import type { LandingPageView } from "@/lib/landing/types";
import { toNumber } from "@/lib/money";
import { landingSections, landingTheme } from "@/lib/validations/landing-page";
import { db } from "@/server/db";

export const landingPageTag = (slug: string) => `landing-page:${slug}`;

/**
 * Published landing page by slug, cached until updateTag/revalidateTag(landingPageTag(slug))
 * is called (builder save/publish, or an order changing stock).
 * Decimals are converted to numbers so the result is serializable.
 */
export async function getPublishedLandingPage(slug: string): Promise<LandingPageView | null> {
  "use cache";
  cacheTag(landingPageTag(slug));
  cacheLife("hours");

  const page = await db.landingPage.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: {
      offers: { orderBy: { position: "asc" } },
      product: {
        include: {
          category: { select: { slug: true } },
          images: { orderBy: { position: "asc" }, select: { url: true, alt: true } },
          variants: {
            where: { isActive: true },
            orderBy: { position: "asc" },
            include: { options: { include: { attribute: { select: { slug: true } }, attributeValue: true } } },
          },
          reviews: {
            where: { status: "APPROVED" },
            orderBy: { createdAt: "desc" },
            take: 12,
            select: { authorName: true, rating: true, body: true, isVerifiedPurchase: true },
          },
        },
      },
    },
  });
  if (!page) return null;

  const zones = await db.shippingZone.findMany({
    where: { isActive: true, ...(page.shippingZoneIds.length && { id: { in: page.shippingZoneIds } }) },
    orderBy: { position: "asc" },
  });

  const art = categoryArt(page.product.category?.slug);
  const allowed = new Set(page.allowedVariantIds);
  const variants = page.product.variants
    .filter((v) => allowed.size === 0 || allowed.has(v.id))
    .map((v) => {
      const color = v.options.find((o) => o.attribute.slug === "color")?.attributeValue;
      const size = v.options.find((o) => o.attribute.slug === "size")?.attributeValue;
      return {
        id: v.id,
        color: color?.value ?? null,
        colorHex: color?.swatchHex ?? null,
        size: size?.value ?? null,
        stock: v.stock,
      };
    });

  return {
    id: page.id,
    slug: page.slug,
    title: page.title,
    // Invalid stored JSON degrades to an empty page instead of crashing.
    sections: landingSections.catch([]).parse(page.sections),
    theme: landingTheme.catch({}).parse(page.theme ?? {}),
    product: {
      id: page.product.id,
      name: page.product.name,
      nameBn: page.product.nameBn,
      art: art.kind,
      color: variants.find((v) => v.colorHex)?.colorHex ?? art.productColor,
      images: page.product.images,
      rating: toNumber(page.product.ratingAvg),
      reviewCount: page.product.reviewCount,
    },
    variants,
    offers: page.offers.map((o) => ({
      id: o.id,
      label: o.label,
      quantity: o.quantity,
      price: toNumber(o.price),
      compareAtPrice: o.compareAtPrice ? toNumber(o.compareAtPrice) : null,
      badge: o.badge,
      freeShipping: o.freeShipping,
      isDefault: o.isDefault,
    })),
    facebookPixelId: page.facebookPixelId,
    zones: zones.map((z) => ({ id: z.id, name: z.name, fee: toNumber(z.fee), estimatedDays: z.estimatedDays })),
    productReviews: page.product.reviews.map((r) => ({
      name: r.authorName,
      rating: r.rating,
      body: r.body,
      verified: r.isVerifiedPurchase,
    })),
  };
}

/** SEO/meta fields, read separately so metadata doesn't depend on the full view shape. */
export async function getLandingPageMeta(slug: string) {
  "use cache";
  cacheTag(landingPageTag(slug));
  cacheLife("hours");
  return db.landingPage.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: { title: true, seoTitle: true, seoDescription: true, ogImageUrl: true, facebookPixelId: true, thankYouMessage: true },
  });
}
