import Link from "next/link";
import { ChevronDown, ChevronRight, Heart, LayoutGrid, Menu, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AnnouncementBar } from "@/components/storefront/announcement-bar";
import { CartDrawer } from "@/components/storefront/cart-drawer";
import { DesktopNav, MobileNav } from "@/components/storefront/header-nav";
import { SearchModal } from "@/components/storefront/search-modal";
import { SiteLogo } from "@/components/storefront/site-logo";
import { siteConfig } from "@/config/site";
import type { CatalogCategory } from "@/lib/catalog/types";
import type { MenuItem } from "@/lib/validations/settings";
import { cn } from "@/lib/utils";
import { getCategories } from "@/server/services/catalog";
import { getSetting } from "@/server/services/settings";

/**
 * Storefront header in the admin-selected preset (Appearance → Header Layout). Every preset shares
 * the announcement bar, mobile menu sheet, search modal, cart drawer and mega menus; below `lg`
 * all presets collapse to the same compact mobile row.
 */
export async function SiteHeader() {
  const [branding, announcement, menu, { layout }, categories] = await Promise.all([
    getSetting("appearance.branding"),
    getSetting("appearance.announcement"),
    getSetting("header_menu"),
    getSetting("header_layout"),
    getCategories(),
  ]);
  const items = menu.items;
  const logo = (
    <Link href="/" className="shrink-0 leading-none" aria-label={`${siteConfig.name} home`}>
      <SiteLogo branding={branding} />
    </Link>
  );
  const searchLed = layout === "layout_3_categories_dropdown" || layout === "layout_5_compact_search";

  return (
    <>
      <AnnouncementBar settings={announcement} />
      {/* Positioned (sticky): inline navs anchor their full-width mega panels to this element. */}
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur-md">
        {/* Mobile & tablet: same compact row for every preset. */}
        <div className="container mx-auto grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 md:h-20 lg:hidden">
          <div className="flex items-center">
            <MobileMenu items={items} />
          </div>
          {logo}
          <Icons search={!searchLed} />
        </div>
        {searchLed && (
          <div className="container mx-auto px-4 pb-3 lg:hidden">
            <SearchModal variant="bar" />
          </div>
        )}

        {/* Desktop presets */}
        <div className="hidden lg:block">
          {layout === "layout_1_centered" && (
            <>
              <div className="container mx-auto grid h-20 grid-cols-[1fr_auto_1fr] items-center gap-4 px-4">
                <div>
                  <SearchModal />
                </div>
                <div className="text-center">{logo}</div>
                <Icons />
              </div>
              <DesktopNav items={items} />
            </>
          )}

          {layout === "layout_2_inline_standard" && (
            <div className="container mx-auto grid h-20 grid-cols-[1fr_auto_1fr] items-center gap-6 px-4">
              {logo}
              <DesktopNav items={items} variant="inline" />
              <Icons />
            </div>
          )}

          {layout === "layout_3_categories_dropdown" && (
            <>
              <div className="container mx-auto flex h-20 items-center gap-8 px-4">
                {logo}
                <SearchModal variant="bar" className="mx-auto max-w-2xl flex-1" />
                <Icons search={false} />
              </div>
              <div className="border-t">
                <div className="container mx-auto flex h-12 items-stretch gap-8 px-4">
                  <CategoryBrowser categories={categories} />
                  <DesktopNav items={items} variant="inline" />
                </div>
              </div>
            </>
          )}

          {layout === "layout_4_split_menu" && <SplitHeader items={items} logo={logo} />}

          {layout === "layout_5_compact_search" && (
            <>
              <div className="container mx-auto flex h-16 items-center gap-6 px-4">
                <div className="origin-left scale-[0.8]">{logo}</div>
                <SearchModal variant="bar" className="mx-auto h-12 max-w-3xl flex-1 border-primary/30 bg-background shadow-sm" />
                <Icons search={false} />
              </div>
              <DesktopNav items={items} className="[&>ul>li>a]:py-2.5 [&>ul>li>a]:after:bottom-1.5" />
            </>
          )}
        </div>
      </header>
    </>
  );
}

