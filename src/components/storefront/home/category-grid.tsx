import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { EditorialArt } from "@/components/storefront/art";
import { SectionHeading } from "@/components/storefront/home/section-heading";
import { activeProducts, categories } from "@/lib/mock/catalog";
import { cn } from "@/lib/utils";

// Bento layout on desktop: Panjabi hero tile + four supporting tiles.
const layout = [
  "md:col-span-2 md:row-span-2",
  "md:col-span-1 md:row-span-1",
  "md:col-span-1 md:row-span-1",
  "md:col-span-1 md:row-span-1",
  "md:col-span-1 md:row-span-1",
];

export function CategoryGrid() {
  return (
    <section className="container mx-auto px-4 py-20 md:py-28">
      <SectionHeading
        eyebrow="Shop by Category"
        title="Curated for every occasion"
        titleBn="আপনার পছন্দের ক্যাটাগরি"
        href="/products"
        linkLabel="Shop all"
      />
      <div className="grid auto-rows-[220px] grid-cols-2 gap-3 md:auto-rows-[260px] md:grid-cols-4 md:gap-4">
        {categories.map((category, i) => {
          const count = activeProducts.filter((p) => p.category === category.slug).length;
          const light = category.slug !== "thobe" && category.slug !== "casual";
          return (
            <Link
              key={category.slug}
              href={`/categories/${category.slug}`}
              className={cn(
                "group relative overflow-hidden",
                i === 0 ? "col-span-2 row-span-2" : "col-span-1",
                layout[i],
              )}
            >
              <EditorialArt category={category.slug} tone={category.tone} />
              <div
                className={cn(
                  "absolute inset-0 bg-gradient-to-t via-transparent to-transparent",
                  light ? "from-black/50" : "from-white/45",
                )}
              />
              <div
                className={cn(
                  "absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5 md:p-6",
                  light ? "text-[#f6f1e7]" : "text-[#1d1a14]",
                )}
              >
                <div>
                  <p className="font-bengali text-xs opacity-80">{category.nameBn}</p>
                  <h3 className={cn("font-heading font-medium", i === 0 ? "text-4xl md:text-5xl" : "text-2xl md:text-3xl")}>
                    {category.name}
                  </h3>
                  <p className="mt-1 hidden text-xs opacity-80 sm:block">
                    {category.blurb} · {count} styles
                  </p>
                </div>
                <span className="grid size-10 shrink-0 place-items-center rounded-full border border-current/40 transition group-hover:border-current">
                  <ArrowUpRight className="size-4 transition-transform group-hover:rotate-45" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
