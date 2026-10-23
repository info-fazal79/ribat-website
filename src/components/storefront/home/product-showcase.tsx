"use client";

import { useState } from "react";
import { ProductCard } from "@/components/storefront/product-card";
import { SectionHeading } from "@/components/storefront/home/section-heading";
import type { CatalogProduct } from "@/lib/catalog/types";
import type { HomeSectionOf } from "@/lib/validations/homepage";
import { cn } from "@/lib/utils";

// Static class names so Tailwind generates them.
const desktopCols = { 4: "lg:grid-cols-4", 5: "lg:grid-cols-5", 6: "lg:grid-cols-6" } as const;

/** Configurable product grid ("Trending Now", category collections…) from Appearance → Homepage. */
export function ProductShowcase({ section, products }: { section: HomeSectionOf<"products">; products: CatalogProduct[] }) {
  const [filter, setFilter] = useState<string>("all");
  const [shown, setShown] = useState(section.limit); // load more
  const [page, setPage] = useState(0); // pagination

  // Tabs for the categories that actually appear in this grid, in first-seen order.
  const tabs = products.reduce<{ slug: string; name: string }[]>(
    (acc, p) => (p.category && !acc.some((c) => c.slug === p.category!.slug) ? [...acc, p.category] : acc),
    [],
  );
  const showTabs = section.tabs && tabs.length > 0;
  const filtered = filter === "all" ? products : products.filter((p) => p.category?.slug === filter);
  const pages = Math.max(1, Math.ceil(filtered.length / section.limit));
  const current = Math.min(page, pages - 1);
  const visible =
    section.display === "loadMore"
      ? filtered.slice(0, shown)
      : section.display === "pagination"
        ? filtered.slice(current * section.limit, (current + 1) * section.limit)
        : filtered.slice(0, section.limit);
  const viewAll = section.display === "viewAll" && section.viewAllUrl ? section.viewAllUrl : undefined;

  if (products.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-20 md:py-28">
      <SectionHeading
        eyebrow={section.eyebrow}
        title={section.title}
        titleBn={section.titleBn || undefined}
        href={viewAll}
        linkLabel={section.viewAllLabel || undefined}
      />

      {showTabs && (
        <div className="-mx-4 mb-10 flex gap-6 overflow-x-auto border-b px-4 [scrollbar-width:none]" role="tablist">
          {[{ slug: "all", name: "All" }, ...tabs].map((c) => (
            <button
              key={c.slug}
              type="button"
              role="tab"
              aria-selected={filter === c.slug}
              onClick={() => {
                setFilter(c.slug);
                setShown(section.limit);
                setPage(0);
              }}
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
      )}

      <div className={cn("grid grid-cols-2 gap-x-4 gap-y-12 md:gap-x-6", desktopCols[section.columns])}>
        {visible.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {section.display === "loadMore" && shown < filtered.length && (
        <div className="mt-14 text-center">
          <button
            type="button"
            onClick={() => setShown((n) => n + section.limit)}
            className="inline-flex h-12 items-center border border-foreground px-10 text-xs font-semibold tracking-[0.2em] uppercase transition hover:bg-foreground hover:text-background"
          >
            Load more
          </button>
        </div>
      )}

      {section.display === "pagination" && pages > 1 && (
        <nav className="mt-14 flex items-center justify-center gap-2" aria-label="Products pages">
          {Array.from({ length: pages }, (_, i) => (
            <button
              key={i}
              type="button"
              aria-current={i === current ? "page" : undefined}
              onClick={() => setPage(i)}
              className={cn(
                "grid size-10 place-items-center border text-xs font-semibold tabular-nums transition",
                i === current ? "border-foreground bg-foreground text-background" : "hover:border-foreground",
              )}
            >
              {i + 1}
            </button>
          ))}
        </nav>
      )}
    </section>
  );
}
