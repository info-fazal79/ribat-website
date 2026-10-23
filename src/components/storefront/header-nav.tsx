import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import type { MenuItem } from "@/lib/validations/settings";
import { cn } from "@/lib/utils";

const isBengali = (text: string) => /[ঀ-৿]/.test(text);

// Panels open on hover and on keyboard focus (focus-within), no client JS needed.
const panelVisibility =
  "invisible opacity-0 transition-[opacity,visibility] duration-200 group-hover/item:visible group-hover/item:opacity-100 group-focus-within/item:visible group-focus-within/item:opacity-100";

export const megaThemes = {
  light: { panel: "bg-background text-foreground", heading: "text-primary border-border", link: "text-foreground/75 hover:text-foreground" },
  cream: { panel: "bg-secondary text-secondary-foreground", heading: "text-primary border-primary/15", link: "text-foreground/75 hover:text-foreground" },
  emerald: { panel: "bg-primary text-primary-foreground", heading: "text-gold border-white/15", link: "text-primary-foreground/75 hover:text-primary-foreground" },
} as const;

/** Link columns actually rendered for a mega item (first `gridColumns`, non-empty). */
export const megaColumns = (item: MenuItem) => item.columns.slice(0, item.gridColumns).filter((c) => c.links.length > 0);

export const hasSubmenu = (item: MenuItem) =>
  item.megaMenu ? megaColumns(item).length > 0 || item.promo.enabled : item.links.length > 0;

/**
 * Desktop header menu: plain links, standard dropdowns, and full-width mega menus.
 * "row" is its own bordered bar under the header; "inline" sits inside a header row and isn't
 * positioned, so mega panels span the whole header instead of just this nav.
 */
