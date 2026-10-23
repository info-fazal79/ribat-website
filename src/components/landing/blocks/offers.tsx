"use client";

import { Check, Truck } from "lucide-react";
import { SectionTitle } from "@/components/landing/blocks/content-blocks";
import { scrollToCheckout, useLandingState } from "@/components/landing/landing-state";
import type { LandingPageView } from "@/lib/landing/types";
import { discountPercent, formatBDTBn, toBnDigits } from "@/lib/money";
import type { LandingSection } from "@/lib/validations/landing-page";
import { cn } from "@/lib/utils";

type OffersProps = Extract<LandingSection, { type: "offers" }>["props"];

/** Bundle offers as package cards. Choosing one preselects it in the checkout and scrolls there. */
export function OffersBlock({ props, page }: { props: OffersProps; page: LandingPageView }) {
  const { offerId, setOfferId } = useLandingState();
  if (page.offers.length === 0) return null;
  const cols = page.offers.length >= 3 ? "@3xl:grid-cols-3" : page.offers.length === 2 ? "@3xl:grid-cols-2" : "";

  return (
    <section className="bg-[linear-gradient(180deg,#fbf8f2,#f1eadc)] px-5 py-14 @3xl:py-20">
      <div className="mx-auto max-w-5xl">
        {props.title && <SectionTitle>{props.title}</SectionTitle>}
        {props.subtitle && <p className="-mt-4 mb-8 text-center font-bengali text-muted-foreground">{props.subtitle}</p>}
        <div className={cn("grid gap-5 pt-3", cols)}>
          {page.offers.map((o) => {
            const selected = o.id === offerId;
            const pct = discountPercent(o.price, o.compareAtPrice);
            const unit = Math.round(o.price / o.quantity);
            return (
              <div
                key={o.id}
                className={cn(
                  "relative flex flex-col rounded-3xl border-2 bg-card p-6 text-center shadow-sm transition",
                  selected ? "border-primary shadow-xl shadow-primary/10 @3xl:-translate-y-1" : "border-transparent ring-1 ring-black/5",
                )}
              >
                {o.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#b8862f] to-[#d8c08a] px-4 py-1 text-xs font-bold whitespace-nowrap text-[#13231e] shadow">
                    {o.badge}
                  </span>
                )}
                <p className="mt-2 font-bengali text-lg font-semibold">{o.label}</p>
                <p className="mt-3 font-sans text-3xl font-bold">{formatBDTBn(o.price)}</p>
                <p className="mt-1 h-5 text-sm text-muted-foreground">
                  {o.compareAtPrice && <span className="line-through">{formatBDTBn(o.compareAtPrice)}</span>}
                  {pct > 0 && <span className="ml-2 font-semibold text-emerald-700">{toBnDigits(pct)}% সাশ্রয়</span>}
                </p>
                <ul className="my-5 space-y-1.5 text-left font-bengali text-sm">
                  {o.quantity > 1 && (
                    <li className="flex items-center gap-2">
                      <Check className="size-4 text-primary" /> প্রতি পিস মাত্র {formatBDTBn(unit)}
                    </li>
                  )}
                  <li className="flex items-center gap-2">
                    <Truck className="size-4 text-primary" /> {o.freeShipping ? "ফ্রি হোম ডেলিভারি" : "সারা দেশে হোম ডেলিভারি"}
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-4 text-primary" /> পণ্য দেখে টাকা পরিশোধ
                  </li>
                </ul>
                <button
                  type="button"
                  onClick={() => {
                    setOfferId(o.id);
                    scrollToCheckout();
                  }}
                  className={cn(
                    "mt-auto h-12 rounded-xl font-bengali font-bold transition active:scale-[0.98]",
                    selected ? "bg-primary text-primary-foreground shadow-lg" : "border-2 border-primary text-primary hover:bg-primary/5",
                  )}
                >
                  {props.ctaLabel}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
