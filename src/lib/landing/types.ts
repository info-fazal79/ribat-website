import type { ArtKind } from "@/lib/catalog/types";
import type { LandingSection, LandingTheme } from "@/lib/validations/landing-page";

/**
 * Everything a landing page needs to render — produced by the landing-pages service for
 * /lp/[slug] and assembled from draft state for the admin builder's live preview.
 * Money is display-only; the order action recomputes from offer/zone IDs.
 */
export type LandingOfferView = {
  id: string;
  label: string;
  quantity: number;
  price: number;
  compareAtPrice: number | null;
  badge: string | null;
  freeShipping: boolean;
  isDefault: boolean;
};

export type LandingVariantView = {
  id: string;
  color: string | null;
  colorHex: string | null;
  size: string | null;
  stock: number;
};

export type LandingZoneView = { id: string; name: string; fee: number; estimatedDays: string | null };

export type LandingReviewView = { name: string; location?: string; rating: number; body: string; verified: boolean };

export type LandingPageView = {
  id: string;
  slug: string;
  title: string;
  sections: LandingSection[];
  theme: LandingTheme;
  product: {
    id: string;
    name: string;
    nameBn: string | null;
    art: ArtKind;
    color: string;
    images: { url: string; alt: string | null }[];
    rating: number;
    reviewCount: number;
  };
  variants: LandingVariantView[];
  offers: LandingOfferView[];
  zones: LandingZoneView[];
  facebookPixelId: string | null;
  /** Approved product reviews (used when a reviews block's source is "product"). */
  productReviews: LandingReviewView[];
};

export function defaultOffer(offers: LandingOfferView[]) {
  return offers.find((o) => o.isDefault) ?? offers[0] ?? null;
}
