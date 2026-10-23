import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GeometricPattern } from "@/components/storefront/art";
import type { HomeSectionOf } from "@/lib/validations/homepage";
import { cn } from "@/lib/utils";

const isBengali = (text: string) => /[ঀ-৿]/.test(text);

/** Heading + paragraphs + optional button (story / announcement block). Plain text only. */
export function RichTextSection({ section }: { section: HomeSectionOf<"richText"> }) {
  const paragraphs = section.body.split(/\n\s*\n/).filter((p) => p.trim());
  if (!section.title && paragraphs.length === 0) return null;
  const dark = section.background === "emerald";
  const center = section.align === "center";

  return (
    <section
      className={cn(
        "relative overflow-hidden",
        section.background === "cream" && "bg-secondary/60",
        dark && "bg-primary text-primary-foreground",
      )}
    >
      {dark && <GeometricPattern color="#d8c08a" opacity={0.1} />}
      <div className={cn("relative container mx-auto max-w-3xl space-y-5 px-4 py-20 md:py-24", center && "text-center")}>
        {section.eyebrow && <p className="text-[11px] font-medium tracking-[0.35em] text-gold uppercase">{section.eyebrow}</p>}
        {section.title && (
          <h2 className={cn("text-4xl leading-tight font-medium md:text-5xl", isBengali(section.title) && "font-bengali")}>{section.title}</h2>
        )}
        {paragraphs.map((p, i) => (
          <p
            key={i}
            className={cn("leading-relaxed whitespace-pre-line", dark ? "opacity-80" : "text-muted-foreground", isBengali(p) && "font-bengali")}
          >
            {p}
          </p>
        ))}
        {section.buttonLabel && section.buttonUrl && (
          <div className={cn("pt-3", center && "flex justify-center")}>
            <Link
              href={section.buttonUrl}
              className={cn(
                "group inline-flex h-12 items-center gap-2 px-7 text-xs font-semibold tracking-[0.2em] uppercase transition",
                dark ? "bg-gold text-gold-foreground hover:opacity-90" : "bg-primary text-primary-foreground hover:bg-primary/90",
              )}
            >
              {section.buttonLabel}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
