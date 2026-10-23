import "server-only";
import { categoryArt } from "@/config/category-art";
import type { AdminLandingPage, AdminOrder, AdminProductRow, ProductEditData } from "@/lib/admin/types";
import { landingSections, landingTheme } from "@/lib/validations/landing-page";
import { toNumber } from "@/lib/money";
import { db } from "@/server/db";

/**
 * Admin reads — uncached (always live). Callers must have run requireStaff()
 * and render inside <Suspense>.
 */

const money = (v: { toString(): string } | null) => (v === null ? null : toNumber(v));

/** Shared prefix of variant SKUs, cut at a hyphen ("RBT-PJ-001-IVO-L", "RBT-PJ-001-EME-M" → "RBT-PJ-001"). */
function baseSku(skus: string[]) {
  if (skus.length <= 1) return skus[0] ?? "";
  let prefix = skus[0];
  for (const s of skus) while (!s.startsWith(prefix)) prefix = prefix.slice(0, -1);
  return prefix.includes("-") ? prefix.slice(0, prefix.lastIndexOf("-")) : prefix;
}

export async function listProducts(): Promise<AdminProductRow[]> {
  const rows = await db.product.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      category: { select: { slug: true, name: true } },
      variants: {
        orderBy: { position: "asc" },
        select: {
          sku: true,
          price: true,
          compareAtPrice: true,
          isActive: true,
          options: { select: { attribute: { select: { slug: true } }, attributeValue: { select: { swatchHex: true } } } },
        },
      },
    },
  });
  return rows.map((p) => {
    const art = categoryArt(p.category?.slug);
    const active = p.variants.filter((v) => v.isActive);
    const cheapest = active.reduce<(typeof active)[number] | undefined>(
      (min, v) => (!min || toNumber(v.price) < toNumber(min.price) ? v : min),
      undefined,
    );
    const swatch = p.variants[0]?.options.find((o) => o.attribute.slug === "color")?.attributeValue.swatchHex;
    return {
      id: p.id,
      slug: p.slug,
      sku: baseSku(p.variants.map((v) => v.sku)),
      name: p.name,
      nameBn: p.nameBn,
      art: art.kind,
      color: swatch ?? art.productColor,
      category: p.category,
      type: p.type,
      status: p.status,
      price: cheapest ? toNumber(cheapest.price) : toNumber(p.minPrice),
      compareAtPrice: cheapest ? money(cheapest.compareAtPrice) : null,
      stock: p.totalStock,
      variantCount: active.length,
      isFeatured: p.isFeatured,
    };
  });
}

export async function listCategoryOptions() {
  return db.category.findMany({
    where: { isActive: true },
    orderBy: { position: "asc" },
    select: { slug: true, name: true, nameBn: true },
  });
}

export async function getProductForEdit(id: string): Promise<ProductEditData | null> {
  const p = await db.product.findUnique({
    where: { id },
    include: {
      category: { select: { slug: true } },
      images: { orderBy: { position: "asc" }, select: { url: true } },
      variants: {
        orderBy: { position: "asc" },
        include: { options: { include: { attribute: { select: { slug: true } }, attributeValue: true } } },
      },
    },
  });
  if (!p) return null;

  const art = categoryArt(p.category?.slug);
  const colors: ProductEditData["colors"] = [];
  const sizes: string[] = [];
  const variants = p.variants.map((v) => {
    const color = v.options.find((o) => o.attribute.slug === "color")?.attributeValue;
    const size = v.options.find((o) => o.attribute.slug === "size")?.attributeValue;
    if (color && !colors.some((c) => c.name === color.value)) colors.push({ name: color.value, hex: color.swatchHex ?? art.productColor });
    if (size && !sizes.includes(size.value)) sizes.push(size.value);
    return {
      color: color?.value ?? null,
      size: size?.value ?? null,
      sku: v.sku,
      price: toNumber(v.price),
      compareAtPrice: money(v.compareAtPrice),
      stock: v.stock,
      isActive: v.isActive,
    };
  });
  const first = p.variants[0];

  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    type: p.type,
    status: p.status,
    category: p.category?.slug ?? "",
    art: art.kind,
    shortDescription: p.shortDescription ?? "",
    description: p.description ?? "",
    fabricCare: p.fabricCare ?? "",
    tags: p.tags,
    isFeatured: p.isFeatured,
    metaTitle: p.metaTitle ?? "",
    metaDescription: p.metaDescription ?? "",
    sku: baseSku(p.variants.map((v) => v.sku)),
    price: first ? toNumber(first.price) : 0,
    compareAtPrice: first ? money(first.compareAtPrice) : null,
    costPrice: first ? money(first.costPrice) : null,
    stock: p.type === "SIMPLE" ? (first?.stock ?? 0) : p.totalStock,
    lowStockAt: first?.lowStockAt ?? 3,
    colors,
    sizes,
    variants,
    images: p.images.map((i) => i.url),
  };
}

