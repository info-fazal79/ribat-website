"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { buildTemplateSections, bundleOffers, landingTemplates, type LandingTemplate } from "@/lib/landing/templates";
import { LANDING_SCHEMA_VERSION, landingPageSaveInput } from "@/lib/validations/landing-page";
import { requireStaff } from "@/server/auth/guards";
import { db } from "@/server/db";
import { landingPageTag } from "@/server/services/landing-pages";

const slug = z
  .string()
  .trim()
  .min(3, "Slug must be at least 3 characters")
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers and hyphens only");

const createInput = z.object({
  title: z.string().trim().min(3, "Give the page a name (3+ characters)").max(120),
  slug,
  productId: z.string().min(1, "Choose the product this page sells"),
  template: z.enum(Object.keys(landingTemplates) as [LandingTemplate, ...LandingTemplate[]]),
});

type Result = { ok: true } | { ok: false; message: string };

function done(...slugs: string[]): Result {
  for (const s of new Set(slugs)) updateTag(landingPageTag(s));
  revalidatePath("/admin/landing-pages");
  return { ok: true };
}

const isUniqueViolation = (e: unknown) => e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";

export async function createLandingPage(
  raw: z.input<typeof createInput>,
): Promise<{ ok: true; id: string } | { ok: false; message: string }> {
  const user = await requireStaff();
  const parsed = createInput.safeParse(raw);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const { title, productId, template } = parsed.data;

  const product = await db.product.findUnique({ where: { id: productId }, select: { name: true, nameBn: true, minPrice: true } });
  if (!product) return { ok: false, message: "Product not found" };

  try {
    const page = await db.landingPage.create({
      data: {
        title,
        slug: parsed.data.slug,
        productId,
        createdById: user.id === "dev-admin" ? null : user.id,
        sections: buildTemplateSections(template, product.nameBn ?? product.name),
        offers: { create: bundleOffers(Number(product.minPrice)).map((o, position) => ({ ...o, position })) },
      },
      select: { id: true },
    });
    done(parsed.data.slug);
    return { ok: true, id: page.id };
  } catch (e) {
    if (isUniqueViolation(e)) return { ok: false, message: "That slug is already in use." };
    throw e;
  }
}

export type SaveLandingResult = { ok: true } | { ok: false; message: string; fieldErrors: Record<string, string> };

/** Builder save: page settings, ordered sections and offer bundles in one transaction. */
export async function saveLandingPage(raw: unknown): Promise<SaveLandingResult> {
  await requireStaff();
  const parsed = landingPageSaveInput.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[issue.path.join(".")] ??= issue.message;
    return { ok: false, message: Object.values(fieldErrors)[0] ?? "Please fix the highlighted fields.", fieldErrors };
  }
  const input = parsed.data;

  const [existing, product] = await Promise.all([
    db.landingPage.findUnique({ where: { id: input.id }, select: { slug: true, publishedAt: true } }),
    db.product.findUnique({ where: { id: input.productId }, select: { id: true } }),
  ]);
  if (!existing) return { ok: false, message: "This landing page no longer exists.", fieldErrors: {} };
  if (!product) return { ok: false, message: "Product not found", fieldErrors: { productId: "Product not found" } };
  if (input.status === "PUBLISHED" && !input.sections.some((s) => s.type === "checkout" && !s.hidden)) {
    return { ok: false, message: "Add a visible Checkout section before publishing.", fieldErrors: {} };
  }

  // Exactly one default offer.
  const defaultIndex = Math.max(0, input.offers.findIndex((o) => o.isDefault));

  try {
    await db.$transaction(async (tx) => {
      await tx.landingPage.update({
        where: { id: input.id },
        data: {
          title: input.title,
          slug: input.slug,
          status: input.status,
          productId: input.productId,
          sections: input.sections,
          schemaVersion: LANDING_SCHEMA_VERSION,
          theme: input.theme,
          allowedVariantIds: input.allowedVariantIds,
          shippingZoneIds: input.shippingZoneIds,
          thankYouMessage: input.thankYouMessage,
          seoTitle: input.seoTitle,
          seoDescription: input.seoDescription,
          ogImageUrl: input.ogImageUrl,
          facebookPixelId: input.facebookPixelId,
          publishedAt: input.status === "PUBLISHED" ? (existing.publishedAt ?? new Date()) : existing.publishedAt,
        },
      });
      // Orders keep landingOfferId as a plain snapshot reference, so replacing offers is safe.
      await tx.landingPageOffer.deleteMany({ where: { landingPageId: input.id } });
      await tx.landingPageOffer.createMany({
        data: input.offers.map((o, position) => ({ ...o, landingPageId: input.id, position, isDefault: position === defaultIndex })),
      });
    });
  } catch (e) {
    if (isUniqueViolation(e)) return { ok: false, message: "That URL slug is already in use.", fieldErrors: { slug: "Already in use" } };
    throw e;
  }

  done(existing.slug, input.slug);
  revalidatePath(`/admin/landing-pages/${input.id}/edit`);
  return { ok: true };
}

const statusInput = z.object({ id: z.string().min(1), status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]) });

export async function setLandingPageStatus(raw: z.input<typeof statusInput>): Promise<Result> {
  await requireStaff();
  const { id, status } = statusInput.parse(raw);
  const page = await db.landingPage.update({
    where: { id },
    data: { status, ...(status === "PUBLISHED" && { publishedAt: new Date() }) },
    select: { slug: true },
  });
  return done(page.slug);
}

export async function duplicateLandingPage(id: string): Promise<Result> {
  const user = await requireStaff();
  const source = await db.landingPage.findUnique({ where: { id }, include: { offers: true } });
  if (!source) return { ok: false, message: "Landing page not found" };

  let copySlug = `${source.slug}-copy`;
  for (let n = 2; await db.landingPage.findUnique({ where: { slug: copySlug }, select: { id: true } }); n++) {
    copySlug = `${source.slug}-copy-${n}`;
  }
  await db.landingPage.create({
    data: {
      title: `${source.title} (copy)`,
      slug: copySlug,
      productId: source.productId,
      createdById: user.id === "dev-admin" ? null : user.id,
      sections: source.sections ?? [],
      theme: source.theme ?? undefined,
      schemaVersion: source.schemaVersion,
      allowedVariantIds: source.allowedVariantIds,
      shippingZoneIds: source.shippingZoneIds,
      allowCod: source.allowCod,
      allowOnline: source.allowOnline,
      thankYouMessage: source.thankYouMessage,
      seoTitle: source.seoTitle,
      seoDescription: source.seoDescription,
      offers: {
        create: source.offers.map((o) => ({
          label: o.label,
          quantity: o.quantity,
          price: o.price,
          compareAtPrice: o.compareAtPrice,
          badge: o.badge,
          freeShipping: o.freeShipping,
          isDefault: o.isDefault,
          position: o.position,
        })),
      },
    },
  });
  return done(copySlug);
}
