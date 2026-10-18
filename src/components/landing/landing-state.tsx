"use client";

import { createContext, useContext, useState } from "react";
import type { LandingOfferView } from "@/lib/landing/types";

/** Shares the selected offer between the checkout block and the sticky buy bar. */
type LandingState = {
  offerId: string | null;
  setOfferId: (id: string) => void;
  /** Builder preview: forms render but never submit, trackers stay off. */
  preview: boolean;
};

const Ctx = createContext<LandingState>({ offerId: null, setOfferId: () => {}, preview: false });

export function LandingStateProvider({
  defaultOffer,
  preview = false,
  children,
}: {
  defaultOffer: LandingOfferView | null;
  preview?: boolean;
  children: React.ReactNode;
}) {
  const [offerId, setOfferId] = useState<string | null>(defaultOffer?.id ?? null);
  return <Ctx.Provider value={{ offerId, setOfferId, preview }}>{children}</Ctx.Provider>;
}

export const useLandingState = () => useContext(Ctx);

export function scrollToCheckout() {
  document.getElementById("checkout")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/** CTA that smooth-scrolls to the embedded checkout. */
export function CheckoutButton({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <button type="button" onClick={scrollToCheckout} className={className}>
      {children}
    </button>
  );
}
