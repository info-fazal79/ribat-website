import { CheckoutBlock } from "@/components/landing/blocks/checkout";
import {
  BenefitsBlock,
  CountdownBlock,
  GalleryBlock,
  ReviewsBlock,
  TextBlock,
} from "@/components/landing/blocks/content-blocks";
import { FaqBlock } from "@/components/landing/blocks/faq";
import { FacebookPixel } from "@/components/landing/facebook-pixel";
import { HeroBlock } from "@/components/landing/blocks/hero";
import { LandingStateProvider } from "@/components/landing/landing-state";
import { StickyBuyBar } from "@/components/landing/sticky-buy-bar";
import { ViewTracker } from "@/components/landing/view-tracker";
import { defaultOffer, type LandingPageView } from "@/lib/landing/types";
import type { LandingSection } from "@/lib/validations/landing-page";
import { cn } from "@/lib/utils";

/**
 * Renders a landing page from its typed blocks. Used by /lp/[slug] and the admin
 * builder preview (preview=true disables ordering and view tracking). Add a block by:
 *  1. adding its Zod schema to src/lib/validations/landing-page.ts
 *  2. adding a case here (TypeScript enforces exhaustiveness)
 *  3. adding an editor in components/admin/landing-builder/block-editors.tsx
 */
export function LandingView({ page, preview = false }: { page: LandingPageView; preview?: boolean }) {
  const visible = page.sections.filter((s) => !s.hidden);
  const hasCheckout = visible.some((s) => s.type === "checkout");
  const style = page.theme.accent ? ({ "--primary": page.theme.accent } as React.CSSProperties) : undefined;

  return (
    <LandingStateProvider defaultOffer={defaultOffer(page.offers)} preview={preview}>
      <div
        style={{ ...style, ...(page.theme.background && { backgroundColor: page.theme.background }) }}
        // Container queries (@3xl: etc.) let the builder's mobile preview reflow like a phone.
        className={cn("@container", page.theme.font === "serif" ? "font-heading" : "font-bengali")}
      >
        {visible.map((section) => (
          <Section key={section.id} section={section} page={page} />
        ))}
        {hasCheckout && <StickyBuyBar offers={page.offers} />}
        <footer className="bg-[#0b1a16] px-5 pt-8 pb-28 text-center text-xs text-[#f6f1e7]/60 @3xl:pb-8">
          © Ribat — Islamic Lifestyle & Premium Clothing · ক্যাশ অন ডেলিভারি সারা বাংলাদেশে
        </footer>
      </div>
      {!preview && <ViewTracker landingPageId={page.id} />}
      {!preview && page.facebookPixelId && <FacebookPixel pixelId={page.facebookPixelId} />}
    </LandingStateProvider>
  );
}

function Section({ section, page }: { section: LandingSection; page: LandingPageView }) {
  switch (section.type) {
    case "hero":
      return <HeroBlock props={section.props} page={page} />;
    case "benefits":
      return <BenefitsBlock props={section.props} />;
    case "gallery":
      return <GalleryBlock props={section.props} page={page} />;
    case "reviews":
      return <ReviewsBlock props={section.props} page={page} />;
    case "faq":
      return <FaqBlock props={section.props} />;
    case "countdown":
      return <CountdownBlock props={section.props} />;
    case "richText":
      return <TextBlock props={section.props} />;
    case "checkout":
      return <CheckoutBlock props={section.props} page={page} />;
    default: {
      const exhaustive: never = section;
      return exhaustive;
    }
  }
}
