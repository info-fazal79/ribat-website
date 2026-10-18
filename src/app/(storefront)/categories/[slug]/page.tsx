import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CollectionView } from "@/components/storefront/collection-view";
import { PageBanner } from "@/components/storefront/page-banner";
import { categories, getCategory, getProductsByCategory } from "@/lib/mock/catalog";

export function generateStaticParams() {
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/categories/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategory(slug);
  return category ? { title: category.name, description: category.blurb } : {};
}

export default async function CategoryPage({ params }: PageProps<"/categories/[slug]">) {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();

  return (
    <>
      <PageBanner
        title={category.name}
        titleBn={category.nameBn}
        description={category.blurb}
        crumbs={[{ title: "Shop", href: "/products" }, { title: category.name }]}
      />
      <section className="container mx-auto px-4 py-12">
        <CollectionView products={getProductsByCategory(category.slug)} />
      </section>
    </>
  );
}
