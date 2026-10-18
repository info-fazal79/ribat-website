"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { buildTemplateSections, landingTemplates, type LandingTemplate } from "@/lib/landing/templates";
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

function done(pageSlug: string): Result {
  updateTag(landingPageTag(pageSlug));
  revalidatePath("/admin/landing-pages");
  return { ok: true };
}

export async function createLandingPage(raw: z.input<typeof createInput>): Promise<Result> {
  const user = await requireStaff();
  const parsed = createInput.safeParse(raw);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const { title, productId, template } = parsed.data;

  const product = await db.product.findUnique({ where: { id: productId }, select: { name: true, nameBn: true, minPrice: true } });
  if (!product) return { ok: false, message: "Product not found" };

  try {
    await db.landingPage.create({
      data: {
        title,
        slug: parsed.data.slug,
        productId,
        createdById: user.id === "dev-admin" ? null : user.id,
        sections: buildTemplateSections(template, product.nameBn ?? product.name),
        offers: { create: { label: "1 pc", quantity: 1, price: product.minPrice, isDefault: true } },
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, message: "That slug is already in use." };
    }
    throw e;
  }
  return done(parsed.data.slug);
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
