import { z } from "zod";
import { bdPhoneSchema } from "@/lib/phone";

export const paymentMethodSchema = z.enum(["COD", "BKASH", "NAGAD", "SSLCOMMERZ"]);

export const checkoutCustomerSchema = z.object({
  customerName: z.string().trim().min(2, "Please enter your name").max(100),
  customerPhone: bdPhoneSchema,
  customerEmail: z.email().optional().or(z.literal("")),
  division: z.string().optional(),
  district: z.string().min(1, "Select your district"),
  area: z.string().min(1, "Enter your area / thana"),
  addressLine: z.string().trim().min(5, "Enter your full address").max(300),
  customerNote: z.string().max(500).optional(),
});

export const cartLineSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().min(1).max(20),
});

/** Storefront checkout. Prices are always recomputed on the server. */
export const checkoutSchema = checkoutCustomerSchema.extend({
  items: z.array(cartLineSchema).min(1),
  paymentMethod: paymentMethodSchema.default("COD"),
  shippingZoneId: z.string().min(1),
  couponCode: z.string().trim().toUpperCase().optional(),
});

/**
 * One-page landing checkout: picks an offer bundle instead of a cart. Kept short for
 * conversion — the delivery zone stands in for district/area. COD only for now.
 */
export const landingCheckoutSchema = z.object({
  landingPageId: z.string().min(1),
  offerId: z.string().min(1, "একটি অফার বেছে নিন"),
  variantId: z.string().min(1, "সাইজ / কালার বেছে নিন"),
  shippingZoneId: z.string().min(1, "ডেলিভারি এরিয়া বেছে নিন"),
  customerName: z.string().trim().min(2, "আপনার নাম লিখুন").max(100),
  customerPhone: bdPhoneSchema,
  addressLine: z.string().trim().min(8, "সম্পূর্ণ ঠিকানা লিখুন (বাসা, রোড, থানা, জেলা)").max(300),
  customerNote: z.string().trim().max(500).optional(),
  utm: z.record(z.string(), z.string().max(200)).optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type LandingCheckoutInput = z.infer<typeof landingCheckoutSchema>;
