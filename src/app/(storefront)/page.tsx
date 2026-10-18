import { CategoryGrid } from "@/components/storefront/home/category-grid";
import { EditorialBanner } from "@/components/storefront/home/editorial-banner";
import { HeroSlider } from "@/components/storefront/home/hero-slider";
import { InstagramFeed } from "@/components/storefront/home/instagram-feed";
import { Testimonials } from "@/components/storefront/home/testimonials";
import { TrendingProducts } from "@/components/storefront/home/trending-products";
import { ValueProps } from "@/components/storefront/home/value-props";
import { trendingProducts } from "@/lib/mock/catalog";
import { heroSlides, instagramPosts, testimonials } from "@/lib/mock/content";

// TODO(storefront): swap mock data for cached reads from src/server/services once the DB is seeded.
export default function HomePage() {
  return (
    <>
      <HeroSlider slides={heroSlides} />
      <ValueProps />
      <CategoryGrid />
      <EditorialBanner />
      <TrendingProducts products={trendingProducts} />
      <Testimonials items={testimonials} />
      <InstagramFeed posts={instagramPosts} />
    </>
  );
}
