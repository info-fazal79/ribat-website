import { Fragment } from "react";
import { CategoryGrid } from "@/components/storefront/home/category-grid";
import { EditorialBanner } from "@/components/storefront/home/editorial-banner";
import { InstagramFeed } from "@/components/storefront/home/instagram-feed";
import { ProductCarousel } from "@/components/storefront/home/product-carousel";
import { ProductShowcase } from "@/components/storefront/home/product-showcase";
import { RichTextSection } from "@/components/storefront/home/rich-text-section";
import { Testimonials } from "@/components/storefront/home/testimonials";
import { ValueProps } from "@/components/storefront/home/value-props";
import type { CatalogCategory, CatalogProduct } from "@/lib/catalog/types";
import { productsForSource } from "@/lib/home/products";
import type { HomeSection } from "@/lib/validations/homepage";

export type HomeCatalog = { products: CatalogProduct[]; categories: CatalogCategory[]; trendingIds: string[] };

/**
 * Renders homepage sections in order. Shared by the storefront (server) and the Homepage Builder's
 * live preview (client), so both look identical. `wrap` lets the preview add selection outlines;
 * with it, disabled sections are passed through too (node = null) so they can show a placeholder.
 */
export function HomeSections({
  sections,
  catalog,
  wrap,
}: {
  sections: HomeSection[];
  catalog: HomeCatalog;
  wrap?: (section: HomeSection, node: React.ReactNode) => React.ReactNode;
}) {
  return (
    <>
      {sections.map((section) => {
        if (!wrap && !section.enabled) return null;
        const node = section.enabled ? <SectionView section={section} catalog={catalog} /> : null;
        return <Fragment key={section.id}>{wrap ? wrap(section, node) : node}</Fragment>;
      })}
    </>
  );
}

function SectionView({ section, catalog }: { section: HomeSection; catalog: HomeCatalog }) {
  const { products, categories, trendingIds } = catalog;
  switch (section.type) {
    case "valueProps":
      return <ValueProps section={section} />;
    case "categories":
      return <CategoryGrid section={section} categories={categories} />;
    case "promo":
      return <EditorialBanner section={section} />;
    case "products":
      return <ProductShowcase section={section} products={productsForSource(section.source, section.categorySlug, products, trendingIds)} />;
    case "productCarousel":
      return <ProductCarousel section={section} products={productsForSource(section.source, section.categorySlug, products, trendingIds)} />;
    case "testimonials":
      return <Testimonials section={section} />;
    case "community":
      return <InstagramFeed section={section} />;
    case "richText":
      return <RichTextSection section={section} />;
    default: {
      const exhaustive: never = section;
      return exhaustive;
    }
  }
}
