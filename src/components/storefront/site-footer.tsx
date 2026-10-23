import Link from "next/link";
import { MessageCircle, Music2 } from "lucide-react";
import { GeometricPattern } from "@/components/storefront/art";
import { InstagramIcon } from "@/components/storefront/home/instagram-feed";
import { siteConfig } from "@/config/site";
import type { FooterSettings } from "@/lib/validations/homepage";
import { getSetting } from "@/server/services/settings";

// lucide v1 dropped brand icons; inline glyphs (same stroke style as InstagramIcon).
function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
      <path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8.5a.5.5 0 0 1 .5-.5Z" />
    </svg>
  );
}

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden className={className}>
      <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
      <path d="m10 9.5 5 2.5-5 2.5z" fill="currentColor" />
    </svg>
  );
}

const socialIcons: Record<FooterSettings["social"][number]["platform"], React.ComponentType<{ className?: string }>> = {
  instagram: InstagramIcon,
  facebook: FacebookIcon,
  youtube: YoutubeIcon,
  tiktok: Music2,
  whatsapp: MessageCircle,
};

/** Storefront footer; content is managed in Admin → Appearance → Footer. */
export async function SiteFooter() {
  const footer = await getSetting("footer_settings");
  const { newsletter } = footer;
  const cols = 2 + footer.columns.length;
  const grid =
    cols <= 2
      ? "lg:grid-cols-[1.4fr_1.4fr]"
      : cols === 3
        ? "lg:grid-cols-[1.4fr_1fr_1.4fr]"
        : cols === 4
          ? "lg:grid-cols-[1.4fr_1fr_1fr_1.4fr]"
          : cols === 5
            ? "lg:grid-cols-[1.4fr_1fr_1fr_1fr_1.4fr]"
            : "lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr_1.4fr]";

  return (
    <footer className="relative mt-auto overflow-hidden bg-primary text-primary-foreground">
      <GeometricPattern color="#d8c08a" opacity={0.08} />
      <div className={`relative container mx-auto grid gap-12 px-4 py-16 md:grid-cols-2 ${grid}`}>
        <div className="space-y-4">
          <p className="font-heading text-3xl tracking-[0.3em] uppercase">{siteConfig.name}</p>
          {footer.about && <p className="max-w-xs text-sm leading-relaxed opacity-75">{footer.about}</p>}
          {footer.aboutBn && <p className="font-bengali text-sm opacity-75">{footer.aboutBn}</p>}
        </div>

        {footer.columns.map((column) => (
          <FooterColumn key={column.id} title={column.title}>
            {column.links.map((link, i) => (
              <FooterLink key={i} href={link.url}>
                {link.title}
              </FooterLink>
            ))}
          </FooterColumn>
        ))}

        <div className="space-y-4">
          {newsletter.enabled && (
            <>
              {newsletter.title && <p className="text-[11px] font-semibold tracking-[0.3em] text-gold uppercase">{newsletter.title}</p>}
              {newsletter.body && <p className="text-sm opacity-75">{newsletter.body}</p>}
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
                  {newsletter.buttonLabel || "Subscribe"}
                </button>
              </div>
            </>
          )}
          {footer.social.length > 0 && (
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {footer.social.map((s, i) => {
                const Icon = socialIcons[s.platform];
                return (
                  <a
                    key={i}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label ? undefined : s.platform}
                    className="inline-flex items-center gap-2 text-sm opacity-75 hover:opacity-100"
                  >
                    <Icon className="size-4" /> {s.label}
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="relative border-t border-primary-foreground/15">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-6 text-xs opacity-70 md:flex-row">
          <p>{footer.copyright || `© ${siteConfig.name}. All rights reserved.`}</p>
          {footer.payments.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {footer.payments.map((p) => (
                <span key={p} className="border border-primary-foreground/25 px-2 py-1 text-[10px] tracking-wider">
                  {p}
                </span>
              ))}
            </div>
          )}
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
