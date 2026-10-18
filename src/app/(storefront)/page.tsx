import { CategoryGrid } from "@/components/storefront/home/category-grid";
import { EditorialBanner } from "@/components/storefront/home/editorial-banner";
import { HeroSlider } from "@/components/storefront/home/hero-slider";
import { InstagramFeed } from "@/components/storefront/home/instagram-feed";
import { Testimonials } from "@/components/storefront/home/testimonials";
import { TrendingProducts } from "@/components/storefront/home/trending-products";
import { ValueProps } from "@/components/storefront/home/value-props";
import { heroSlides, instagramPosts, testimonials } from "@/lib/content/home";
import { getActiveProducts } from "@/server/services/catalog";

// Catalog comes from the DB (cached, tag "catalog"); hero/testimonials/Instagram are static
// content until they move to the Banner model / Settings.
export default async function HomePage() {
  const featured = await getActiveProducts({ featured: true });
  return (
    <>
      <HeroSlider slides={heroSlides} />
      <ValueProps />
      <CategoryGrid />
      <EditorialBanner />
      <TrendingProducts products={featured} />
      <Testimonials items={testimonials} />
      <InstagramFeed posts={instagramPosts} />
    </>
  );
}
