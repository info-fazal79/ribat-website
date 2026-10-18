import Link from "next/link";
import { GeometricPattern } from "@/components/storefront/art";
import { InstagramIcon } from "@/components/storefront/home/instagram-feed";
import { siteConfig, storefrontNav } from "@/config/site";

const help = [
  { title: "Track Order", href: "/account" },
  { title: "Size Guide", href: "/products" },
  { title: "Exchange Policy", href: "/products" },
  { title: "Contact Us", href: "/products" },
];

const payments = ["COD", "bKash", "Nagad", "VISA", "Mastercard"];

export function SiteFooter() {
  return (
    <footer className="relative mt-auto overflow-hidden bg-primary text-primary-foreground">
      <GeometricPattern color="#d8c08a" opacity={0.08} />
      <div className="relative container mx-auto grid gap-12 px-4 py-16 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.4fr]">
        <div className="space-y-4">
          <p className="font-heading text-3xl tracking-[0.3em] uppercase">{siteConfig.name}</p>
          <p className="max-w-xs text-sm leading-relaxed opacity-75">
            Premium Islamic lifestyle clothing, designed and finished in Dhaka. Modesty, crafted with intention.
          </p>
          <p className="font-bengali text-sm opacity-75">সারা বাংলাদেশে ক্যাশ অন ডেলিভারি</p>
        </div>

        <FooterColumn title="Shop">
          {storefrontNav.map((item) => (
            <FooterLink key={item.href} href={item.href}>
              {item.title}
            </FooterLink>
          ))}
        </FooterColumn>

        <FooterColumn title="Help">
          {help.map((item) => (
            <FooterLink key={item.title} href={item.href}>
              {item.title}
            </FooterLink>
          ))}
        </FooterColumn>

        <div className="space-y-4">
          <p className="text-[11px] font-semibold tracking-[0.3em] text-gold uppercase">Join the Ribat circle</p>
          <p className="text-sm opacity-75">Early access to Eid drops and members-only offers.</p>
          <div className="flex border border-primary-foreground/30">
            <input
              type="email"
              placeholder="Your email"
              aria-label="Email address"
              className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm placeholder:text-primary-foreground/50 focus:outline-none"
            />
            <button
              type="button"
              className="bg-gold px-5 text-[11px] font-semibold tracking-[0.2em] text-gold-foreground uppercase"
            >
              Subscribe
            </button>
          </div>
          <a
            href="https://instagram.com/ribat.bd"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm opacity-75 hover:opacity-100"
          >
            <InstagramIcon className="size-4" /> @ribat.bd
          </a>
        </div>
      </div>

      <div className="relative border-t border-primary-foreground/15">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-6 text-xs opacity-70 md:flex-row">
          <p>© {siteConfig.name}. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-2">
            {payments.map((p) => (
              <span key={p} className="border border-primary-foreground/25 px-2 py-1 text-[10px] tracking-wider">
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <p className="text-[11px] font-semibold tracking-[0.3em] text-gold uppercase">{title}</p>
      <nav className="flex flex-col gap-2.5 text-sm">{children}</nav>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="opacity-75 transition hover:opacity-100">
      {children}
    </Link>
  );
}
