import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { GeometricPattern } from "@/components/storefront/art";
import { cn } from "@/lib/utils";

export function PageBanner({
  title,
  titleBn,
  description,
  crumbs,
  imageUrl,
}: {
  title: string;
  titleBn?: string;
  description?: string;
  crumbs: { title: string; href?: string }[];
  /** Optional photo background (category banner); text switches to light over a dark scrim. */
  imageUrl?: string;
}) {
  return (
    <section className={cn("relative overflow-hidden bg-secondary/70", imageUrl && "text-[#f6f1e7]")}>
      {imageUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- media library asset */}
          <img src={imageUrl} alt="" className="absolute inset-0 size-full object-cover" />
          <div className="absolute inset-0 bg-black/45" />
        </>
      ) : (
        <GeometricPattern color="#8a7650" opacity={0.16} />
      )}
      <div className="relative container mx-auto px-4 py-14 text-center md:py-20">
        <nav
          aria-label="Breadcrumb"
          className={cn(
            "mb-4 flex items-center justify-center gap-1 text-[11px] tracking-widest uppercase",
            imageUrl ? "text-[#f6f1e7]/80 [&_a:hover]:text-white [&_span.text-foreground]:text-white" : "text-muted-foreground",
          )}
        >
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          {crumbs.map((c) => (
            <span key={c.title} className="flex items-center gap-1">
              <ChevronRight className="size-3" />
              {c.href ? (
                <Link href={c.href} className="hover:text-foreground">
                  {c.title}
                </Link>
              ) : (
                <span className="text-foreground">{c.title}</span>
              )}
            </span>
          ))}
        </nav>
        <h1 className="text-5xl font-medium md:text-6xl">{title}</h1>
        {titleBn && <p className={cn("mt-2 font-bengali", imageUrl ? "opacity-85" : "text-muted-foreground")}>{titleBn}</p>}
        {description && (
          <p className={cn("mx-auto mt-3 max-w-lg text-sm", imageUrl ? "opacity-80" : "text-muted-foreground")}>{description}</p>
        )}
      </div>
    </section>
  );
}
