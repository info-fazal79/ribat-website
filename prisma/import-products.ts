/**
 * Replaces the starter/demo catalog with Ribat's real products from ./images/<CODE - Name>/.
 *
 *   npm run db:import:products                          → dry run: prints the plan, writes nothing
 *   npm run db:import:products -- --apply --backup <file.json>
 *
 * --apply, in one DB transaction:
 *  1. backs up (to --backup) and deletes the demo catalog products (prisma/data/catalog.ts slugs) and the
 *     landing pages that point at them — LandingPage → Product is ON DELETE RESTRICT. Orders survive:
 *     order items keep their snapshots and their product link is set to null.
 *  2. creates the 9 real products (size variants, gallery) in their categories, creating Accessories;
 *  3. registers every photo in the Media Library and relinks hero slides that pointed at a deleted product.
 * Photos are copied to public/products/<folder-slug>/ (served statically, committed to git).
 * Re-running is safe: existing products (by slug) and media (by URL) are skipped.
 * Admin users, shipping zones, settings, attributes, media uploads and orders are never deleted.
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { optionKeyFor } from "../src/lib/catalog/variant-keys";
import { settingSchemas } from "../src/lib/validations/settings";
import { products as demoProducts } from "./data/catalog";

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const backupPath = args[args.indexOf("--backup") + 1];
if (APPLY && (!args.includes("--backup") || !backupPath)) throw new Error("--apply needs --backup <file.json>");

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) throw new Error("DIRECT_URL or DATABASE_URL must be set");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const IMAGES_DIR = path.resolve("images");
const PUBLIC_DIR = path.resolve("public/products");
const CLOTHING_SIZES = ["S", "M", "L", "XL"];

type CategorySlug = "thobe" | "abaya" | "panjabi" | "accessories";
type RealProduct = {
  folder: string;
  name: string;
  nameBn: string;
  category: CategorySlug;
  price: number;
  compareAtPrice: number;
  sized: boolean;
  featured: boolean;
  shortDescription: string;
  /** Bengali paragraph for the product page. */
  descriptionBn: string;
  details: string[];
  tags: string[];
};

const CARE_CLOTHING = "Gentle machine wash cold or dry clean · Wash dark colours separately · Iron on medium heat";
const CARE_CAP = "Spot clean or gentle hand wash · Reshape and air dry · Store flat to keep its shape";

