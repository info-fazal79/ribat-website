import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CollectionView } from "@/components/storefront/collection-view";
import { PageBanner } from "@/components/storefront/page-banner";
import { getActiveProducts, getCategories, getCategory } from "@/server/services/catalog";

export async function generateStaticParams() {
  return (await getCategories()).map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/categories/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  return category ? { title: category.name, description: category.description ?? undefined } : {};
}

export default async function CategoryPage({ params }: PageProps<"/categories/[slug]">) {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) notFound();
  const products = await getActiveProducts({ categorySlug: category.slug });

  return (
    <>
      <PageBanner
        title={category.name}
        titleBn={category.nameBn ?? undefined}
        description={category.description ?? undefined}
        crumbs={[{ title: "Shop", href: "/products" }, { title: category.name }]}
        imageUrl={category.bannerUrl ?? undefined}
      />
      <section className="container mx-auto px-4 py-12">
        {products.length > 0 ? (
          <CollectionView products={products} />
        ) : (
          <p className="py-16 text-center text-muted-foreground">New styles are coming soon.</p>
        )}
      </section>
    </>
  );
}
