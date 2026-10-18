"use client";

import { useState } from "react";
import { ProductCard } from "@/components/storefront/product-card";
import { SectionHeading } from "@/components/storefront/home/section-heading";
import type { CatalogProduct } from "@/lib/catalog/types";
import { cn } from "@/lib/utils";

export function TrendingProducts({ products }: { products: CatalogProduct[] }) {
  const [filter, setFilter] = useState<string>("all");
  // Tabs for the categories that actually have featured products, in first-seen order.
  const tabs = products.reduce<{ slug: string; name: string }[]>(
    (acc, p) => (p.category && !acc.some((c) => c.slug === p.category!.slug) ? [...acc, p.category] : acc),
    [],
  );
  const visible = filter === "all" ? products : products.filter((p) => p.category?.slug === filter);

  return (
    <section className="container mx-auto px-4 py-20 md:py-28">
      <SectionHeading
        eyebrow="Trending Now"
        title="This week's most loved"
        titleBn="এই সপ্তাহের জনপ্রিয় পণ্য"
        href="/products"
      />

      <div className="-mx-4 mb-10 flex gap-6 overflow-x-auto border-b px-4 [scrollbar-width:none]" role="tablist">
        {[{ slug: "all", name: "All" }, ...tabs].map((c) => (
          <button
            key={c.slug}
            type="button"
            role="tab"
            aria-selected={filter === c.slug}
            onClick={() => setFilter(c.slug)}
            className={cn(
              "-mb-px shrink-0 border-b-2 pb-3 text-xs font-semibold tracking-[0.2em] uppercase transition",
              filter === c.slug
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:gap-x-6 lg:grid-cols-4">
        {visible.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