export async function listOrders(): Promise<AdminOrder[]> {
  // TODO(admin): paginate + server-side filters once order volume grows.
  const rows = await db.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { items: true, landingPage: { select: { title: true } } },
  });
  return rows.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    customerName: o.customerName,
    customerPhone: o.customerPhone,
    district: o.district,
    area: o.area,
    addressLine: o.addressLine,
    customerNote: o.customerNote,
    items: o.items.map((i) => ({
      id: i.id,
      name: i.productName,
      variant: i.variantTitle ?? "Default",
      sku: i.sku,
      quantity: i.quantity,
      unitPrice: toNumber(i.unitPrice),
    })),
    subtotal: toNumber(o.subtotal),
    shippingFee: toNumber(o.shippingFee),
    discountTotal: toNumber(o.discountTotal),
    total: toNumber(o.total),
    status: o.status,
    paymentStatus: o.paymentStatus,
    paymentMethod: o.paymentMethod,
    source: o.source,
    landingPage: o.landingPage?.title ?? null,
    courierName: o.courierName,
    trackingCode: o.trackingCode,
    createdAt: o.createdAt.toISOString(),
  }));
}

export async function listLandingPages(): Promise<AdminLandingPage[]> {
  const [pages, revenue] = await Promise.all([
    db.landingPage.findMany({
      orderBy: { updatedAt: "desc" },
      include: { product: { select: { name: true } }, offers: { orderBy: { position: "asc" } } },
    }),
    db.order.groupBy({
      by: ["landingPageId"],
      where: { landingPageId: { not: null }, status: { notIn: ["CANCELLED", "RETURNED"] } },
      _sum: { total: true },
    }),
  ]);
  const revenueByPage = new Map(revenue.map((r) => [r.landingPageId, toNumber(r._sum.total)]));

  return pages.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    status: p.status,
    productName: p.product.name,
    offers: p.offers.map((o) => ({ label: o.label, quantity: o.quantity, price: toNumber(o.price) })),
    sectionCount: landingSections.catch([]).parse(p.sections).length,
    viewCount: p.viewCount,
    conversionCount: p.conversionCount,
    revenue: revenueByPage.get(p.id) ?? 0,
    facebookPixel: Boolean(p.facebookPixelId),
    updatedAt: p.updatedAt.toISOString(),
  }));
}

export async function listLandingProductOptions() {
  const rows = await db.product.findMany({
    where: { status: "ACTIVE" },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      nameBn: true,
      type: true,
      minPrice: true,
      images: { orderBy: { position: "asc" }, take: 1, select: { url: true } },
      _count: { select: { variants: { where: { isActive: true } } } },
    },
  });
  return rows.map((p) => ({
    id: p.id,
    name: p.name,
    nameBn: p.nameBn,
    type: p.type,
    price: toNumber(p.minPrice),
    image: p.images[0]?.url ?? null,
    variantCount: p._count.variants,
  }));
}

export type LandingProductOption = Awaited<ReturnType<typeof listLandingProductOptions>>[number];