export function DesktopNav({
  items,
  variant = "row",
  className,
  label = "Main",
}: {
  items: MenuItem[];
  variant?: "row" | "inline";
  className?: string;
  label?: string;
}) {
  return (
    <nav
      // Inline: stretch to the row height so the hover area reaches the panel below the header.
      className={cn("hidden lg:block", variant === "row" ? "relative border-t" : "self-stretch", className)}
      aria-label={label}
    >
      <ul className={cn("flex", variant === "row" ? "justify-center gap-10" : "h-full gap-7 xl:gap-9")}>
        {items.map((item) => {
          const submenu = hasSubmenu(item);
          return (
            <li key={item.id} className={cn("group/item flex", !item.megaMenu && "relative")}>
              <Link
                href={item.url}
                aria-haspopup={submenu || undefined}
                className={cn(
                  "relative flex items-center gap-1 py-3.5 text-[11px] font-medium tracking-[0.2em] text-foreground/70 uppercase transition-colors hover:text-foreground group-hover/item:text-foreground",
                  "after:absolute after:inset-x-0 after:bottom-2.5 after:h-px after:origin-left after:scale-x-0 after:bg-foreground after:transition-transform group-hover/item:after:scale-x-100",
                  isBengali(item.title) && "font-bengali tracking-normal normal-case",
                )}
              >
                {item.title}
                {submenu && <ChevronDown className="size-3 transition-transform group-hover/item:rotate-180" />}
              </Link>
              {submenu &&
                (item.megaMenu ? (
                  <div className={cn("absolute inset-x-0 top-full z-50 border-y shadow-2xl", megaThemes[item.panelTheme].panel, panelVisibility)}>
                    <MegaMenuContent item={item} />
                  </div>
                ) : (
                  <div className={cn("absolute top-full left-1/2 z-50 -translate-x-1/2 pt-px", panelVisibility)}>
                    <DropdownContent item={item} />
                  </div>
                ))}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function DropdownContent({ item }: { item: MenuItem }) {
  return (
    <ul className="min-w-56 border bg-background py-2 shadow-xl">
      {item.links.map((link, i) => (
        <li key={i}>
          <Link
            href={link.url}
            className={cn(
              "block px-5 py-2.5 text-sm text-foreground/75 transition-colors hover:bg-muted/60 hover:text-foreground",
              isBengali(link.title) && "font-bengali",
            )}
          >
            {link.title}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Mega panel body; also rendered by the admin live preview. */
export function MegaMenuContent({ item, className }: { item: MenuItem; className?: string }) {
  const columns = megaColumns(item);
  const theme = megaThemes[item.panelTheme];
  const { promo } = item;
  return (
    <div className={cn("container mx-auto flex gap-10 px-4 py-10", className)}>
      <div className="grid flex-1 gap-x-10 gap-y-8" style={{ gridTemplateColumns: `repeat(${item.gridColumns}, minmax(0, 1fr))` }}>
        {columns.map((col, c) => (
          <div key={c} className="min-w-0">
            {col.title && (
              <p className={cn("mb-4 border-b pb-3 text-[11px] font-semibold tracking-[0.25em] uppercase", theme.heading)}>{col.title}</p>
            )}
            <ul className="space-y-3">
              {col.links.map((link, l) => (
                <li key={l}>
                  <Link
                    href={link.url}
                    className={cn(
                      "inline-block font-heading text-lg transition-all hover:translate-x-1",
                      theme.link,
                      isBengali(link.title) && "font-bengali text-base",
                    )}
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div className="col-span-full">
          <Link
            href={item.url}
            className="inline-flex items-center gap-2 text-[11px] font-medium tracking-[0.2em] uppercase underline-offset-4 hover:underline"
          >
            Shop all {item.title}
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>

      {promo.enabled && (
        <Link
          href={promo.buttonUrl || item.url}
          className="group/promo relative isolate flex aspect-[4/5] w-72 shrink-0 flex-col justify-end overflow-hidden bg-primary p-6 text-primary-foreground ring-1 ring-black/5"
        >
          {promo.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- admin-supplied image (uploaded or embedded)
            <img
              src={promo.imageUrl}
              alt=""
              className="absolute inset-0 -z-10 size-full object-cover transition-transform duration-700 group-hover/promo:scale-105"
            />
          )}
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
          {promo.badge && (
            <span className="absolute top-4 left-4 bg-gold px-2.5 py-1 text-[10px] font-semibold tracking-[0.2em] text-gold-foreground uppercase">
              {promo.badge}
            </span>
          )}
          {promo.title && (
            <p className={cn("font-heading text-2xl leading-tight text-white", isBengali(promo.title) && "font-bengali text-xl")}>
              {promo.title}
            </p>
          )}
          {promo.buttonText && (
            <span className="mt-3 inline-flex items-center gap-2 text-[11px] font-medium tracking-[0.2em] text-white uppercase">
              {promo.buttonText}
              <ArrowRight className="size-3.5 transition-transform group-hover/promo:translate-x-1" />
            </span>
          )}
        </Link>
      )}
    </div>
  );
}

/** Mobile drawer menu: items with submenus become accordions. */
export function MobileNav({ items }: { items: MenuItem[] }) {
  return (
    <nav className="flex flex-col overflow-y-auto px-4" aria-label="Main">
      {items.map((item) => {
        const groups = item.megaMenu ? megaColumns(item) : item.links.length > 0 ? [{ title: "", links: item.links }] : [];
        const linkClass = cn("text-sm tracking-widest uppercase", isBengali(item.title) && "font-bengali tracking-normal normal-case");
        if (groups.length === 0) {
          return (
            <Link key={item.id} href={item.url} className={cn("border-b py-4", linkClass)}>
              {item.title}
            </Link>
          );
        }
        return (
          <details key={item.id} className="group border-b">
            <summary className={cn("flex cursor-pointer list-none items-center justify-between py-4", linkClass)}>
              {item.title}
              <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
            </summary>
            <div className="space-y-4 pb-4 pl-3">
              {groups.map((g, gi) => (
                <div key={gi} className="space-y-2">
                  {g.title && <p className="text-[10px] font-semibold tracking-[0.2em] text-primary uppercase">{g.title}</p>}
                  {g.links.map((link, l) => (
                    <Link key={l} href={link.url} className={cn("block py-1 text-sm text-foreground/80", isBengali(link.title) && "font-bengali")}>
                      {link.title}
                    </Link>
                  ))}
                </div>
              ))}
              {item.megaMenu && item.promo.enabled && item.promo.imageUrl && (
                <Link href={item.promo.buttonUrl || item.url} className="relative block overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element -- admin-supplied image */}
                  <img src={item.promo.imageUrl} alt="" className="aspect-[16/9] w-full object-cover" />
                  {item.promo.badge && (
                    <span className="absolute top-2 left-2 bg-gold px-2 py-0.5 text-[9px] font-semibold tracking-[0.2em] text-gold-foreground uppercase">
                      {item.promo.badge}
                    </span>
                  )}
                </Link>
              )}
              <Link href={item.url} className="block pt-1 text-xs font-medium tracking-widest uppercase underline underline-offset-4">
                Shop all {item.title}
              </Link>
            </div>
          </details>
        );
      })}
      <Link href="/products" className="py-4 text-sm font-semibold tracking-widest uppercase">
        Shop All
      </Link>
    </nav>
  );
}
