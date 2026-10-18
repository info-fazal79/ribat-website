/**
 * Idempotent seed: safe to run repeatedly (`npm run db:seed`).
 * Creates the first admin, shipping zones, core attributes, storefront
 * categories/collections, the starter catalog (prisma/data/catalog.ts) and default settings.
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { settingSchemas, type SettingKey } from "../src/lib/validations/settings";
import { optionKeyFor, valueSlug, variantTitle } from "../src/lib/catalog/variant-keys";
import { buildVariants, categories, products } from "./data/catalog";

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) throw new Error("DIRECT_URL or DATABASE_URL must be set");

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL?.toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    console.warn("⚠️  SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set — skipping admin user");
    return;
  }
  await db.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: "Ribat Admin",
      role: "ADMIN",
      passwordHash: await bcrypt.hash(password, 12),
    },
  });
  console.log(`✔ Admin user: ${email}`);
}

async function seedShippingZones() {
  const zones = [
    { id: "zone-inside-dhaka", name: "Inside Dhaka", fee: 70, estimatedDays: "1–2 days", districts: ["Dhaka"], position: 0 },
    // Empty districts = fallback zone for everywhere else
    { id: "zone-outside-dhaka", name: "Outside Dhaka", fee: 130, estimatedDays: "2–4 days", districts: [], position: 1 },
  ];
  for (const { id, ...data } of zones) {
    await db.shippingZone.upsert({ where: { id }, update: {}, create: { id, ...data } });
  }
  console.log("✔ Shipping zones");
}

async function seedAttributes() {
  const color = await db.attribute.upsert({
    where: { slug: "color" },
    update: {},
    create: { name: "Color", slug: "color", display: "SWATCH", position: 0 },
  });
  const size = await db.attribute.upsert({
    where: { slug: "size" },
    update: {},
    create: { name: "Size", slug: "size", display: "BUTTON", position: 1 },
  });

  const colors = [
    ["Black", "#111111"],
    ["White", "#F7F5EF"],
    ["Off White", "#EDE6D6"],
    ["Navy", "#1F2A44"],
    ["Olive", "#5B5F3A"],
    ["Maroon", "#5E1A24"],
  ] as const;
  for (const [i, [value, swatchHex]] of colors.entries()) {
    const slug = value.toLowerCase().replace(/\s+/g, "-");
    await db.attributeValue.upsert({
      where: { attributeId_slug: { attributeId: color.id, slug } },
      update: {},
      create: { attributeId: color.id, value, slug, swatchHex, position: i },
    });
  }

  const sizes = ["S", "M", "L", "XL", "XXL", "3XL"];
  for (const [i, value] of sizes.entries()) {
    const slug = value.toLowerCase();
    await db.attributeValue.upsert({
      where: { attributeId_slug: { attributeId: size.id, slug } },
      update: {},
      create: { attributeId: size.id, value, slug, position: i },
    });
  }
  console.log("✔ Attributes: Color, Size");
}

async function seedCatalogStructure() {
  for (const [position, c] of categories.entries()) {
    const data = { name: c.name, nameBn: c.nameBn, description: c.blurb, position };
    await db.category.upsert({ where: { slug: c.slug }, update: {}, create: { slug: c.slug, ...data } });
  }
  // Placeholder categories from the original scaffold — remove only while still empty.
  await db.category.deleteMany({ where: { slug: { in: ["men", "women", "accessories"] }, products: { none: {} } } });
  await db.collection.upsert({
    where: { slug: "new-arrivals" },
    update: {},
    create: { name: "New Arrivals", slug: "new-arrivals", position: 0 },
  });
  console.log("✔ Categories & collections");
}

async function seedSettings() {
  for (const key of Object.keys(settingSchemas) as SettingKey[]) {
    const value = settingSchemas[key].parse({});
    await db.setting.upsert({ where: { key }, update: {}, create: { key, value } });
  }
  console.log("✔ Default settings");
}

/** Upserts a Color/Size value and returns its ID (keeps existing swatches). */
async function attributeValueId(attributeSlug: "color" | "size", value: string, swatchHex?: string) {
  const attribute = await db.attribute.findUniqueOrThrow({ where: { slug: attributeSlug } });
  const slug = valueSlug(value);
  const row = await db.attributeValue.upsert({
    where: { attributeId_slug: { attributeId: attribute.id, slug } },
    update: {},
    create: { attributeId: attribute.id, value, slug, swatchHex },
  });
  return { attributeId: attribute.id, attributeValueId: row.id };
}

async function seedProducts() {
  let created = 0;
  for (const p of products) {
    // Idempotent: never overwrite a product an admin may have edited.
    if (await db.product.findUnique({ where: { slug: p.slug }, select: { id: true } })) continue;

    const variants = buildVariants(p);
    const variantRows = [];
    for (const [position, v] of variants.entries()) {
      const options = [];
      if (v.color) options.push(await attributeValueId("color", v.color, p.colors.find((c) => c.name === v.color)?.hex));
      if (v.size) options.push(await attributeValueId("size", v.size));
      variantRows.push({
        sku: v.sku,
        title: variantTitle(v.color, v.size),
        optionKey: optionKeyFor(options.map((o) => o.attributeValueId)),
        price: v.price,
        compareAtPrice: v.compareAtPrice,
        costPrice: Math.round(v.price * 0.45),
        stock: v.stock,
        isDefault: position === 0,
        position,
        options: { create: options },
      });
    }

    await db.product.create({
      data: {
        name: p.name,
        nameBn: p.nameBn,
        slug: p.slug,
        type: p.type,
        status: p.status,
        badge: p.badge ?? null,
        shortDescription: p.shortDescription,
        description: p.descriptionBn,
        fabricCare: `${p.fabric}\n${p.care}`,
        tags: [p.category, ...(p.badge ? [p.badge.toLowerCase()] : [])],
        isFeatured: p.isFeatured,
        minPrice: p.price,
        maxPrice: p.price,
        totalStock: p.stock,
        ratingAvg: p.rating,
        reviewCount: p.reviewCount,
        metaTitle: p.name,
        metaDescription: p.shortDescription,
        publishedAt: p.status === "ACTIVE" ? new Date(p.createdAt) : null,
        createdAt: new Date(p.createdAt),
        category: { connect: { slug: p.category } },
        variants: { create: variantRows },
      },
    });
    created++;
  }
  console.log(`✔ Products (${created} created, ${products.length - created} already present)`);
}

async function main() {
  await seedAdmin();
  await seedShippingZones();
  await seedAttributes();
  await seedCatalogStructure();
  await seedProducts();
  await seedSettings();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
