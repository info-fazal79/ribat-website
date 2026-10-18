import type { LandingSection } from "@/lib/validations/landing-page";

/** Starter layouts for new landing pages. Output must satisfy `landingSections`. */
export const landingTemplates = {
  "bengali-longform": {
    label: "Bengali long-form",
    body: "Hero, benefits, reviews, FAQ, countdown & checkout.",
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

export function buildTemplateSections(template: LandingTemplate, productName: string): LandingSection[] {
  const hero: LandingSection = {
    id: "hero",
    type: "hero",
    props: { headline: productName, subheadline: "সারা বাংলাদেশে ক্যাশ অন ডেলিভারি", ctaLabel: "এখনই অর্ডার করুন" },
  };
  const checkout: LandingSection = {
    id: "checkout",
    type: "checkout",
    props: { title: "অর্ডার করতে নিচের ফর্মটি পূরণ করুন", buttonLabel: "অর্ডার কনফার্ম করুন" },
  };
  const benefits: LandingSection = {
    id: "benefits",
    type: "benefits",
    props: {
      title: "কেন রিবাত?",
      items: [
        { title: "প্রিমিয়াম কোয়ালিটি", body: "প্রতিটি পণ্য দুইবার কোয়ালিটি চেক করা" },
        { title: "ক্যাশ অন ডেলিভারি", body: "পণ্য হাতে পেয়ে টাকা দিন" },
        { title: "৭ দিনের এক্সচেঞ্জ", body: "সাইজ না মিললে সহজ এক্সচেঞ্জ" },
      ],
    },
  };

  switch (template) {
    case "minimal":
      return [hero, checkout];
    case "video-first":
      return [hero, benefits, checkout];
    case "bengali-longform":
      return [
        hero,
        benefits,
        { id: "reviews", type: "reviews", props: { title: "গ্রাহকদের মতামত", source: "product", screenshotUrls: [] } },
        {
          id: "faq",
          type: "faq",
          props: {
            title: "সাধারণ জিজ্ঞাসা",
            items: [
              { question: "ডেলিভারি কতদিনে পাবো?", answer: "ঢাকার ভিতরে ১–২ দিন, ঢাকার বাইরে ২–৪ দিন।" },
              { question: "পণ্য দেখে টাকা দেওয়া যাবে?", answer: "হ্যাঁ, ক্যাশ অন ডেলিভারিতে পণ্য দেখে টাকা দিতে পারবেন।" },
            ],
          },
        },
        checkout,
      ];
  }
}
