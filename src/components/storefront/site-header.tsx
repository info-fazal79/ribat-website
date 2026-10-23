import Link from "next/link";
import { Heart, Menu, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AnnouncementBar } from "@/components/storefront/announcement-bar";
import { CartDrawer } from "@/components/storefront/cart-drawer";
import { SiteLogo } from "@/components/storefront/site-logo";
import { siteConfig, storefrontNav } from "@/config/site";
import { getSetting } from "@/server/services/settings";

export async function SiteHeader() {
  const [branding, announcement] = await Promise.all([getSetting("appearance.branding"), getSetting("appearance.announcement")]);
  return (
    <>
      <AnnouncementBar settings={announcement} />
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur-md">
        <div className="container mx-auto grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 md:h-20">
          <div className="flex items-center">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                  <Menu />
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle className="font-heading text-2xl tracking-[0.2em] uppercase">{siteConfig.name}</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col px-4">
                  {storefrontNav.map((item) => (
                    <Link key={item.href} href={item.href} className="border-b py-4 text-sm tracking-widest uppercase">
                      {item.title}
                    </Link>
                  ))}
                  <Link href="/products" className="py-4 text-sm font-semibold tracking-widest uppercase">
                    Shop All
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
            <Button variant="ghost" size="icon" aria-label="Search" className="hidden lg:inline-flex">
              <Search />
            </Button>
          </div>

          <Link href="/" className="text-center leading-none">
            <SiteLogo branding={branding} />
          </Link>

          <div className="flex items-center justify-end gap-0.5">
            <Button variant="ghost" size="icon" aria-label="Search" className="lg:hidden">
              <Search />
            </Button>
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
        </div>
        <nav className="hidden justify-center gap-10 border-t py-3.5 lg:flex">
          {storefrontNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="relative text-[11px] font-medium tracking-[0.2em] uppercase text-foreground/70 transition-colors after:absolute after:inset-x-0 after:-bottom-1 after:h-px after:origin-left after:scale-x-0 after:bg-foreground after:transition-transform hover:text-foreground hover:after:scale-x-100"
            >
              {item.title}
            </Link>
          ))}
        </nav>
      </header>
    </>
  );
}
