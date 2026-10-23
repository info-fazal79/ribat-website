import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { EditorialArt } from "@/components/storefront/art";
import { SectionHeading } from "@/components/storefront/home/section-heading";
import type { CatalogCategory } from "@/lib/catalog/types";
import type { HomeSectionOf } from "@/lib/validations/homepage";
import { cn } from "@/lib/utils";

// Bento layout on desktop: hero tile + four supporting tiles.
const layout = [
  "md:col-span-2 md:row-span-2",
  "md:col-span-1 md:row-span-1",
  "md:col-span-1 md:row-span-1",
  "md:col-span-1 md:row-span-1",
  "md:col-span-1 md:row-span-1",
];

export function CategoryGrid({ section, categories: all }: { section: HomeSectionOf<"categories">; categories: CatalogCategory[] }) {
  const cards = section.layout === "cards";
  const max = cards ? 8 : 5;
  // Chosen tiles in admin order (skipping categories that no longer exist); none chosen = the first few.
  // Image: tile override → the category's own image → illustrated art.
  const tiles = (
    section.items.length
      ? section.items.flatMap((item) => {
          const category = all.find((c) => c.slug === item.slug);
          return category ? [{ category, imageUrl: item.imageUrl || category.imageUrl || "" }] : [];
        })
      : all.map((category) => ({ category, imageUrl: category.imageUrl ?? "" }))
  ).slice(0, max);
  if (tiles.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-20 md:py-28">
      <SectionHeading
        eyebrow={section.eyebrow}
        title={section.title}
        titleBn={section.titleBn || undefined}
        href={section.linkUrl || undefined}
        linkLabel={section.linkLabel || undefined}
      />
      <div
        className={cn(
          "grid grid-cols-2 gap-3 md:gap-4",
          cards ? "md:grid-cols-4" : "auto-rows-[220px] md:auto-rows-[260px] md:grid-cols-4",
        )}
      >
        {tiles.map(({ category, imageUrl }, i) => {
          // Photos and dark-toned art get light text; light-toned art (thobe, casual) needs dark text.
          const light = Boolean(imageUrl) || (category.art !== "thobe" && category.art !== "casual");
          return (
            <Link
              key={category.slug}
              href={`/categories/${category.slug}`}
              className={cn(
                "group relative overflow-hidden",
                cards ? "aspect-[3/4]" : [i === 0 ? "col-span-2 row-span-2" : "col-span-1", layout[i]],
              )}
            >
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- media library asset
                <img
                  src={imageUrl}
                  alt=""
                  className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <EditorialArt kind={category.art} tone={category.tone} />
              )}
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
                  <h3 className={cn("font-heading font-medium", i === 0 && !cards ? "text-4xl md:text-5xl" : "text-2xl md:text-3xl")}>
                    {category.name}
                  </h3>
                  <p className="mt-1 hidden text-xs opacity-80 sm:block">
                    {category.description} · {category.productCount} styles
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
