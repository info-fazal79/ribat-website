import { CategoryGrid } from "@/components/storefront/home/category-grid";
import { EditorialBanner } from "@/components/storefront/home/editorial-banner";
import { HeroSlider } from "@/components/storefront/home/hero-slider";
import { InstagramFeed } from "@/components/storefront/home/instagram-feed";
import { Testimonials } from "@/components/storefront/home/testimonials";
import { TrendingProducts } from "@/components/storefront/home/trending-products";
import { ValueProps } from "@/components/storefront/home/value-props";
import { instagramPosts, testimonials } from "@/lib/content/home";
import { settingSchemas } from "@/lib/validations/settings";
import { getActiveProducts } from "@/server/services/catalog";
import { getSetting } from "@/server/services/settings";

// Catalog and hero come from the DB (cached, tags "catalog" / "settings"); testimonials/Instagram are
// static content until they move to Settings.
export default async function HomePage() {
  const [featured, hero] = await Promise.all([getActiveProducts({ featured: true }), getSetting("hero_slides")]);
  // No active slides (all switched off or deleted) → fall back to the built-in luxury slides.
  const active = hero.slides.filter((s) => s.active);
  const slides = active.length ? active : settingSchemas.hero_slides.parse({}).slides;
  return (
    <>
      <HeroSlider settings={{ ...hero, slides }} />
      <ValueProps />
      <CategoryGrid />
      <EditorialBanner />
      <TrendingProducts products={featured} />
      <Testimonials items={testimonials} />
      <InstagramFeed posts={instagramPosts} />
    </>
  );
}
