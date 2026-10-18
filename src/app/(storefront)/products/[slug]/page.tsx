import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/storefront/product-card";
import { ProductPurchasePanel } from "@/components/storefront/product-purchase-panel";
import { SectionHeading } from "@/components/storefront/home/section-heading";
import { getActiveProducts, getProductBySlug } from "@/server/services/catalog";

export async function generateStaticParams() {
  return (await getActiveProducts()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  return product ? { title: product.name, description: product.shortDescription ?? undefined } : {};
}

export default async function ProductPage({ params }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  // Same category first, topped up with other products.
  const others = (await getActiveProducts()).filter((p) => p.id !== product.id);
  const related = [
    ...others.filter((p) => p.category?.slug === product.category?.slug),
    ...others.filter((p) => p.category?.slug !== product.category?.slug),
  ].slice(0, 4);

  return (
    <>
      <div className="container mx-auto px-4 py-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-[11px] tracking-widest text-muted-foreground uppercase">
          <Link href="/" className="hover:text-foreground">Home</Link>
          {product.category && (
            <>
              <ChevronRight className="size-3" />
              <Link href={`/categories/${product.category.slug}`} className="hover:text-foreground">{product.category.name}</Link>
            </>
          )}
          <ChevronRight className="size-3" />
          <span className="truncate text-foreground">{product.name}</span>
        </nav>
      </div>
      <section className="container mx-auto px-4 pb-20">
        <ProductPurchasePanel key={product.id} product={product} />
      </section>
      {related.length > 0 && (
        <section className="container mx-auto border-t px-4 py-20">
          <SectionHeading eyebrow="Complete the look" title="You may also like" />
          <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:gap-x-6 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
