/**
 * Opt-in demo data: sample orders and landing pages so the admin isn't empty.
 *   npm run db:seed:demo               → insert (idempotent)
 *   npm run db:seed:demo -- --remove   → delete everything this script created
 * Demo orders use the "DEMO-" number prefix and are tagged in adminNote.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { buildTemplateSections } from "../src/lib/landing/templates";
import { products } from "./data/catalog";
import { landingPages, orders } from "./data/demo";

const DEMO_TAG = "[demo-seed]";

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) throw new Error("DIRECT_URL or DATABASE_URL must be set");

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const slugForMockId = (id: string) => products.find((p) => p.id === id)?.slug;

async function remove() {
  const o = await db.order.deleteMany({ where: { adminNote: DEMO_TAG } });
  const lp = await db.landingPage.deleteMany({ where: { slug: { in: landingPages.map((p) => p.slug) } } });
  console.log(`✔ Removed ${o.count} demo orders and ${lp.count} demo landing pages`);
}

async function seedLandingPages() {
  const ids = new Map<string, string>();
  for (const lp of landingPages) {
    const product = await db.product.findUnique({ where: { slug: slugForMockId(lp.productId) ?? "" } });
    if (!product) throw new Error(`Run \`npm run db:seed\` first — product for "${lp.title}" not found`);

    const existing = await db.landingPage.findUnique({ where: { slug: lp.slug } });
    const page =
      existing ??
      (await db.landingPage.create({
        data: {
          title: lp.title,
          slug: lp.slug,
          status: lp.status,
          productId: product.id,
          sections: buildTemplateSections(lp.template, product.nameBn ?? product.name),
          viewCount: lp.viewCount,
          conversionCount: lp.conversionCount,
          seoTitle: lp.title,
          publishedAt: lp.status === "PUBLISHED" ? new Date(lp.updatedAt) : null,
          updatedAt: new Date(lp.updatedAt),
          offers: {
            create: lp.offers.map((o, position) => ({
              label: o.label,
              quantity: o.quantity,
              price: o.price,
              compareAtPrice: o.compareAtPrice,
              badge: o.badge,
              freeShipping: o.quantity >= 3,
              isDefault: position === 0,
              position,
            })),
          },
        },
      }));
    ids.set(lp.title, page.id);
  }
  console.log(`✔ Landing pages (${landingPages.length})`);
  return ids;
}

async function seedOrders(landingIds: Map<string, string>) {
  let created = 0;
  for (const o of orders) {
    if (await db.order.findUnique({ where: { orderNumber: o.orderNumber } })) continue;

    const items = [];
    for (const i of o.items) {
      const variant = await db.productVariant.findUnique({ where: { sku: i.sku }, include: { product: true } });
      items.push({
        productId: variant?.productId,
        variantId: variant?.id,
        productName: i.name,
        variantTitle: i.variant,
        sku: i.sku,
        unitPrice: i.unitPrice,
        quantity: i.quantity,
        lineTotal: i.unitPrice * i.quantity,
      });
    }

    const createdAt = new Date(o.createdAt);
    await db.order.create({
      data: {
        orderNumber: o.orderNumber,
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        district: o.district,
        area: o.area,
        addressLine: o.addressLine,
        customerNote: o.customerNote,
        subtotal: o.subtotal,
        shippingFee: o.shippingFee,
        discountTotal: o.discountTotal,
        total: o.total,
        status: o.status,
        paymentStatus: o.paymentStatus,
        paymentMethod: o.paymentMethod,
        source: o.source,
        landingPageId: o.landingPage ? landingIds.get(o.landingPage) : undefined,
        shippingZoneId: o.district === "Dhaka" ? "zone-inside-dhaka" : "zone-outside-dhaka",
        courierName: o.courierName,
        trackingCode: o.trackingCode,
        adminNote: DEMO_TAG,
        createdAt,
        deliveredAt: o.status === "DELIVERED" ? createdAt : undefined,
        cancelledAt: o.status === "CANCELLED" ? createdAt : undefined,
        items: { create: items },
        history: { create: { toStatus: o.status, note: "Imported demo order", createdAt } },
      },
    });
    created++;
  }
  console.log(`✔ Orders (${created} created, ${orders.length - created} already present)`);
}

async function main() {
  if (process.argv.includes("--remove")) return remove();
  const landingIds = await seedLandingPages();
  await seedOrders(landingIds);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
