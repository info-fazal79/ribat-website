import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  titleBn,
  href,
  linkLabel = "View all",
  align = "left",
  className,
}: {
  eyebrow: string;
  title: string;
  titleBn?: string;
  href?: string;
  linkLabel?: string;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-10 flex flex-col gap-4 md:mb-14",
        align === "center" ? "items-center text-center" : "md:flex-row md:items-end md:justify-between",
        className,
      )}
    >
      <div className="space-y-3">
        <p className="text-[11px] font-medium tracking-[0.35em] text-gold uppercase">{eyebrow}</p>
        <h2 className="text-4xl leading-tight font-medium md:text-5xl">{title}</h2>
        {titleBn && <p className="font-bengali text-sm text-muted-foreground">{titleBn}</p>}
      </div>
      {href && (
        <Link
          href={href}
          className="group inline-flex items-center gap-2 border-b border-foreground pb-1 text-xs font-semibold tracking-[0.2em] uppercase"
        >
          {linkLabel}
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}