export async function getDashboardStats() {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const startOfToday = new Date(new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" }) + "T00:00:00+06:00");
  const [today, pending, revenue, lowStock, recent] = await Promise.all([
    db.order.count({ where: { createdAt: { gte: startOfToday } } }),
    db.order.count({ where: { status: "PENDING" } }),
    db.order.aggregate({
      where: { createdAt: { gte: since }, status: { notIn: ["CANCELLED", "RETURNED"] } },
      _sum: { total: true },
    }),
    db.product.findMany({
      where: { status: "ACTIVE", totalStock: { lte: 10 } },
      select: { name: true },
      orderBy: { totalStock: "asc" },
    }),
    db.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, orderNumber: true, customerName: true, district: true, total: true, status: true, createdAt: true },
    }),
  ]);
  return {
    today,
    pending,
    revenue30d: toNumber(revenue._sum.total),
    lowStock: lowStock.map((p) => p.name),
    recent: recent.map((o) => ({ ...o, total: toNumber(o.total), createdAt: o.createdAt.toISOString() })),
  };
}

/** Everything the landing page builder edits. */
export async function getLandingPageForBuilder(id: string) {
  const p = await db.landingPage.findUnique({ where: { id }, include: { offers: { orderBy: { position: "asc" } } } });
  if (!p) return null;
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    status: p.status,
    productId: p.productId,
    sections: landingSections.catch([]).parse(p.sections),
    theme: landingTheme.catch({}).parse(p.theme ?? {}),
    offers: p.offers.map((o) => ({
      label: o.label,
      quantity: o.quantity,
      price: toNumber(o.price),
      compareAtPrice: money(o.compareAtPrice),
      badge: o.badge,
      freeShipping: o.freeShipping,
      isDefault: o.isDefault,
    })),
    allowedVariantIds: p.allowedVariantIds,
    shippingZoneIds: p.shippingZoneIds,
    thankYouMessage: p.thankYouMessage,
    seoTitle: p.seoTitle,
    seoDescription: p.seoDescription,
    ogImageUrl: p.ogImageUrl,
    facebookPixelId: p.facebookPixelId,
    viewCount: p.viewCount,
    conversionCount: p.conversionCount,
  };
}

export type LandingBuilderData = NonNullable<Awaited<ReturnType<typeof getLandingPageForBuilder>>>;

/** Products (with variants) selectable in the builder; also feeds the live preview. */
export async function listBuilderProducts() {
  const rows = await db.product.findMany({
    where: { status: { not: "ARCHIVED" } },
    orderBy: { name: "asc" },
    include: {
      category: { select: { slug: true } },
      images: { orderBy: { position: "asc" }, select: { url: true, alt: true } },
      variants: {
        where: { isActive: true },
        orderBy: { position: "asc" },
        include: { options: { include: { attribute: { select: { slug: true } }, attributeValue: true } } },
      },
    },
  });
  return rows.map((p) => {
    const art = categoryArt(p.category?.slug);
    const variants = p.variants.map((v) => {
      const color = v.options.find((o) => o.attribute.slug === "color")?.attributeValue;
      const size = v.options.find((o) => o.attribute.slug === "size")?.attributeValue;
      return { id: v.id, title: v.title, color: color?.value ?? null, colorHex: color?.swatchHex ?? null, size: size?.value ?? null, stock: v.stock };
    });
    return {
      id: p.id,
      name: p.name,
      nameBn: p.nameBn,
      status: p.status,
      art: art.kind,
      color: variants.find((v) => v.colorHex)?.colorHex ?? art.productColor,
      images: p.images,
      rating: toNumber(p.ratingAvg),
      reviewCount: p.reviewCount,
      price: toNumber(p.minPrice),
      variants,
    };
  });
}

export type BuilderProduct = Awaited<ReturnType<typeof listBuilderProducts>>[number];

export async function listShippingZoneOptions() {
  const zones = await db.shippingZone.findMany({ where: { isActive: true }, orderBy: { position: "asc" } });
  return zones.map((z) => ({ id: z.id, name: z.name, fee: toNumber(z.fee), estimatedDays: z.estimatedDays }));
}
