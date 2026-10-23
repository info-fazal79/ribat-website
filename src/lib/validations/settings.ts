import { z } from "zod";

const hexColor = z.string().regex(/^#[0-9a-f]{6}$/i, "Use a hex colour like #123e31");

/** Absolute http(s) URL or site-relative path; empty string means "not set". */
const assetUrl = z
  .string()
  .trim()
  .refine((v) => v === "" || /^(https?:\/\/|\/)\S+$/.test(v), "Enter a full https:// URL or a /path")
  .default("");

export const defaultAnnouncements = [
  "সারা বাংলাদেশে ক্যাশ অন ডেলিভারি",
  "৭ দিনে সহজ এক্সচেঞ্জ সুবিধা",
  "৳৩,০০০ টাকার অর্ডারে ফ্রি ডেলিভারি",
];

/**
 * Typed schemas for the `Setting` key/value table.
 * Always read/write settings through these so the JSON stays valid.
 */
export const settingSchemas = {
  "store.general": z.object({
    storeName: z.string().default("Ribat"),
    supportPhone: z.string().optional(),
    supportEmail: z.email().optional(),
    address: z.string().optional(),
    logoUrl: z.url().optional(),
  }),
  "appearance.branding": z.object({
    logoType: z.enum(["text", "image"]).default("text"),
    logoUrl: assetUrl,
    logoWidth: z.number().int().min(40).max(400).default(140),
    logoHeight: z.number().int().min(20).max(160).default(48),
    faviconUrl: assetUrl,
  }),
  "appearance.announcement": z.object({
    enabled: z.boolean().default(true),
    messages: z
      .array(
        z.object({
          text: z.string().trim().min(1, "Message can't be empty").max(160),
          active: z.boolean().default(true),
        }),
      )
      .max(20)
      .default(defaultAnnouncements.map((text) => ({ text, active: true }))),
    backgroundColor: hexColor.default("#123e31"),
    textColor: hexColor.default("#d4af37"),
    mode: z.enum(["marquee", "static"]).default("marquee"),
    // Seconds for one full loop of the ticker — lower is faster.
    speed: z.number().int().min(5).max(120).default(40),
  }),
  "store.currency": z.object({
    code: z.literal("BDT").default("BDT"),
    symbol: z.string().default("৳"),
  }),
  "store.social": z.object({
    facebook: z.url().optional(),
    instagram: z.url().optional(),
    youtube: z.url().optional(),
    tiktok: z.url().optional(),
    whatsapp: z.string().optional(),
  }),
  "checkout.config": z.object({
    codEnabled: z.boolean().default(true),
    onlinePaymentEnabled: z.boolean().default(false),
    requireEmail: z.boolean().default(false),
    minOrderAmount: z.number().nonnegative().default(0),
    // Basic fraud guard: block repeat orders from one phone in a window.
    maxOrdersPerPhonePerDay: z.number().int().positive().default(5),
  }),
  "payments.bkash": z.object({
    enabled: z.boolean().default(false),
    mode: z.enum(["sandbox", "live"]).default("sandbox"),
  }),
  "seo.defaults": z.object({
    titleTemplate: z.string().default("%s | Ribat"),
    defaultTitle: z.string().default("Ribat — Islamic Lifestyle & Premium Clothing"),
    description: z.string().optional(),
    ogImageUrl: z.url().optional(),
  }),
} as const;

export type SettingKey = keyof typeof settingSchemas;
export type SettingValue<K extends SettingKey> = z.infer<(typeof settingSchemas)[K]>;
