import Link from "next/link";
import { Heart, Menu, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { CartDrawer } from "@/components/storefront/cart-drawer";
import { announcements, siteConfig, storefrontNav } from "@/config/site";

function AnnouncementBar() {
  // Duplicated list so the marquee loops seamlessly at -50%.
  const items = [...announcements, ...announcements];
  return (
    <div className="overflow-hidden bg-primary py-2 text-[11px] tracking-[0.2em] text-primary-foreground uppercase">
      <div className="flex w-max" style={{ animation: "ribat-marquee 40s linear infinite" }}>
        {items.map((text, i) => (
          <span key={i} className="flex items-center gap-10 px-5" aria-hidden={i >= announcements.length}>
            <span className={/[ঀ-৿]/.test(text) ? "font-bengali tracking-normal normal-case" : undefined}>
              {text}
            </span>
            <span className="text-gold">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function SiteHeader() {
  return (
    <>
      <AnnouncementBar />
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
            <span className="block font-heading text-3xl font-semibold tracking-[0.35em] uppercase md:text-4xl">
              {siteConfig.name}
            </span>
            <span className="mt-1 hidden text-[9px] tracking-[0.4em] text-muted-foreground uppercase md:block">
              Est. Dhaka
            </span>
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
