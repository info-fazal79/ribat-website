import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { siteConfig } from "@/config/site";
import { toNumber } from "@/lib/money";
import type { landingCheckoutSchema } from "@/lib/validations/checkout";
import type { z } from "zod";
import { db } from "@/server/db";

type LandingOrderInput = z.output<typeof landingCheckoutSchema>;

export class OrderError extends Error {
  constructor(
    message: string,
    public field?: string,
  ) {
    super(message);
  }
}

const FIRST_ORDER_NUMBER = 100001;
const DUPLICATE_WINDOW_MS = 2 * 60 * 1000;

/** Next "RBT-100245"-style number. Unique index + retry in the caller handles races. */
async function nextOrderNumber(tx: Prisma.TransactionClient) {
  const prefix = siteConfig.orderNumberPrefix;
  const last = await tx.order.findFirst({
    where: { orderNumber: { startsWith: prefix } },
    orderBy: { createdAt: "desc" },
    select: { orderNumber: true },
  });
  const n = last ? Number(last.orderNumber.slice(prefix.length)) : NaN;
  return `${prefix}${Number.isFinite(n) ? n + 1 : FIRST_ORDER_NUMBER}`;
}

/**
 * Places a COD order from a landing page. All prices come from the DB (offer + zone) —
 * nothing the browser sends is trusted except IDs and customer details.
 */
export async function placeLandingOrder(
  input: LandingOrderInput,
  meta: { ipAddress?: string | null; userAgent?: string | null },
) {
  const page = await db.landingPage.findFirst({
    where: { id: input.landingPageId, status: "PUBLISHED" },
    include: { offers: true, product: { select: { id: true, name: true } } },
  });
  if (!page) throw new OrderError("এই অফারটি এখন আর চালু নেই।");
  if (!page.allowCod) throw new OrderError("এই পেজে ক্যাশ অন ডেলিভারি চালু নেই।");

  const offer = page.offers.find((o) => o.id === input.offerId);
  if (!offer) throw new OrderError("অফারটি পাওয়া যায়নি, আবার চেষ্টা করুন।", "offerId");

  const variant = await db.productVariant.findFirst({
    where: { id: input.variantId, productId: page.productId, isActive: true },
    select: { id: true, sku: true, title: true, stock: true },
  });
  if (!variant || (page.allowedVariantIds.length > 0 && !page.allowedVariantIds.includes(variant.id))) {
    throw new OrderError("এই সাইজ / কালারটি পাওয়া যায়নি।", "variantId");
  }
  if (variant.stock < offer.quantity) {
    throw new OrderError(
      variant.stock > 0 ? `দুঃখিত, এই অপশনে মাত্র ${variant.stock}টি স্টকে আছে।` : "দুঃখিত, এই অপশনটি স্টক আউট।",
      "variantId",
    );
  }

  const zone = await db.shippingZone.findFirst({
    where: { id: input.shippingZoneId, isActive: true },
  });
  if (!zone || (page.shippingZoneIds.length > 0 && !page.shippingZoneIds.includes(zone.id))) {
    throw new OrderError("ডেলিভারি এরিয়া বেছে নিন।", "shippingZoneId");
  }

  // Cheap duplicate guard: same phone + same page within a couple of minutes.
  const recent = await db.order.findFirst({
    where: {
      customerPhone: input.customerPhone,
      landingPageId: page.id,
      createdAt: { gte: new Date(Date.now() - DUPLICATE_WINDOW_MS) },
    },
    select: { id: true },
  });
  if (recent) return { id: recent.id, duplicate: true as const };

  const subtotal = new Prisma.Decimal(offer.price);
  const threshold = zone.freeShippingThreshold;
  const freeShipping = offer.freeShipping || (threshold !== null && subtotal.gte(threshold));
  const shippingFee = freeShipping ? new Prisma.Decimal(0) : zone.fee;
  const total = subtotal.plus(shippingFee);
  const unitPrice = subtotal.div(offer.quantity).toDecimalPlaces(2);

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const order = await db.$transaction(
        async (tx) => {
          // Atomic decrement: only succeeds if enough stock is still there.
          const dec = await tx.productVariant.updateMany({
            where: { id: variant.id, stock: { gte: offer.quantity } },
            data: { stock: { decrement: offer.quantity } },
          });
          if (dec.count === 0) throw new OrderError("দুঃখিত, এই অপশনটি এইমাত্র স্টক আউট হয়ে গেছে।", "variantId");
          await tx.product.update({
            where: { id: page.productId },
            data: { totalStock: { decrement: offer.quantity } },
          });

          const created = await tx.order.create({
            data: {
              orderNumber: await nextOrderNumber(tx),
              customerName: input.customerName,
              customerPhone: input.customerPhone,
              district: zone.districts[0] ?? zone.name,
              area: zone.name,
              addressLine: input.addressLine,
              customerNote: input.customerNote || null,
              subtotal,
              shippingFee,
              total,
              paymentMethod: "COD",
              source: "LANDING_PAGE",
              shippingZoneId: zone.id,
              landingPageId: page.id,
              landingOfferId: offer.id,
              ipAddress: meta.ipAddress ?? null,
              userAgent: meta.userAgent?.slice(0, 500) ?? null,
              utm: input.utm ?? undefined,
              items: {
                create: {
                  productId: page.product.id,
                  variantId: variant.id,
                  productName: page.product.name,
                  variantTitle: variant.title === "Default" ? offer.label : `${variant.title} · ${offer.label}`,
                  sku: variant.sku,
                  unitPrice,
                  quantity: offer.quantity,
                  lineTotal: subtotal,
                },
              },
              history: { create: { toStatus: "PENDING", note: `Landing page: ${page.title}` } },
            },
            select: { id: true },
          });

          await tx.inventoryLog.create({
            data: {
              variantId: variant.id,
              change: -offer.quantity,
              stockAfter: variant.stock - offer.quantity,
              reason: "ORDER_PLACED",
              orderId: created.id,
            },
          });
          await tx.landingPage.update({ where: { id: page.id }, data: { conversionCount: { increment: 1 } } });
          return created;
        },
        { timeout: 20_000, maxWait: 10_000 },
      );
      return { id: order.id, duplicate: false as const };
    } catch (e) {
      // Order-number collision with a concurrent order → retry with the next number.
      const collision = e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
      if (!collision || attempt === 2) throw e;
    }
  }
  throw new OrderError("অর্ডার করা যায়নি, আবার চেষ্টা করুন।");
}

/** Order details for the thank-you page; scoped to the landing page it came from. */
export async function getLandingOrderReceipt(orderId: string, slug: string) {
  const order = await db.order.findFirst({
    where: { id: orderId, landingPage: { slug } },
    include: {
      items: true,
      shippingZone: { select: { name: true, estimatedDays: true } },
      landingPage: { select: { thankYouMessage: true, facebookPixelId: true } },
    },
  });
  if (!order) return null;
  return {
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    // Partially masked — this page is reachable by anyone holding the link.
    customerPhone: order.customerPhone.replace(/^(\d{3})\d{4}(\d{4})$/, "$1****$2"),
    addressLine: order.addressLine,
    zone: order.shippingZone,
    items: order.items.map((i) => ({
      name: i.productName,
      variant: i.variantTitle,
      quantity: i.quantity,
      lineTotal: toNumber(i.lineTotal),
    })),
    subtotal: toNumber(order.subtotal),
    shippingFee: toNumber(order.shippingFee),
    total: toNumber(order.total),
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    thankYouMessage: order.landingPage?.thankYouMessage ?? null,
    facebookPixelId: order.landingPage?.facebookPixelId ?? null,
  };
}
