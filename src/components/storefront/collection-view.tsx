"use client";

import { useMemo, useState } from "react";
import { ProductCard } from "@/components/storefront/product-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CatalogProduct } from "@/lib/catalog/types";

const sorts = {
  featured: { label: "Featured", fn: (a: CatalogProduct, b: CatalogProduct) => Number(b.isFeatured) - Number(a.isFeatured) },
  newest: { label: "Newest", fn: (a: CatalogProduct, b: CatalogProduct) => b.createdAt.localeCompare(a.createdAt) },
  "price-asc": { label: "Price: Low to High", fn: (a: CatalogProduct, b: CatalogProduct) => a.price - b.price },
  "price-desc": { label: "Price: High to Low", fn: (a: CatalogProduct, b: CatalogProduct) => b.price - a.price },
  rating: { label: "Top Rated", fn: (a: CatalogProduct, b: CatalogProduct) => b.rating - a.rating },
} as const;

type SortKey = keyof typeof sorts;

export function CollectionView({ products }: { products: CatalogProduct[] }) {
  const [sort, setSort] = useState<SortKey>("featured");
  const sorted = useMemo(() => [...products].sort(sorts[sort].fn), [products, sort]);

  return (
    <>
      <div className="mb-8 flex items-center justify-between border-y py-3">
        <p className="text-xs tracking-widest text-muted-foreground uppercase">{products.length} styles</p>
        <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
          <SelectTrigger className="w-48 rounded-none border-0 text-xs tracking-wider uppercase shadow-none" aria-label="Sort by">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            {Object.entries(sorts).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:gap-x-6 lg:grid-cols-4">
        {sorted.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </>
  );
}