/** Copy written from the product photos; prices in BDT. */
const REAL_PRODUCTS: RealProduct[] = [
  {
    folder: "RB001 - ArabianJubba",
    name: "RB001 — Premium Arabian Jubba",
    nameBn: "প্রিমিয়াম আরবি জুব্বা",
    category: "thobe",
    price: 3650,
    compareAtPrice: 4500,
    sized: true,
    featured: true,
    shortDescription: "Crisp white Saudi-cut jubba with a structured stand collar, square metal buttons and a chest pocket.",
    descriptionBn: "সৌদি কাটের ধবধবে সাদা জুব্বা — শক্ত স্ট্যান্ড কলার, স্কয়ার মেটাল বোতাম ও বুক পকেট। জুমা, ঈদ ও যেকোনো বিশেষ দিনের জন্য পরিপাটি ও আরামদায়ক।",
    details: ["Saudi-style stand collar", "Square metal button placket", "Chest pocket with metal accent", "Full-length relaxed fit"],
    tags: ["jubba", "white", "saudi"],
  },
  {
    folder: "RB012 - EmiratiThobe",
    name: "RB012 — Emirati Classic Thobe",
    nameBn: "এমিরাতি ক্লাসিক জুব্বা",
    category: "thobe",
    price: 3950,
    compareAtPrice: 4800,
    sized: true,
    featured: true,
    shortDescription: "Collarless Emirati-cut white thobe with the signature braided tassel (farukha) at the neckline.",
    descriptionBn: "কলারবিহীন এমিরাতি কাটের সাদা জুব্বা, গলায় ঐতিহ্যবাহী ব্রেইডেড ট্যাসেল (ফারুখা)। ঢিলেঢালা, মার্জিত ও সারাদিন আরামদায়ক।",
    details: ["Collarless Emirati neckline", "Braided tassel (farukha)", "Concealed front opening", "Loose, flowing fit"],
    tags: ["thobe", "white", "emirati"],
  },
  {
    folder: "RB021 - JubbaCollection",
    name: "RB021 — Signature Black Jubba",
    nameBn: "সিগনেচার কালো জুব্বা",
    category: "thobe",
    price: 3450,
    compareAtPrice: 4200,
    sized: true,
    featured: false,
    shortDescription: "Deep black jubba with a band collar, silver-tone buttons and a clean pointed placket.",
    descriptionBn: "গভীর কালো রঙের জুব্বা — ব্যান্ড কলার, সিলভার টোন বোতাম ও পরিচ্ছন্ন পয়েন্টেড প্ল্যাকেট। প্রতিদিন কিংবা বিশেষ আয়োজনে সমান মানানসই।",
    details: ["Band collar with double button", "Silver-tone button placket", "Chest pocket with metal accent", "Buttoned cuffs"],
    tags: ["jubba", "black"],
  },
  {
    folder: "RB026 - NavyJubba",
    name: "RB026 — Royal Navy Jubba",
    nameBn: "রয়্যাল নেভি জুব্বা",
    category: "thobe",
    price: 3650,
    compareAtPrice: 4450,
    sized: true,
    featured: true,
    shortDescription: "Rich navy jubba with a stand collar, engraved square buttons and a pointed placket.",
    descriptionBn: "গাঢ় নেভি ব্লু জুব্বা — স্ট্যান্ড কলার, নকশা করা স্কয়ার বোতাম ও পয়েন্টেড প্ল্যাকেট। রুচিশীল ও রাজকীয় লুকের জন্য।",
    details: ["Stand collar", "Engraved square metal buttons", "Chest pocket with metal bar", "Pointed placket"],
    tags: ["jubba", "navy"],
  },
  {
    folder: "RB032 - ArabianAbaya",
    name: "RB032 — Luxury Arabian Abaya",
    nameBn: "লাক্সারি আরবি আবায়া (বিশত)",
    category: "abaya",
    price: 4850,
    compareAtPrice: 5950,
    sized: true,
    featured: true,
    shortDescription: "Men's sky-blue Arabian abaya (bisht) with wide gold-embroidered borders, worn open over a thobe.",
    descriptionBn: "পুরুষদের আকাশি নীল আরবি আবায়া (বিশত) — চওড়া সোনালি এমব্রয়ডারি পাড়, জুব্বার উপর খোলা পরার জন্য। বিয়ে, ঈদ ও বিশেষ অনুষ্ঠানে রাজকীয় উপস্থিতি।",
    details: ["Wide gold-embroidered borders", "Gold trim on the sleeves", "Tie cord at the chest", "Flowing open-front cut"],
    tags: ["abaya", "bisht", "men", "sky-blue"],
  },
  {
    folder: "RB035 - MisriJubba",
    name: "RB035 — Misri Jubba",
    nameBn: "মিশরি জুব্বা",
    category: "thobe",
    price: 3750,
    compareAtPrice: 4600,
    sized: true,
    featured: false,
    shortDescription: "Charcoal-grey Egyptian-style (Misri) jubba with a band collar and engraved square buttons.",
    descriptionBn: "চারকোল গ্রে মিশরি স্টাইলের জুব্বা — ব্যান্ড কলার ও নকশা করা স্কয়ার বোতাম। সূক্ষ্ম টেক্সচার ও পরিপাটি কাট।",
    details: ["Egyptian (Misri) cut", "Band collar", "Engraved square buttons", "Chest pocket with button"],
    tags: ["jubba", "charcoal", "misri"],
  },
  {
    folder: "RB044 - Abaya",
    name: "RB044 — Royal Arabian Abaya",
    nameBn: "রয়্যাল আরবি আবায়া",
    category: "abaya",
    price: 4450,
    compareAtPrice: 5450,
    sized: true,
    featured: true,
    shortDescription: "Men's light-blue Arabian abaya (bisht) with bronze woven borders, gold piping and a tasselled cord.",
    descriptionBn: "পুরুষদের হালকা নীল আরবি আবায়া (বিশত) — ব্রোঞ্জ রঙের বোনা পাড়, সোনালি পাইপিং ও ট্যাসেলসহ কর্ড। জুব্বার উপর খোলা পরার জন্য।",
    details: ["Bronze woven borders", "Gold piping along the edges", "Tasselled tie cord", "Flowing open-front cut"],
    tags: ["abaya", "bisht", "men", "light-blue"],
  },
  {
    folder: "RB053 - Ribat Tupi",
    name: "RB053 — Ribat Signature Tupi",
    nameBn: "রিবাত সিগনেচার টুপি",
    category: "accessories",
    price: 650,
    compareAtPrice: 850,
    sized: false,
    featured: false,
    shortDescription: "Structured felt tupi with a soft brushed finish and a classic button top.",
    descriptionBn: "নরম ব্রাশড ফিনিশের স্ট্রাকচার্ড ফেল্ট টুপি, উপরে ক্লাসিক বোতাম। জুব্বা ও পাঞ্জাবির সাথে মানানসই।",
    details: ["Structured felt body", "Brushed texture", "Button top", "One standard size"],
    tags: ["tupi", "cap", "accessories"],
  },
  {
    folder: "RB054 - Ribat-brand-Hat",
    name: "RB054 — Ribat Embroidered Cap",
    nameBn: "রিবাত এমব্রয়ডারি টুপি",
    category: "accessories",
    price: 950,
    compareAtPrice: 1200,
    sized: false,
    featured: false,
    shortDescription: "White cotton cap with geometric lattice embroidery and a reinforced, stitched band.",
    descriptionBn: "সাদা কটন টুপি, জ্যামিতিক জালি নকশার এমব্রয়ডারি ও মজবুত সেলাই করা বেল্ট। নামাজ ও প্রতিদিনের ব্যবহারের জন্য।",
    details: ["Geometric lattice embroidery", "Stitched, reinforced band", "Breathable cotton", "One standard size"],
    tags: ["tupi", "cap", "embroidered", "accessories"],
  },
];

