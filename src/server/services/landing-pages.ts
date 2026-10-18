import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/server/db";
import { landingSections, landingTheme } from "@/lib/validations/landing-page";

export const landingPageTag = (slug: string) => `landing-page:${slug}`;

/**
 * Published landing page by slug, cached until revalidateTag(landingPageTag(slug))
 * is called from the admin editor on save/publish.
 * Decimals are converted to strings so the result is serializable.
 */
export async function getPublishedLandingPage(slug: string) {
  "use cache";
  cacheTag(landingPageTag(slug));
  cacheLife("hours");

  const page = await db.landingPage.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: {
      offers: { orderBy: { position: "asc" } },
      product: {
        select: {
          id: true,
          name: true,
          images: { orderBy: { position: "asc" }, select: { url: true, alt: true } },
        },
      },
    },
  });
  if (!page) return null;

  return {
    id: page.id,
    slug: page.slug,
    title: page.title,
    seoTitle: page.seoTitle,
    seoDescription: page.seoDescription,
    ogImageUrl: page.ogImageUrl,
    facebookPixelId: page.facebookPixelId,
    // Invalid stored JSON degrades to an empty page instead of crashing.
    sections: landingSections.catch([]).parse(page.sections),
    theme: landingTheme.catch({}).parse(page.theme ?? {}),
    product: page.product,
    offers: page.offers.map((o) => ({
      id: o.id,
      label: o.label,
      quantity: o.quantity,
      price: o.price.toString(),
      compareAtPrice: o.compareAtPrice?.toString() ?? null,
      badge: o.badge,
      freeShipping: o.freeShipping,
      isDefault: o.isDefault,
    })),
  };
}

export type PublishedLandingPage = NonNullable<Awaited<ReturnType<typeof getPublishedLandingPage>>>;
