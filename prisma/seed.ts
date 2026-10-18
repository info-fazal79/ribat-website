/**
 * Idempotent seed: safe to run repeatedly (`npm run db:seed`).
 * Creates the first admin, shipping zones, core attributes, base
 * categories/collections and default settings.
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { settingSchemas, type SettingKey } from "../src/lib/validations/settings";

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
  const categories = [
    { name: "Men", slug: "men", position: 0 },
    { name: "Women", slug: "women", position: 1 },
    { name: "Accessories", slug: "accessories", position: 2 },
  ];
  for (const c of categories) {
    await db.category.upsert({ where: { slug: c.slug }, update: {}, create: c });
  }
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

async function main() {
  await seedAdmin();
  await seedShippingZones();
  await seedAttributes();
  await seedCatalogStructure();
  await seedSettings();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