/** Closest real product for anything (hero slides) that linked a demo product. */
const REPLACEMENT: Record<string, string> = {
  "emirati-classic-thobe": "RB012",
  "moroccan-hooded-jubba": "RB035",
  "noor-embroidered-cotton-panjabi": "RB001",
  "zayn-raw-silk-panjabi": "RB026",
  "medina-linen-kurta": "RB021",
  "sunnah-pique-polo": "RB021",
  "safa-nida-open-abaya": "RB032",
  "layla-pleated-crepe-abaya": "RB044",
  "classic-black-butterfly-abaya": "RB044",
  "royal-oud-attar": "RB053",
  "white-musk-tahara": "RB053",
  "hajj-ihram-set": "RB054",
};

const ACCESSORIES = { slug: "accessories", name: "Accessories", nameBn: "এক্সেসরিজ", description: "Tupi, caps and finishing touches." };

/** "RB001 - ArabianJubba" → "rb001-arabian-jubba"; "RB054 - Ribat-brand-Hat" → "rb054-ribat-brand-hat". */
const folderSlug = (folder: string) =>
  folder
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const productSlug = (p: RealProduct) =>
  p.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const code = (p: RealProduct) => p.folder.split(" ")[0];
const MIME: Record<string, string> = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };
/** Deterministic 15–30 pcs so re-runs (and reviews of this script) see the same numbers. */
const stockFor = (productIndex: number, variantIndex: number) => 15 + ((productIndex * 7 + variantIndex * 5) % 16);
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

type Photo = { file: string; url: string; size: number; mimeType: string; width: number | null; height: number | null };

async function scanPhotos(p: RealProduct): Promise<Photo[]> {
  const dir = path.join(IMAGES_DIR, p.folder);
  const files = fs
    .readdirSync(dir)
    .filter((f) => MIME[path.extname(f).toLowerCase()])
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  if (files.length === 0) throw new Error(`No images in ${dir}`);
  return Promise.all(
    files.map(async (file) => {
      const meta = await sharp(path.join(dir, file)).metadata();
      return {
        file,
        url: `/products/${folderSlug(p.folder)}/${file}`,
        size: fs.statSync(path.join(dir, file)).size,
        mimeType: MIME[path.extname(file).toLowerCase()],
        width: meta.width ?? null,
        height: meta.height ?? null,
      };
    }),
  );
}

