"use client";

import { useEffect, useState } from "react";
import { ShoppingBag } from "lucide-react";
import { scrollToCheckout, useLandingState } from "@/components/landing/landing-state";
import type { LandingOfferView } from "@/lib/landing/types";
import { formatBDTBn } from "@/lib/money";
import { cn } from "@/lib/utils";

/**
 * Mobile-only bottom bar; hides while the checkout form is on screen. In the builder canvas it
 * renders in place at every width so it can be selected and edited.
 */
export function StickyBuyBar({
  offers,
  buttonLabel = "অর্ডার করতে চাই",
  showPrice = true,
  inline = false,
}: {
  offers: LandingOfferView[];
  buttonLabel?: string;
  showPrice?: boolean;
  inline?: boolean;
}) {
  const { offerId, preview } = useLandingState();
  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const offer = offers.find((o) => o.id === offerId) ?? offers[0];

  useEffect(() => {
    const el = document.getElementById("checkout");
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setCheckoutVisible(entry.isIntersecting), { threshold: 0.1 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  if (!offer) return null;

  return (
    <div
      className={cn(
        "inset-x-0 bottom-0 z-40 border-t bg-background/95 px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur transition-transform duration-300",
        inline ? "relative" : "@3xl:hidden",
        !inline && (preview ? "sticky" : "fixed pb-[max(0.75rem,env(safe-area-inset-bottom))]"),
        !inline && checkoutVisible && "translate-y-full",
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn("min-w-0 flex-1", !showPrice && "sr-only")}>
          <p className="truncate font-bengali text-xs text-muted-foreground">{offer.label}</p>
          <p className="font-sans text-lg leading-tight font-bold">
            {formatBDTBn(offer.price)}
            {offer.compareAtPrice && (
              <span className="ml-2 text-xs font-normal text-muted-foreground line-through">
                {formatBDTBn(offer.compareAtPrice)}
              </span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={scrollToCheckout}
          className={cn(
            "inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 font-bengali font-bold text-primary-foreground shadow-lg active:scale-95",
            !showPrice && "flex-1",
          )}
        >
          <ShoppingBag className="size-4" /> {buttonLabel}
        </button>
      </div>
    </div>
  );
}