function MobileMenu({ items }: { items: MenuItem[] }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open menu">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle className="font-heading text-2xl tracking-[0.2em] uppercase">{siteConfig.name}</SheetTitle>
        </SheetHeader>
        <MobileNav items={items} />
      </SheetContent>
    </Sheet>
  );
}

/** Search (optional) · wishlist · account · cart. */
function Icons({ search = true }: { search?: boolean }) {
  return (
    <div className="flex items-center justify-end gap-0.5">
      {search && <SearchModal />}
      <Button variant="ghost" size="icon" aria-label="Wishlist" className="hidden sm:inline-flex">
        <Heart />
      </Button>
      <Button variant="ghost" size="icon" aria-label="Account" asChild className="hidden sm:inline-flex">
        <Link href="/account">
          <User />
        </Link>
      </Button>
      <CartDrawer />
    </div>
  );
}

/** Logo centred; menu items split evenly left and right (any odd item goes left). */
function SplitHeader({ items, logo }: { items: MenuItem[]; logo: React.ReactNode }) {
  const half = Math.ceil(items.length / 2);
  return (
    <div className="container mx-auto grid h-20 grid-cols-[1fr_auto_1fr] items-center gap-8 px-4">
      <div className="flex h-full items-center gap-4">
        <SearchModal />
        <DesktopNav items={items.slice(0, half)} variant="inline" className="ml-auto" label="Main (left)" />
      </div>
      {logo}
      <div className="flex h-full items-center gap-4">
        <DesktopNav items={items.slice(half)} variant="inline" label="Main (right)" />
        <div className="ml-auto">
          <Icons search={false} />
        </div>
      </div>
    </div>
  );
}

/** "Browse Categories" vertical dropdown (opens on hover and keyboard focus — no client JS). */
function CategoryBrowser({ categories }: { categories: CatalogCategory[] }) {
  return (
    <div className="group/cat relative flex w-64 shrink-0">
      <button
        type="button"
        aria-haspopup="true"
        className="flex w-full items-center gap-3 bg-primary px-4 text-left text-primary-foreground"
      >
        <LayoutGrid className="size-4 shrink-0" />
        <span className="flex-1 leading-tight">
          <span className="block text-[11px] font-semibold tracking-[0.18em] uppercase">Browse Categories</span>
          <span className="block font-bengali text-[11px] opacity-80">ক্যাটাগরি ব্রাউজ করুন</span>
        </span>
        <ChevronDown className="size-4 shrink-0 transition-transform group-hover/cat:rotate-180" />
      </button>
      <div
        className={cn(
          "absolute top-full left-0 z-50 w-full border border-t-0 bg-background shadow-2xl",
          "invisible opacity-0 transition-[opacity,visibility] duration-200 group-hover/cat:visible group-hover/cat:opacity-100 group-focus-within/cat:visible group-focus-within/cat:opacity-100",
        )}
      >
        <ul className="py-2">
          {categories.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/categories/${c.slug}`}
                className="group/link flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-muted/60"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{c.name}</span>
                  {c.nameBn && <span className="block truncate font-bengali text-xs text-muted-foreground">{c.nameBn}</span>}
                </span>
                <span className="text-xs text-muted-foreground tabular-nums">{c.productCount}</span>
                <ChevronRight className="size-3.5 text-muted-foreground transition-transform group-hover/link:translate-x-0.5" />
              </Link>
            </li>
          ))}
          <li className="mt-1 border-t pt-1">
            <Link href="/products" className="flex items-center justify-between px-4 py-2.5 text-sm font-medium text-primary hover:bg-muted/60">
              All products <ChevronRight className="size-3.5" />
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
