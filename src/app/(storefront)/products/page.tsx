import type { Metadata } from "next";
import { CollectionView } from "@/components/storefront/collection-view";
import { PageBanner } from "@/components/storefront/page-banner";
import { getActiveProducts } from "@/server/services/catalog";

export const metadata: Metadata = { title: "Shop All" };

// TODO(storefront): filters (category, size, color, price) once the catalog grows.
export default async function ProductsPage() {
  const products = await getActiveProducts();
  return (
    <>
      <PageBanner
        title="Shop All"
        titleBn="সকল পণ্য"
        description="Panjabi, thobe, abaya, everyday modest wear and alcohol-free fragrance."
        crumbs={[{ title: "Shop All" }]}
      />
      <section className="container mx-auto px-4 py-12">
        <CollectionView products={products} />
      </section>
    </>
  );
}
