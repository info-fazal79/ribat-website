import { newBlock } from "@/lib/landing/templates";
import { discountPercent, toBnDigits } from "@/lib/money";
import type { LandingOfferInput, LandingSection } from "@/lib/validations/landing-page";

/** The product facts the 1-click generator writes copy from. */
export type GeneratorProduct = {
  name: string;
  nameBn: string | null;
  shortDescription: string | null;
  fabricCare: string | null;
  badge: string | null;
  type: "SIMPLE" | "VARIABLE";
  /** Lowest active variant price. */
  price: number;
  colors: string[];
  sizes: string[];
};

const plain = (s: string | null, max: number) => {
  const t = (s ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
};
const lines = (s: string | null) =>
  (s ?? "")
    .replace(/<\/(p|li|div)>|<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .split(/\n|•/)
    .map((l) => l.trim())
    .filter(Boolean);
const inDays = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString();
const round10 = (n: number) => Math.round(n / 10) * 10;

/**
 * Smart offer packages: 1 pc; 2 pcs at ~8% off with a discount badge; 3 pcs at ~14% off with
 * free delivery. Prices round to ৳10.
 */
export function generateOffers(unitPrice: number): LandingOfferInput[] {
  const two = round10(unitPrice * 2 * 0.92);
  return [
    { label: "১ পিস", quantity: 1, price: unitPrice, compareAtPrice: null, badge: null, freeShipping: false, isDefault: true },
    {
      label: "২ পিস",
      quantity: 2,
      price: two,
      compareAtPrice: two < unitPrice * 2 ? unitPrice * 2 : null,
      badge: two < unitPrice * 2 ? `${toBnDigits(discountPercent(two, unitPrice * 2))}% ছাড়` : "জনপ্রিয়",
      freeShipping: false,
      isDefault: false,
    },
    {
      label: "৩ পিস + ফ্রি ডেলিভারি",
      quantity: 3,
      price: round10(unitPrice * 3 * 0.86),
      compareAtPrice: round10(unitPrice * 3 * 0.86) < unitPrice * 3 ? unitPrice * 3 : null,
      badge: "সেরা ডিল · ফ্রি ডেলিভারি",
      freeShipping: true,
      isDefault: false,
    },
  ];
}

/**
 * A complete conversion page for one product: hero → benefits → gallery → offer packages →
 * checkout (with colour/size pickers for variable products) → reviews → FAQ, plus the mobile
 * quick-buy bar. Images aren't copied: hero and gallery read the product's photos at render time,
 * so they stay in sync with the catalog.
 */
export function generateLandingSections(p: GeneratorProduct): LandingSection[] {
  const title = p.nameBn ?? p.name;
  const fabric = lines(p.fabricCare);
  const variable = p.type === "VARIABLE" && (p.colors.length > 0 || p.sizes.length > 0);
  const id = (type: string) => `${type}-gen`;

  const hero: LandingSection = {
    id: id("hero"),
    type: "hero",
    props: {
      headline: title,
      subheadline:
        plain(p.shortDescription, 220) ||
        `${p.nameBn ? `${p.name} · ` : ""}প্রিমিয়াম কোয়ালিটি — সারা বাংলাদেশে ক্যাশ অন ডেলিভারি`,
      badge: p.badge ? `${p.badge} · সীমিত স্টক` : "🔥 সীমিত সময়ের অফার",
      ctaLabel: "এখনই অর্ডার করুন",
      showPrice: true,
      countdownEndsAt: inDays(2),
    },
  };

  const benefits: LandingSection = {
    id: id("benefits"),
    type: "benefits",
    props: {
      title: `কেন ${title}?`,
      items: [
        { icon: "gem", title: "প্রিমিয়াম ফেব্রিক", body: plain(fabric[0] ?? null, 120) || "বাছাই করা আরামদায়ক ফেব্রিক, দীর্ঘদিন টেকসই" },
        { icon: "sparkles", title: "নিখুঁত কারুকাজ", body: "দক্ষ কারিগরের হাতে নিখুঁত সেলাই ও ফিনিশিং" },
        { icon: "leaf", title: "আরামদায়ক ও শ্বাসপ্রশ্বাসযোগ্য", body: "বাংলাদেশের আবহাওয়ার উপযোগী — সারাদিন আরাম" },
        { icon: "shield", title: "ক্যাশ অন ডেলিভারি গ্যারান্টি", body: "পণ্য হাতে পেয়ে, দেখে তারপর টাকা দিন" },
        { icon: "truck", title: "দ্রুত ডেলিভারি", body: "ঢাকায় ১–২ দিন, সারা দেশে ২–৪ দিন" },
        { icon: "refresh", title: "৭ দিনের এক্সচেঞ্জ", body: "সাইজ না মিললে সহজ এক্সচেঞ্জ" },
      ],
    },
  };

  const highlights = [
    ...(p.colors.length ? [{ title: "কালার", body: p.colors.join(", ") }] : []),
    ...(p.sizes.length ? [{ title: "সাইজ", body: p.sizes.join(", ") }] : []),
    ...fabric.slice(1, 3).map((l) => ({ title: plain(l, 80) })),
  ];
  const gallery: LandingSection = {
    id: id("gallery"),
    type: "gallery",
    props: { title: "কাছ থেকে দেখুন", images: [], layout: "slider", highlights },
  };

  const faq: LandingSection = {
    id: id("faq"),
    type: "faq",
    props: {
      title: "সাধারণ জিজ্ঞাসা",
      items: [
        { question: "ডেলিভারি কতদিনে পাবো?", answer: "ঢাকার ভিতরে ১–২ দিন, ঢাকার বাইরে ২–৪ দিনের মধ্যে।" },
        { question: "পণ্য দেখে টাকা দেওয়া যাবে?", answer: "হ্যাঁ, ক্যাশ অন ডেলিভারি — পণ্য হাতে পেয়ে দেখে তারপর টাকা দিন।" },
        ...(p.sizes.length
          ? [{ question: "কোন সাইজ নেব?", answer: `${p.sizes.join(", ")} সাইজ পাওয়া যাচ্ছে। সাইজ না মিললে ৭ দিনের মধ্যে এক্সচেঞ্জ করতে পারবেন।` }]
          : []),
        ...(fabric.length ? [{ question: "ফেব্রিক ও যত্ন", answer: plain(fabric.join(" · "), 400) }] : []),
        { question: "অর্ডার কনফার্ম হবে কীভাবে?", answer: "অর্ডারের পর আমাদের প্রতিনিধি ফোন করে অর্ডারটি কনফার্ম করবেন।" },
      ],
    },
  };

  return [
    hero,
    benefits,
    gallery,
    newBlock("offers", id("offers")),
    {
      id: id("checkout"),
      type: "checkout",
      props: {
        title: variable ? "কালার ও সাইজ বেছে নিয়ে অর্ডার করুন" : "অর্ডার করতে নিচের ফর্মটি পূরণ করুন",
        buttonLabel: "অর্ডার কনফার্ম করুন",
      },
    },
    // Real approved product reviews only — add curated testimonials in the builder.
    { id: id("reviews"), type: "reviews", props: { title: "গ্রাহকদের মতামত", source: "product", layout: "carousel", screenshotUrls: [], items: [] } },
    faq,
    newBlock("stickyBar", id("stickyBar")),
  ];
}
