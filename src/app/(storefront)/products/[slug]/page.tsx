import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/storefront/product-card";
import { ProductPurchasePanel } from "@/components/storefront/product-purchase-panel";
import { SectionHeading } from "@/components/storefront/home/section-heading";
import { activeProducts, getCategory, getProduct } from "@/lib/mock/catalog";

export function generateStaticParams() {
  return activeProducts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  return product ? { title: product.name, description: product.shortDescription } : {};
}

export default async function ProductPage({ params }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  const category = getCategory(product.category);
  const related = activeProducts.filter((p) => p.id !== product.id && p.category === product.category).slice(0, 4);
  const more = related.length < 4
    ? [...related, ...activeProducts.filter((p) => p.id !== product.id && !related.includes(p))].slice(0, 4)
    : related;

  return (
    <>
      <div className="container mx-auto px-4 py-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-[11px] tracking-widest text-muted-foreground uppercase">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <ChevronRight className="size-3" />
          <Link href={`/categories/${product.category}`} className="hover:text-foreground">{category?.name}</Link>
          <ChevronRight className="size-3" />
          <span className="truncate text-foreground">{product.name}</span>
        </nav>
      </div>
      <section className="container mx-auto px-4 pb-20">
        <ProductPurchasePanel key={product.id} product={product} />
      </section>
      <section className="container mx-auto border-t px-4 py-20">
        <SectionHeading eyebrow="Complete the look" title="You may also like" />
        <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:gap-x-6 lg:grid-cols-4">
          {more.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </>
  );
}
