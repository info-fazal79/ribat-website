import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GeometricPattern, Silhouette } from "@/components/storefront/art";
import type { HomeSectionOf } from "@/lib/validations/homepage";
import { cn } from "@/lib/utils";

export function EditorialBanner({ section }: { section: HomeSectionOf<"promo"> }) {
  const lines = section.title.split("\n");
  return (
    <section className="container mx-auto px-4">
      <div className="relative grid overflow-hidden bg-[linear-gradient(135deg,#1f3b33,#0b1a16)] text-[#f6f1e7] md:grid-cols-2">
        <GeometricPattern color="#d8c08a" opacity={0.16} />
        <div className="relative z-10 flex flex-col justify-center gap-5 p-10 md:p-16">
          {section.eyebrow && <p className="text-[11px] font-medium tracking-[0.35em] text-[#d8c08a] uppercase">{section.eyebrow}</p>}
          <h2 className="text-4xl leading-tight font-medium md:text-6xl">
            {lines.map((line, i) => (
              <span key={i}>
                {i > 0 && <br />}
                {line}
              </span>
            ))}
          </h2>
          {section.titleBn && <p className="font-bengali text-base opacity-90">{section.titleBn}</p>}
          {section.body && <p className="max-w-md text-sm leading-relaxed opacity-75">{section.body}</p>}
          {(section.ctaLabel || section.note) && (
            <div className="flex flex-wrap items-center gap-6 pt-2">
              {section.ctaLabel && section.ctaUrl && (
                <Link
                  href={section.ctaUrl}
                  className="group inline-flex h-12 items-center gap-2 bg-[#d8c08a] px-7 text-xs font-semibold tracking-[0.2em] text-[#13231e] uppercase transition hover:bg-[#e6d3a6]"
                >
                  {section.ctaLabel}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </Link>
              )}
              {section.note && <span className="text-xs tracking-wider opacity-70">{section.note}</span>}
            </div>
          )}
        </div>
        <div className="relative min-h-80 md:min-h-[520px]">
          <div className="absolute inset-x-[18%] top-[10%] bottom-0 overflow-hidden rounded-t-full border border-[#d8c08a]/40 bg-[linear-gradient(180deg,rgba(216,192,138,0.18),transparent_80%)]">
            {section.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- media library asset
              <img
                src={section.imageUrl}
                alt=""
                className={cn(
                  "absolute inset-0 size-full",
                  section.imageFit === "cover"
                    ? "object-cover"
                    : "object-contain object-bottom p-[6%] pb-0 drop-shadow-[0_20px_30px_rgba(0,0,0,0.35)]",
                )}
              />
            )}
          </div>
          {!section.imageUrl && (
            <Silhouette
              kind="panjabi"
              fill="#d9c39a"
              stroke="rgba(60,47,25,0.5)"
              className="absolute inset-x-0 bottom-[4%] mx-auto h-[80%] w-auto drop-shadow-[0_20px_30px_rgba(0,0,0,0.35)]"
            />
          )}
        </div>
      </div>
    </section>
  );
}
