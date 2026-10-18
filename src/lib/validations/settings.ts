import { z } from "zod";

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
  "store.announcement": z.object({
    enabled: z.boolean().default(false),
    text: z.string().default(""),
    textBn: z.string().optional(),
    linkUrl: z.string().optional(),
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
