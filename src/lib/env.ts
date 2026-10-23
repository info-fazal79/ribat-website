import "server-only";
import { z } from "zod";

/**
 * Server-side environment, validated once at boot.
 * Payment/courier keys are optional so the app runs before those
 * integrations are configured; each integration asserts its own keys.
 */
const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // Database
  DATABASE_URL: z.url(),
  DIRECT_URL: z.url().optional(),

  // Auth.js
  AUTH_SECRET: z.string().min(32, "Generate with `npx auth secret`"),
  AUTH_URL: z.url().optional(),
  AUTH_GOOGLE_ID: z.string().optional(),
  AUTH_GOOGLE_SECRET: z.string().optional(),

  // bKash (Tokenized Checkout)
  BKASH_BASE_URL: z.url().optional(),
  BKASH_APP_KEY: z.string().optional(),
  BKASH_APP_SECRET: z.string().optional(),
  BKASH_USERNAME: z.string().optional(),
  BKASH_PASSWORD: z.string().optional(),

  // Nagad
  NAGAD_BASE_URL: z.url().optional(),
  NAGAD_MERCHANT_ID: z.string().optional(),
  NAGAD_MERCHANT_PRIVATE_KEY: z.string().optional(),
  NAGAD_PG_PUBLIC_KEY: z.string().optional(),

  // SSLCommerz
  SSLCOMMERZ_STORE_ID: z.string().optional(),
  SSLCOMMERZ_STORE_PASSWORD: z.string().optional(),
  SSLCOMMERZ_IS_LIVE: z.stringbool().default(false),

  // Couriers
  STEADFAST_API_KEY: z.string().optional(),
  STEADFAST_SECRET_KEY: z.string().optional(),
  PATHAO_BASE_URL: z.url().optional(),
  PATHAO_CLIENT_ID: z.string().optional(),
  PATHAO_CLIENT_SECRET: z.string().optional(),
  PATHAO_USERNAME: z.string().optional(),
  PATHAO_PASSWORD: z.string().optional(),
  PATHAO_STORE_ID: z.string().optional(),

  // Supabase Storage (admin uploads). URL defaults to the project in DATABASE_URL.
  SUPABASE_URL: z.url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_STORAGE_BUCKET: z.string().default("brand-assets"),
});

// Treat `FOO=""` (blank placeholders from .env.example) as unset.
const rawEnv = Object.fromEntries(Object.entries(process.env).filter(([, v]) => v !== ""));

const parsed = serverSchema.safeParse(rawEnv);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", z.flattenError(parsed.error).fieldErrors);
  throw new Error("Invalid environment variables — see .env.example");
}

export const env = parsed.data;
