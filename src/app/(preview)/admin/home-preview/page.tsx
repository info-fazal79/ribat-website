import type { Metadata } from "next";
import { Suspense } from "react";
import { HomePreview } from "@/components/admin/home-builder/home-preview";
import { toHeroProduct } from "@/lib/hero";
import { settingSchemas } from "@/lib/validations/settings";
import { requireAdmin } from "@/server/auth/guards";
import { getActiveProducts, getCategories, getTrendingProductIds } from "@/server/services/catalog";
import { getHomeSections } from "@/server/services/home";
import { getSetting } from "@/server/services/settings";

export const metadata: Metadata = { title: "Homepage preview", robots: { index: false, follow: false } };

/**
 * Homepage Builder preview, loaded in the builder's iframe so storefront breakpoints match the
 * chosen device width. Outside the admin layout (no sidebar); the builder streams draft sections in
 * via postMessage. Lives under /admin so the proxy's optimistic auth check covers it too.
 */
export default function HomePreviewPage() {
  return (
    <Suspense>
      <Preview />
    </Suspense>
  );
}

async function Preview() {
  await requireAdmin();
  const [hero, sections, products, categories, trendingIds] = await Promise.all([
    getSetting("hero_slides"),
    getHomeSections(),
    getActiveProducts(),
    getCategories(),
    getTrendingProductIds(),
  ]);
  const active = hero.slides.filter((s) => s.active);
  const slides = active.length ? active : settingSchemas.hero_slides.parse({}).slides;
  const linkedIds = new Set(slides.filter((s) => s.mode === "product").map((s) => s.product.id));
  return (
    <HomePreview
      initial={sections}
      catalog={{ products, categories, trendingIds }}
      hero={{ ...hero, slides }}
      heroProducts={products.filter((p) => linkedIds.has(p.id)).map(toHeroProduct)}
    />
  );
}
