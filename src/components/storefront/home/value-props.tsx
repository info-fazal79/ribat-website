import { valuePropIconMap } from "@/components/storefront/home/home-icons";
import type { HomeSectionOf } from "@/lib/validations/homepage";
import { cn } from "@/lib/utils";

// Static class names so Tailwind generates them; one row on desktop.
const desktopCols = ["", "lg:grid-cols-1", "lg:grid-cols-2", "lg:grid-cols-3", "lg:grid-cols-4", "lg:grid-cols-5", "lg:grid-cols-6"];

export function ValueProps({ section }: { section: HomeSectionOf<"valueProps"> }) {
  const items = section.items.filter((i) => i.active);
  if (items.length === 0) return null;
  return (
    <section className="border-y bg-secondary/60">
      <div className={cn("container mx-auto grid grid-cols-2 px-4", desktopCols[items.length])}>
        {items.map(({ id, icon, title, body, bn }, i) => {
          const Icon = valuePropIconMap[icon];
          return (
            <div
              key={id}
              className={`flex flex-col items-center gap-3 px-4 py-8 text-center md:flex-row md:text-left ${i > 0 ? "lg:border-l" : ""} ${i % 2 === 1 ? "border-l lg:border-l" : ""} ${i > 1 ? "border-t lg:border-t-0" : ""}`}
            >
              <span className="grid size-12 shrink-0 place-items-center rounded-full border border-gold/50 text-primary">
                <Icon className="size-5" strokeWidth={1.5} />
              </span>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold tracking-[0.15em] uppercase">{title}</p>
                {body && <p className="text-xs text-muted-foreground">{body}</p>}
                {bn && <p className="font-bengali text-[11px] text-muted-foreground/80">{bn}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
