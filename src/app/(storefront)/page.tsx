import { HeroSlider } from "@/components/storefront/home/hero-slider";
import { HomeSections } from "@/components/storefront/home/home-sections";
import { toHeroProduct } from "@/lib/hero";
import { settingSchemas } from "@/lib/validations/settings";
import { getActiveProducts, getCategories, getTrendingProductIds } from "@/server/services/catalog";
import { getHomeSections } from "@/server/services/home";
import { getSetting } from "@/server/services/settings";

// Everything comes from the DB (cached, tags "catalog" / "settings" / "home-sections"). The sections
// below the hero are managed in Admin → Appearance → Homepage Builder.
export default async function HomePage() {
  const [hero, sections, products, categories, trendingIds] = await Promise.all([
    getSetting("hero_slides"),
    getHomeSections(),
    getActiveProducts(),
    getCategories(),
    getTrendingProductIds(),
  ]);
  // No active slides (all switched off or deleted) → fall back to the built-in luxury slides.
  const active = hero.slides.filter((s) => s.active);
  const slides = active.length ? active : settingSchemas.hero_slides.parse({}).slides;
  // Only ship the products the slides actually link to.
  const linkedIds = new Set(slides.filter((s) => s.mode === "product").map((s) => s.product.id));
  const heroProducts = products.filter((p) => linkedIds.has(p.id)).map(toHeroProduct);

  return (
    <>
      <HeroSlider settings={{ ...hero, slides }} products={heroProducts} />
      <HomeSections sections={sections} catalog={{ products, categories, trendingIds }} />
    </>
  );
}
