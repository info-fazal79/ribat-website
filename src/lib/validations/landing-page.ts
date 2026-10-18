import { z } from "zod";

/**
 * Schema for LandingPage.sections (JSON column).
 * Bump LANDING_SCHEMA_VERSION when a block's shape changes and add a
 * migration for stored JSON (LandingPage.schemaVersion).
 */
export const LANDING_SCHEMA_VERSION = 1;

// Bengali copy is common on landing pages; text fields accept any Unicode.
const text = z.string().max(2000);
const imageUrl = z.url();

const base = { id: z.string().min(1) };

export const heroBlock = z.object({
  ...base,
  type: z.literal("hero"),
  props: z.object({
    headline: text,
    subheadline: text.optional(),
    imageUrl: imageUrl.optional(),
    videoUrl: z.url().optional(),
    ctaLabel: z.string().max(60).default("Order Now"),
  }),
});

export const benefitsBlock = z.object({
  ...base,
  type: z.literal("benefits"),
  props: z.object({
    title: text.optional(),
    items: z.array(z.object({ icon: z.string().optional(), title: text, body: text.optional() })).max(12),
  }),
});

export const galleryBlock = z.object({
  ...base,
  type: z.literal("gallery"),
  props: z.object({ images: z.array(z.object({ url: imageUrl, alt: z.string().optional() })).max(20) }),
});

export const reviewsBlock = z.object({
  ...base,
  type: z.literal("reviews"),
  props: z.object({
    title: text.optional(),
    // Pull approved product reviews, or show curated screenshots.
    source: z.enum(["product", "screenshots"]).default("product"),
    screenshotUrls: z.array(imageUrl).default([]),
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
  props: z.object({ html: z.string().max(20000) }), // sanitize before render
});

export const checkoutBlock = z.object({
  ...base,
  type: z.literal("checkout"),
  props: z.object({
    title: text.default("অর্ডার করতে নিচের ফর্মটি পূরণ করুন"),
    buttonLabel: z.string().max(60).default("Confirm Order"),
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
]);

export const landingSections = z.array(landingSection);

export const landingTheme = z.object({
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  background: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  font: z.enum(["sans", "serif", "bengali"]).optional(),
});

export type LandingSection = z.infer<typeof landingSection>;
export type LandingSectionType = LandingSection["type"];
export type LandingTheme = z.infer<typeof landingTheme>;
