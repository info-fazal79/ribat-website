import { Banknote, RefreshCw, ShieldCheck, Truck } from "lucide-react";
import { GeometricPattern, ProductArt } from "@/components/storefront/art";
import { StarRating } from "@/components/storefront/star-rating";
import { Countdown } from "@/components/landing/countdown";
import { Img, Video } from "@/components/landing/blocks/media";
import { CheckoutButton } from "@/components/landing/landing-state";
import { defaultOffer, type LandingPageView } from "@/lib/landing/types";
import { discountPercent, formatBDTBn, toBnDigits } from "@/lib/money";
import type { LandingSection } from "@/lib/validations/landing-page";

type HeroProps = Extract<LandingSection, { type: "hero" }>["props"];

const trust = [
  { icon: Banknote, label: "ক্যাশ অন ডেলিভারি" },
  { icon: Truck, label: "সারা দেশে ডেলিভারি" },
  { icon: RefreshCw, label: "৭ দিনে এক্সচেঞ্জ" },
  { icon: ShieldCheck, label: "১০০% অরিজিনাল" },
];

export function HeroBlock({ props, page }: { props: HeroProps; page: LandingPageView }) {
  const offer = defaultOffer(page.offers);
  const discount = offer ? discountPercent(offer.price, offer.compareAtPrice) : 0;
  const cover = page.product.images[0];

  return (
    <section className="relative overflow-hidden bg-[radial-gradient(120%_80%_at_50%_0%,#24463c_0%,#0b1a16_70%)] text-[#f6f1e7]">
      <GeometricPattern color="#d8c08a" opacity={0.12} />
      <div className="relative mx-auto grid max-w-5xl items-center gap-8 px-5 pt-10 pb-14 @3xl:grid-cols-2 @3xl:gap-12 @3xl:pt-16 @3xl:pb-20">
        <div className="order-2 space-y-5 text-center @3xl:order-1 @3xl:text-left">
          {props.badge && (
            <span className="inline-flex items-center gap-2 rounded-full border border-[#d8c08a]/50 bg-[#d8c08a]/10 px-4 py-1.5 text-sm font-medium text-[#e6d3a6]">
              <span className="size-1.5 animate-pulse rounded-full bg-[#d8c08a]" />
              {props.badge}
            </span>
          )}
          <h1 className="font-bengali text-3xl leading-snug font-bold @3xl:text-5xl @3xl:leading-tight">{props.headline}</h1>
          {props.subheadline && <p className="text-base leading-relaxed text-[#f6f1e7]/80 @3xl:text-lg">{props.subheadline}</p>}

          {page.product.reviewCount > 0 && (
            <div className="flex items-center justify-center gap-2 @3xl:justify-start">
              <StarRating rating={page.product.rating} size="md" />
              <span className="text-sm text-[#f6f1e7]/75">
                {toBnDigits(page.product.rating.toFixed(1))} · {toBnDigits(page.product.reviewCount)}+ রিভিউ
              </span>
            </div>
          )}

          {props.showPrice && offer && (
            <div className="flex flex-wrap items-center justify-center gap-3 @3xl:justify-start">
              <span className="font-sans text-4xl font-bold text-[#e6d3a6]">{formatBDTBn(offer.price)}</span>
              {offer.compareAtPrice && (
                <span className="text-xl text-[#f6f1e7]/50 line-through">{formatBDTBn(offer.compareAtPrice)}</span>
              )}
              {discount > 0 && (
                <span className="rounded-full bg-red-600 px-3 py-1 text-sm font-bold text-white shadow-lg shadow-red-900/30">
                  {toBnDigits(discount)}% ছাড়
                </span>
              )}
            </div>
          )}

          {props.countdownEndsAt && (
            <Countdown
              endsAt={props.countdownEndsAt}
              label="⏰ অফার শেষ হতে বাকি"
              className="flex flex-col items-center @3xl:items-start"
            />
          )}

          <CheckoutButton className="group inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#d8c08a] px-10 text-lg font-bold text-[#13231e] shadow-xl shadow-black/30 transition hover:bg-[#e6d3a6] active:scale-[0.98] @3xl:w-auto">
            {props.ctaLabel}
            <span className="transition-transform group-hover:translate-y-0.5">↓</span>
          </CheckoutButton>

          <ul className="grid grid-cols-2 gap-x-4 gap-y-2 pt-2 text-sm text-[#f6f1e7]/80 @2xl:grid-cols-4 @3xl:grid-cols-2 @5xl:grid-cols-4">
            {trust.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center justify-center gap-1.5 @3xl:justify-start">
                <Icon className="size-4 shrink-0 text-[#d8c08a]" /> {label}
              </li>
            ))}
          </ul>
        </div>

        <div className="order-1 @3xl:order-2">
          {props.videoUrl ? (
            <Video url={props.videoUrl} title={props.headline} />
          ) : (
            <div className="relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-[2rem] shadow-2xl ring-1 ring-[#d8c08a]/30">
              {props.imageUrl || cover ? (
                <Img
                  src={props.imageUrl ?? cover!.url}
                  alt={cover?.alt ?? page.product.name}
                  className="size-full object-cover"
                />
              ) : (
                <ProductArt kind={page.product.art} color={page.product.color} className="size-full" />
              )}
              {discount > 0 && (
                <span className="absolute top-4 right-4 grid size-20 place-items-center rounded-full bg-red-600 text-center text-sm leading-tight font-bold text-white shadow-lg">
                  {toBnDigits(discount)}%
                  <br />
                  ছাড়
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
