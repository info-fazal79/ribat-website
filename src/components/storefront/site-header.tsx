import Link from "next/link";
import { Heart, Menu, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AnnouncementBar } from "@/components/storefront/announcement-bar";
import { CartDrawer } from "@/components/storefront/cart-drawer";
import { DesktopNav, MobileNav } from "@/components/storefront/header-nav";
import { SearchModal } from "@/components/storefront/search-modal";
import { SiteLogo } from "@/components/storefront/site-logo";
import { siteConfig } from "@/config/site";
import { getSetting } from "@/server/services/settings";

export async function SiteHeader() {
  const [branding, announcement, menu] = await Promise.all([
    getSetting("appearance.branding"),
    getSetting("appearance.announcement"),
    getSetting("header_menu"),
  ]);
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
                <MobileNav items={menu.items} />
              </SheetContent>
            </Sheet>
            <SearchModal className="hidden lg:inline-flex" />
          </div>

          <Link href="/" className="text-center leading-none">
            <SiteLogo branding={branding} />
          </Link>

          <div className="flex items-center justify-end gap-0.5">
            <SearchModal className="lg:hidden" />
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
        <DesktopNav items={menu.items} />
      </header>
    </>
  );
}
