"use client";

import { useState } from "react";
import { ProductCard } from "@/components/storefront/product-card";
import { SectionHeading } from "@/components/storefront/home/section-heading";
import { categories, type CategorySlug, type MockProduct } from "@/lib/mock/catalog";
import { cn } from "@/lib/utils";

export function TrendingProducts({ products }: { products: MockProduct[] }) {
  const [filter, setFilter] = useState<CategorySlug | "all">("all");
  const present = categories.filter((c) => products.some((p) => p.category === c.slug));
  const visible = filter === "all" ? products : products.filter((p) => p.category === filter);

  return (
    <section className="container mx-auto px-4 py-20 md:py-28">
      <SectionHeading
        eyebrow="Trending Now"
        title="This week's most loved"
        titleBn="এই সপ্তাহের জনপ্রিয় পণ্য"
        href="/products"
      />

      <div className="-mx-4 mb-10 flex gap-6 overflow-x-auto border-b px-4 [scrollbar-width:none]" role="tablist">
        {[{ slug: "all" as const, name: "All" }, ...present].map((c) => (
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
