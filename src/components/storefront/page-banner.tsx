import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { GeometricPattern } from "@/components/storefront/art";

export function PageBanner({
  title,
  titleBn,
  description,
  crumbs,
}: {
  title: string;
  titleBn?: string;
  description?: string;
  crumbs: { title: string; href?: string }[];
}) {
  return (
    <section className="relative overflow-hidden bg-secondary/70">
      <GeometricPattern color="#8a7650" opacity={0.16} />
      <div className="relative container mx-auto px-4 py-14 text-center md:py-20">
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center justify-center gap-1 text-[11px] tracking-widest text-muted-foreground uppercase">
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
        {titleBn && <p className="mt-2 font-bengali text-muted-foreground">{titleBn}</p>}
        {description && <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground">{description}</p>}
      </div>
    </section>
  );
}
