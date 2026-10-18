"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { updateTag } from "next/cache";
import { landingCheckoutSchema } from "@/lib/validations/checkout";
import { db } from "@/server/db";
import { catalogTag } from "@/server/services/catalog";
import { landingPageTag } from "@/server/services/landing-pages";
import { OrderError, placeLandingOrder } from "@/server/services/orders";

export type PlaceOrderResult = { ok: false; message: string; field?: string };

/** Public COD order from a landing page. Redirects to the thank-you page on success. */
export async function placeOrder(raw: unknown): Promise<PlaceOrderResult> {
  const parsed = landingCheckoutSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = String(issue.path[0] ?? "");
    const message = field === "customerPhone" ? "সঠিক মোবাইল নম্বর দিন (01XXXXXXXXX)" : issue.message;
    return { ok: false, message, field };
  }

  const h = await headers();
  let result;
  try {
    result = await placeLandingOrder(parsed.data, {
      ipAddress: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip"),
      userAgent: h.get("user-agent"),
    });
  } catch (e) {
    if (e instanceof OrderError) return { ok: false, message: e.message, field: e.field };
    console.error("placeOrder failed", e);
    return { ok: false, message: "অর্ডার করা যায়নি, একটু পরে আবার চেষ্টা করুন।" };
  }

  const page = await db.landingPage.findUnique({ where: { id: parsed.data.landingPageId }, select: { slug: true } });
  if (!result.duplicate) {
    // Stock changed: refresh cached storefront + this landing page.
    updateTag(catalogTag);
    if (page) updateTag(landingPageTag(page.slug));
  }
  redirect(`/lp/${page?.slug ?? ""}/thank-you/${result.id}`);
}

/** Lightweight view counter (once per browser session, see ViewTracker). */
export async function trackLandingView(landingPageId: string) {
  if (typeof landingPageId !== "string" || landingPageId.length > 40) return;
  await db.landingPage.updateMany({
    where: { id: landingPageId, status: "PUBLISHED" },
    data: { viewCount: { increment: 1 } },
  });
}
