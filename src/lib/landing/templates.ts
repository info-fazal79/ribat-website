import type { LandingSection, LandingSectionType } from "@/lib/validations/landing-page";

/** Starter layouts for new landing pages. Output must satisfy `landingSections`. */
export const landingTemplates = {
  "bengali-longform": {
    label: "Bengali long-form",
    body: "Hero, benefits, showcase, reviews, FAQ, countdown & checkout.",
  },
  minimal: {
    label: "Minimal",
    body: "Product hero + checkout. Fast to launch.",
  },
  "video-first": {
    label: "Video first",
    body: "Facebook-ad style hero with benefits and checkout.",
  },
} as const;

export type LandingTemplate = keyof typeof landingTemplates;

/**
 * Builder palette, in "Add block" order: label + description per block type.
 * `single` blocks may appear once per page (the checkout is the #checkout scroll target).
 */
export const blockCatalog: Record<LandingSectionType, { label: string; description: string; single?: boolean }> = {
  hero: { label: "Hero Banner", description: "Headline, featured image, price, urgency badge & buy CTA" },
  benefits: { label: "Benefits Grid", description: "Icon cards: fabric, craftsmanship, COD guarantee…" },
  gallery: { label: "Image / Video Showcase", description: "Interactive gallery, video and feature highlights" },
  offers: { label: "Offer Packages", description: "1 / 2 / 3-piece bundle cards with discount badges" },
  comparison: { label: "Comparison Table", description: "Ribat vs. ordinary market, feature by feature" },
  countdown: { label: "Urgency Countdown", description: "Full-width countdown timer banner" },
  reviews: { label: "Testimonials", description: "Customer reviews as a grid or swipeable carousel" },
  faq: { label: "FAQ Accordion", description: "Collapsible questions & answers" },
  checkout: { label: "1-Click Checkout", description: "Package, colour & size, address — COD order form", single: true },
  stickyBar: { label: "Sticky Quick-Buy Bar", description: "Mobile bottom bar with price & order button", single: true },
  richText: { label: "Text", description: "A paragraph of plain text" },
};

const inDays = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString();

/** A fresh block with sensible Bengali defaults. `id` must be unique within the page. */
export function newBlock(type: LandingSectionType, id: string, productName = "পণ্য"): LandingSection {
  switch (type) {
    case "hero":
      return {
        id,
        type,
        props: {
          headline: productName,
          subheadline: "সারা বাংলাদেশে ক্যাশ অন ডেলিভারি",
          badge: "সীমিত সময়ের অফার",
          ctaLabel: "এখনই অর্ডার করুন",
          showPrice: true,
        },
      };
    case "benefits":
      return {
        id,
        type,
        props: {
          title: "কেন রিবাত?",
          items: [
            { icon: "gem", title: "প্রিমিয়াম কোয়ালিটি", body: "প্রতিটি পণ্য দুইবার কোয়ালিটি চেক করা" },
            { icon: "truck", title: "দ্রুত ডেলিভারি", body: "ঢাকায় ১–২ দিন, সারা দেশে ২–৪ দিন" },
            { icon: "refresh", title: "৭ দিনের এক্সচেঞ্জ", body: "সাইজ না মিললে সহজ এক্সচেঞ্জ" },
          ],
        },
      };
    case "gallery":
      return { id, type, props: { title: "কাছ থেকে দেখুন", images: [], layout: "slider", highlights: [] } };
    case "reviews":
      return {
        id,
        type,
        props: {
          title: "গ্রাহকদের মতামত",
          source: "product",
          layout: "carousel",
          screenshotUrls: [],
          items: [
            { name: "তানভীর আহমেদ", location: "ঢাকা", rating: 5, body: "কোয়ালিটি অসাধারণ, ছবির মতোই পেয়েছি।", verified: true },
            { name: "নুসরাত জাহান", location: "চট্টগ্রাম", rating: 5, body: "দুই দিনেই ডেলিভারি পেয়েছি। ধন্যবাদ!", verified: true },
          ],
        },
      };
    case "faq":
      return {
        id,
        type,
        props: {
          title: "সাধারণ জিজ্ঞাসা",
          items: [
            { question: "ডেলিভারি কতদিনে পাবো?", answer: "ঢাকার ভিতরে ১–২ দিন, ঢাকার বাইরে ২–৪ দিন।" },
            { question: "পণ্য দেখে টাকা দেওয়া যাবে?", answer: "হ্যাঁ, ক্যাশ অন ডেলিভারিতে পণ্য দেখে টাকা দিতে পারবেন।" },
          ],
        },
      };
    case "countdown":
      return { id, type, props: { label: "⏰ অফার শেষ হতে বাকি", endsAt: inDays(3) } };
    case "richText":
      return { id, type, props: { html: "" } };
    case "checkout":
      return { id, type, props: { title: "অর্ডার করতে নিচের ফর্মটি পূরণ করুন", buttonLabel: "অর্ডার কনফার্ম করুন" } };
    case "offers":
      return {
        id,
        type,
        props: { title: "আপনার প্যাকেজ বেছে নিন", subtitle: "বেশি নিলে বেশি সাশ্রয় — ৩ পিসে ফ্রি ডেলিভারি", ctaLabel: "এই প্যাকেজটি নিন" },
      };
    case "comparison":
      return {
        id,
        type,
        props: {
          title: "কেন রিবাত আলাদা?",
          oursLabel: "রিবাত",
          othersLabel: "সাধারণ বাজার",
          rows: [
            { feature: "প্রিমিয়াম ফেব্রিক, দুইবার কোয়ালিটি চেক", ours: true, others: false },
            { feature: "নিখুঁত সেলাই ও ফিনিশিং", ours: true, others: false },
            { feature: "পণ্য দেখে ক্যাশ অন ডেলিভারি", ours: true, others: true },
            { feature: "৭ দিনের সহজ এক্সচেঞ্জ", ours: true, others: false },
            { feature: "রঙ না ওঠার গ্যারান্টি", ours: true, others: false },
          ],
        },
      };
    case "stickyBar":
      return { id, type, props: { buttonLabel: "অর্ডার করতে চাই", showPrice: true } };
  }
}

export function buildTemplateSections(template: LandingTemplate, productName: string): LandingSection[] {
  const types: LandingSectionType[] =
    template === "minimal"
      ? ["hero", "checkout"]
      : template === "video-first"
        ? ["hero", "benefits", "checkout"]
        : ["hero", "benefits", "gallery", "reviews", "faq", "countdown", "checkout"];
  return types.map((type) => newBlock(type, type, productName));
}

/** 1 / 2 / 3-piece bundle offers from a unit price (rounded to ৳10). */
export function bundleOffers(unitPrice: number) {
  const round10 = (n: number) => Math.round(n / 10) * 10;
  return [
    { label: "১ পিস", quantity: 1, price: unitPrice, compareAtPrice: null, badge: null, freeShipping: false, isDefault: true },
    {
      label: "২ পিস",
      quantity: 2,
      price: round10(unitPrice * 2 * 0.92),
      compareAtPrice: unitPrice * 2,
      badge: "জনপ্রিয়",
      freeShipping: false,
      isDefault: false,
    },
    {
      label: "৩ পিস + ফ্রি ডেলিভারি",
      quantity: 3,
      price: round10(unitPrice * 3 * 0.86),
      compareAtPrice: unitPrice * 3,
      badge: "সেরা ডিল",
      freeShipping: true,
      isDefault: false,
    },
  ];
}
