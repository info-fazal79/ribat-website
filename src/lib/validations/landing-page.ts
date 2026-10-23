import { z } from "zod";

/**
 * Schema for LandingPage.sections (JSON column).
 * Bump LANDING_SCHEMA_VERSION when a block's shape changes incompatibly and add a
 * migration for stored JSON (LandingPage.schemaVersion). Optional additions don't need a bump.
 */
export const LANDING_SCHEMA_VERSION = 1;

// Bengali copy is common on landing pages; text fields accept any Unicode.
const text = z.string().max(2000);
// Full URL or a site path — Media Library uploads are served from /media/….
const imageUrl = z
  .string()
  .trim()
  .max(2000)
  .regex(/^(https?:\/\/|\/)\S+$/, "Use an image from the Media Library or a full https:// URL");

const base = {
  id: z.string().min(1),
  /** Disabled in the builder — kept in the page but not rendered. */
  hidden: z.boolean().optional(),
};

/** Icon keys the benefits block can render (see components/landing/icons.ts). */
export const benefitIcons = [
  "sparkles",
  "gem",
  "shield",
  "truck",
  "clock",
  "leaf",
  "droplet",
  "heart",
  "badge",
  "sun",
  "gift",
  "refresh",
] as const;

export const heroBlock = z.object({
  ...base,
  type: z.literal("hero"),
  props: z.object({
    headline: text,
    subheadline: text.optional(),
    /** Small pill above the headline, e.g. "ঈদ স্পেশাল অফার". */
    badge: z.string().max(60).optional(),
    imageUrl: imageUrl.optional(),
    videoUrl: z.url().optional(),
    ctaLabel: z.string().max(60).default("Order Now"),
    /** Show the default offer's price + discount badge. */
    showPrice: z.boolean().default(true),
    /** Optional urgency timer inside the hero. */
    countdownEndsAt: z.iso.datetime().optional(),
  }),
});

export const benefitsBlock = z.object({
  ...base,
  type: z.literal("benefits"),
  props: z.object({
    title: text.optional(),
    items: z
      .array(z.object({ icon: z.string().optional(), title: text, body: text.optional() }))
      .max(12),
  }),
});

export const galleryBlock = z.object({
  ...base,
  type: z.literal("gallery"),
  props: z.object({
    title: text.optional(),
    /** Empty → product placeholder art. */
    images: z.array(z.object({ url: imageUrl, alt: z.string().optional() })).max(20),
    videoUrl: z.url().optional(),
    /** "slider": large image with clickable thumbnails; "grid": mosaic. */
    layout: z.enum(["grid", "slider"]).default("grid"),
    highlights: z.array(z.object({ title: text, body: text.optional() })).max(8).default([]),
  }),
});

export const reviewsBlock = z.object({
  ...base,
  type: z.literal("reviews"),
  props: z.object({
    title: text.optional(),
    // Pull approved product reviews, or show curated testimonials / screenshots.
    source: z.enum(["product", "screenshots"]).default("product"),
    layout: z.enum(["grid", "carousel"]).default("grid"),
    screenshotUrls: z.array(imageUrl).default([]),
    items: z
      .array(
        z.object({
          name: z.string().max(80),
          location: z.string().max(80).optional(),
          rating: z.number().int().min(1).max(5).default(5),
          body: text,
          verified: z.boolean().default(true),
        }),
      )
      .max(30)
      .default([]),
  }),
});

export const faqBlock = z.object({
  ...base,
  type: z.literal("faq"),
  props: z.object({
    title: text.optional(),
    items: z.array(z.object({ question: text, answer: text })).max(30),
  }),
});

export const countdownBlock = z.object({
  ...base,
  type: z.literal("countdown"),
  props: z.object({ label: text.optional(), endsAt: z.iso.datetime() }),
});

export const richTextBlock = z.object({
  ...base,
  type: z.literal("richText"),
  // Rendered as plain text (line breaks kept) — never as raw HTML.
  props: z.object({ html: z.string().max(20000) }),
});

export const checkoutBlock = z.object({
  ...base,
  type: z.literal("checkout"),
  props: z.object({
    title: text.default("অর্ডার করতে নিচের ফর্মটি পূরণ করুন"),
    buttonLabel: z.string().max(60).default("Confirm Order"),
  }),
});

/** Offer bundles as tappable package cards; choosing one preselects it in the checkout. */
export const offersBlock = z.object({
  ...base,
  type: z.literal("offers"),
  props: z.object({
    title: text.optional(),
    subtitle: text.optional(),
    ctaLabel: z.string().max(60).default("এই প্যাকেজটি নিন"),
  }),
});

export const comparisonBlock = z.object({
  ...base,
  type: z.literal("comparison"),
  props: z.object({
    title: text.optional(),
    oursLabel: z.string().max(40).default("রিবাত"),
    othersLabel: z.string().max(40).default("সাধারণ বাজার"),
    rows: z.array(z.object({ feature: text, ours: z.boolean().default(true), others: z.boolean().default(false) })).max(15),
  }),
});

/** Mobile bottom bar with price + buy button. Without this block, pages with a checkout get a default bar. */
export const stickyBarBlock = z.object({
  ...base,
  type: z.literal("stickyBar"),
  props: z.object({
    buttonLabel: z.string().max(60).default("অর্ডার করতে চাই"),
    showPrice: z.boolean().default(true),
  }),
});

export const landingSection = z.discriminatedUnion("type", [
  heroBlock,
  benefitsBlock,
  galleryBlock,
  reviewsBlock,
  faqBlock,
  countdownBlock,
  richTextBlock,
  checkoutBlock,
  offersBlock,
  comparisonBlock,
  stickyBarBlock,
]);

export const landingSections = z.array(landingSection);

export const landingTheme = z.object({
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  background: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  font: z.enum(["sans", "serif", "bengali"]).optional(),
});

/** Offer bundle as edited in the builder. */
export const landingOfferInput = z
  .object({
    label: z.string().trim().min(1, "Offer label is required").max(80),
    quantity: z.number().int().min(1).max(20),
    price: z.number().min(0).max(1_000_000),
    compareAtPrice: z.number().min(0).max(1_000_000).nullable(),
    badge: z.string().trim().max(40).nullable(),
    freeShipping: z.boolean(),
    isDefault: z.boolean(),
  })
  .refine((o) => o.compareAtPrice === null || o.compareAtPrice > o.price, {
    message: "Compare-at must be higher than the offer price",
    path: ["compareAtPrice"],
  });

/** Full builder save payload. */
export const landingPageSaveInput = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(3, "Page name is required").max(120),
  slug: z
    .string()
    .trim()
    .min(3)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers and hyphens only"),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  productId: z.string().min(1, "Choose a product"),
  sections: landingSections,
  offers: z.array(landingOfferInput).min(1, "Add at least one offer").max(6),
  allowedVariantIds: z.array(z.string()).max(200),
  shippingZoneIds: z.array(z.string()).max(20),
  theme: landingTheme,
  thankYouMessage: z.string().max(1000).nullable(),
  seoTitle: z.string().max(70).nullable(),
  seoDescription: z.string().max(160).nullable(),
  ogImageUrl: z.url().nullable(),
  facebookPixelId: z
    .string()
    .regex(/^\d{10,20}$/, "Pixel ID is 10–20 digits")
    .nullable(),
});

export type LandingSection = z.infer<typeof landingSection>;
export type LandingSectionType = LandingSection["type"];
export type LandingTheme = z.infer<typeof landingTheme>;
export type LandingOfferInput = z.infer<typeof landingOfferInput>;
export type LandingPageSaveInput = z.infer<typeof landingPageSaveInput>;
