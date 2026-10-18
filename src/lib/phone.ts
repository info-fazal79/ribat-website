import { z } from "zod";

// BD mobile: 01[3-9]XXXXXXXX, optionally prefixed with +88 / 88.
const BD_MOBILE = /^(?:\+?88)?(01[3-9]\d{8})$/;

/** Normalizes to the 11-digit local form ("01712345678") or returns null. */
export function normalizeBdPhone(input: string): string | null {
  const digits = input.replace(/[\s-]/g, "");
  const match = digits.match(BD_MOBILE);
  return match ? match[1] : null;
}

export const bdPhoneSchema = z
  .string()
  .trim()
  .transform((v, ctx) => {
    const normalized = normalizeBdPhone(v);
    if (!normalized) {
      ctx.addIssue({ code: "custom", message: "Enter a valid Bangladeshi mobile number" });
      return z.NEVER;
    }
    return normalized;
  });
