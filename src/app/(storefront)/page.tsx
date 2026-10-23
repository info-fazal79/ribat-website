import { CategoryGrid } from "@/components/storefront/home/category-grid";
import { EditorialBanner } from "@/components/storefront/home/editorial-banner";
import { HeroSlider } from "@/components/storefront/home/hero-slider";
import { InstagramFeed } from "@/components/storefront/home/instagram-feed";
import { ProductShowcase } from "@/components/storefront/home/product-showcase";
import { Testimonials } from "@/components/storefront/home/testimonials";
import { ValueProps } from "@/components/storefront/home/value-props";
import type { CatalogProduct } from "@/lib/catalog/types";
import { toHeroProduct } from "@/lib/hero";
import type { HomeSection, HomeSectionOf } from "@/lib/validations/homepage";
import { settingSchemas } from "@/lib/validations/settings";
import { getActiveProducts, getCategories } from "@/server/services/catalog";
import { getSetting } from "@/server/services/settings";

/** Most products a single grid ships to the client (load more / pagination page through these). */
const MAX_GRID_PRODUCTS = 48;

// Catalog and settings come from the DB (cached, tags "catalog" / "settings"); the section list,
// order and content are managed in Admin → Appearance → Homepage.
export default async function HomePage() {
  const [hero, home, published, categories] = await Promise.all([
    getSetting("hero_slides"),
    getSetting("home_sections"),
    getActiveProducts(),
    getCategories(),
  ]);
  // No active slides (all switched off or deleted) → fall back to the built-in luxury slides.
  const active = hero.slides.filter((s) => s.active);
  const slides = active.length ? active : settingSchemas.hero_slides.parse({}).slides;
  // Only ship the products the slides actually link to.
  const linkedIds = new Set(slides.filter((s) => s.mode === "product").map((s) => s.product.id));
  const heroProducts = published.filter((p) => linkedIds.has(p.id)).map(toHeroProduct);

  return (
    <>
      <HeroSlider settings={{ ...hero, slides }} products={heroProducts} />
      {home.sections
        .filter((s) => s.enabled)
        .map((section) => (
          <HomeSectionView key={section.id} section={section} products={published} categories={categories} />
        ))}
    </>
  );
}

function HomeSectionView({
  section,
  products,
  categories,
}: {
  section: HomeSection;
  products: CatalogProduct[];
  categories: Awaited<ReturnType<typeof getCategories>>;
}) {
  switch (section.type) {
    case "valueProps":
      return <ValueProps section={section} />;
    case "categories":
      return <CategoryGrid section={section} categories={categories} />;
    case "promo":
      return <EditorialBanner section={section} />;
    case "products":
      return <ProductShowcase section={section} products={productsFor(section, products)} />;
    case "testimonials":
      return <Testimonials section={section} />;
    case "community":
      return <InstagramFeed section={section} />;
    default: {
      const exhaustive: never = section;
      return exhaustive;
    }
  }
}

/** Products for a grid, already in catalog order (featured first, then newest). */
function productsFor(section: HomeSectionOf<"products">, products: CatalogProduct[]) {
  const pool =
    section.source === "featured"
      ? products.filter((p) => p.isFeatured)
      : section.source === "category"
        ? products.filter((p) => p.category?.slug === section.categorySlug)
        : products;
  return pool.slice(0, MAX_GRID_PRODUCTS);
}