async function main() {
  const photos = new Map<string, Photo[]>();
  for (const p of REAL_PRODUCTS) photos.set(p.folder, await scanPhotos(p));

  const demoSlugs = demoProducts.map((p) => p.slug);
  const demo = await db.product.findMany({
    where: { slug: { in: demoSlugs } },
    include: {
      variants: { include: { options: true } },
      images: true,
      landingPages: { include: { offers: true } },
      _count: { select: { orderItems: true } },
    },
  });
  const demoIds = demo.map((p) => p.id);
  const landingPages = demo.flatMap((p) => p.landingPages);
  const existingSlugs = new Set(
    (await db.product.findMany({ where: { slug: { in: REAL_PRODUCTS.map(productSlug) } }, select: { slug: true } })).map((p) => p.slug),
  );
  const hero = settingSchemas.hero_slides.parse((await db.setting.findUnique({ where: { key: "hero_slides" } }))?.value ?? {});
  const staleSlides = hero.slides.filter((s) => s.mode === "product" && demoIds.includes(s.product.id));

  console.log(`\n${APPLY ? "APPLYING" : "DRY RUN (pass --apply --backup <file> to write)"}\n`);
  console.log(`Delete ${demo.length} demo products: ${demo.map((p) => p.slug).join(", ") || "—"}`);
  console.log(`  ↳ ${demo.reduce((n, p) => n + p.variants.length, 0)} variants, ${demo.reduce((n, p) => n + p.images.length, 0)} product images`);
  console.log(`  ↳ ${demo.reduce((n, p) => n + p._count.orderItems, 0)} order items keep their snapshot (product link set to null)`);
  console.log(`Delete ${landingPages.length} landing pages pointing at them: ${landingPages.map((l) => `${l.slug} [${l.status}]`).join(", ") || "—"}`);
  const demoSlugById = new Map(demo.map((p) => [p.id, p.slug]));
  for (const s of staleSlides) {
    const target = REAL_PRODUCTS.find((p) => code(p) === (REPLACEMENT[demoSlugById.get(s.product.id)!] ?? "RB001"))!;
    console.log(`Relink hero slide "${s.title}" (${demoSlugById.get(s.product.id)}) → ${target.name}`);
  }
  for (const p of REAL_PRODUCTS) {
    const ph = photos.get(p.folder)!;
    console.log(
      `${existingSlugs.has(productSlug(p)) ? "SKIP (exists)" : "Create"} ${p.name} · ${p.category} · ৳${p.price} (was ৳${p.compareAtPrice}) · ` +
        `${p.sized ? CLOTHING_SIZES.join("/") : "Standard"} · ${ph.length} photos → /products/${folderSlug(p.folder)}/`,
    );
  }
  if (!APPLY) return;

  // Backup first: everything this run deletes or rewrites.
  fs.writeFileSync(backupPath, JSON.stringify({ at: new Date().toISOString(), products: demo, heroSlides: hero }, null, 2));
  console.log(`\n✔ Backup written to ${backupPath}`);

  // Copy photos (idempotent).
  for (const p of REAL_PRODUCTS) {
    const dest = path.join(PUBLIC_DIR, folderSlug(p.folder));
    fs.mkdirSync(dest, { recursive: true });
    for (const ph of photos.get(p.folder)!) fs.copyFileSync(path.join(IMAGES_DIR, p.folder, ph.file), path.join(dest, ph.file));
  }
  console.log(`✔ Copied ${[...photos.values()].flat().length} photos to public/products/`);

  const size = await db.attribute.findUniqueOrThrow({ where: { slug: "size" }, include: { values: true } });
  const sizeValue = (v: string) => {
    const row = size.values.find((x) => x.slug === v.toLowerCase());
    if (!row) throw new Error(`Size value ${v} missing — run npm run db:seed first`);
    return row;
  };
  const newArrivals = await db.collection.findUnique({ where: { slug: "new-arrivals" }, select: { id: true } });

  await db.$transaction(
    async (tx) => {
      // 1. Remove demo catalog (landing pages first: they RESTRICT product deletes).
      const lp = await tx.landingPage.deleteMany({ where: { productId: { in: demoIds } } });
      const del = await tx.product.deleteMany({ where: { id: { in: demoIds } } });
      console.log(`✔ Deleted ${lp.count} landing pages and ${del.count} demo products (variants & images cascade)`);

      // 2. Categories.
      const lastPosition = (await tx.category.aggregate({ _max: { position: true } }))._max.position ?? 0;
      await tx.category.upsert({
        where: { slug: ACCESSORIES.slug },
        update: { isActive: true },
        create: { ...ACCESSORIES, position: lastPosition + 1 },
      });

      // 3. Products.
      const newIds = new Map<string, string>(); // code → product id
      for (const [pi, p] of REAL_PRODUCTS.entries()) {
        const slug = productSlug(p);
        const ph = photos.get(p.folder)!;
        const existing = await tx.product.findUnique({ where: { slug }, select: { id: true } });
        if (existing) {
          newIds.set(code(p), existing.id);
          continue;
        }
        const variants = (p.sized ? CLOTHING_SIZES : [null]).map((s, vi) => {
          const value = s ? sizeValue(s) : null;
          return {
            sku: `${code(p)}-${s ?? "STD"}`,
            title: s ?? "Standard",
            optionKey: optionKeyFor(value ? [value.id] : []),
            price: p.price,
            compareAtPrice: p.compareAtPrice,
            stock: stockFor(pi, vi),
            isDefault: vi === 0,
            position: vi,
            options: value ? { create: [{ attributeId: size.id, attributeValueId: value.id }] } : undefined,
          };
        });
        const created = await tx.product.create({
          data: {
            name: p.name,
            nameBn: p.nameBn,
            slug,
            type: p.sized ? "VARIABLE" : "SIMPLE",
            status: "ACTIVE",
            shortDescription: p.shortDescription,
            description:
              `<p>${esc(p.descriptionBn)}</p><p>${esc(p.shortDescription)}</p>` +
              `<ul>${p.details.map((d) => `<li>${esc(d)}</li>`).join("")}</ul>`,
            fabricCare: p.sized ? CARE_CLOTHING : CARE_CAP,
            tags: [p.category, ...p.tags],
            isFeatured: p.featured,
            minPrice: p.price,
            maxPrice: p.price,
            totalStock: variants.reduce((n, v) => n + v.stock, 0),
            metaTitle: `${p.name.replace(" — ", " ")} | Ribat`,
            metaDescription: p.shortDescription.slice(0, 160),
            publishedAt: new Date(),
            category: { connect: { slug: p.category } },
            ...(newArrivals && { collections: { connect: { id: newArrivals.id } } }),
            // Position 0 is the featured image; the rest form the gallery.
            images: { create: ph.map((photo, position) => ({ url: photo.url, alt: `${p.name} — photo ${position + 1}`, position })) },
            variants: { create: variants },
          },
          select: { id: true },
        });
        newIds.set(code(p), created.id);
      }
      console.log("✔ Products created");

      // 4. Media Library entries (served from /public, so no bytes stored).
      const known = new Set(
        (await tx.media.findMany({ where: { url: { startsWith: "/products/" } }, select: { url: true } })).map((m) => m.url),
      );
      const media = [...photos.values()].flat().filter((ph) => !known.has(ph.url));
      await tx.media.createMany({
        data: media.map((ph) => ({ name: ph.file, url: ph.url, size: ph.size, mimeType: ph.mimeType, width: ph.width, height: ph.height })),
      });
      console.log(`✔ Registered ${media.length} photos in the Media Library`);

      // 5. Hero slides that linked a deleted product → the matching real product.
      if (staleSlides.length) {
        const slides = hero.slides.map((s) => {
          if (s.mode !== "product" || !demoIds.includes(s.product.id)) return s;
          const target = REAL_PRODUCTS.find((p) => code(p) === (REPLACEMENT[demoSlugById.get(s.product.id)!] ?? "RB001"))!;
          return { ...s, product: { ...s.product, id: newIds.get(code(target))! }, primary: { ...s.primary, url: `/products/${productSlug(target)}` } };
        });
        await tx.setting.update({ where: { key: "hero_slides" }, data: { value: { ...hero, slides } } });
        console.log(`✔ Relinked ${staleSlides.length} hero slide(s)`);
      }
    },
    { timeout: 120_000, maxWait: 20_000 },
  );
  console.log("\nDone. Deploy (or restart dev) to refresh cached storefront pages.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
