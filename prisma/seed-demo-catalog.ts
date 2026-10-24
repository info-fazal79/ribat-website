/**
 * Swaps the live catalog for 15 demo products and gives the core categories line-art tiles.
 *
 *   npm run db:seed:demo-catalog                          → apply (idempotent)
 *   npm run db:seed:demo-catalog -- --restore <file.json> → undo, from the backup the apply run wrote
 *
 * Apply, in one transaction:
 *  1. writes a backup (prisma/backups/, git-ignored) of every product's status and the categories' images;
 *  2. moves every non-demo product to DRAFT — nothing is deleted, so they stay under Admin → Products → Draft;
 *  3. upserts the six core categories and points their tiles at public/images/categories/<slug>.svg;
 *  4. creates the demo products (ACTIVE): clothing as VARIABLE S–XL with per-size stock, fragrance and
 *     accessories as SIMPLE. Photos are free-licence Unsplash images (hot-linked from their CDN).
 * Existing demo products (by slug) are left as they are, so re-running never overwrites admin edits.
 * Restore puts statuses and category images back and moves the demo products to DRAFT.
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import type { ProductStatus } from "../src/generated/prisma/enums";
import { optionKeyFor } from "../src/lib/catalog/variant-keys";

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) throw new Error("DIRECT_URL or DATABASE_URL must be set");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const SIZES = ["S", "M", "L", "XL"] as const;
type CategorySlug = "panjabi" | "abaya" | "thobe" | "casual" | "fragrance" | "accessories";

const CATEGORIES: { slug: CategorySlug; name: string; nameBn: string; description: string }[] = [
  { slug: "panjabi", name: "Panjabi", nameBn: "পাঞ্জাবি", description: "Hand-finished cotton & silk panjabis" },
  { slug: "abaya", name: "Abaya", nameBn: "আবায়া", description: "Flowing Nida & crepe silhouettes" },
  { slug: "thobe", name: "Thobe", nameBn: "জুব্বা", description: "Emirati & Moroccan cuts" },
  { slug: "casual", name: "Casual", nameBn: "ক্যাজুয়াল", description: "Kurtas, shirts & everyday modest wear" },
  { slug: "fragrance", name: "Fragrance", nameBn: "আতর", description: "Alcohol-free attar & oud" },
  { slug: "accessories", name: "Accessories", nameBn: "এক্সেসরিজ", description: "Tupi, shemagh & finishing touches" },
];

const CARE = {
  clothing: "Gentle machine wash cold or dry clean · Wash dark colours separately · Iron on medium heat",
  silk: "Dry clean only · Iron on low heat on the reverse · Store on a padded hanger",
  fragrance: "Store upright away from heat and direct sunlight · Apply to pulse points · Alcohol-free, suitable for prayer",
  accessory: "Spot clean or gentle hand wash · Reshape and air dry · Store flat to keep its shape",
};

/** Free-licence Unsplash photo, cropped to the 3:4 product-card ratio by their CDN. */
const unsplash = (id: string) => `https://images.unsplash.com/photo-${id}?w=1200&h=1600&fit=crop&q=80&auto=format`;

type DemoProduct = {
  code: string;
  name: string;
  nameBn: string;
  category: CategorySlug;
  price: number;
  compareAtPrice: number;
  /** Per-size stock (S, M, L, XL) for clothing; a single number for simple products. */
  stock: number | readonly [number, number, number, number];
  badge?: "New" | "Bestseller" | "Limited" | "Eid Edit";
  featured: boolean;
  care: keyof typeof CARE;
  shortDescription: string;
  descriptionBn: string;
  details: string[];
  tags: string[];
  photos: string[];
};

const PRODUCTS: DemoProduct[] = [
  {
    code: "RBD-PJ-01",
    name: "Rajshahi Raw Silk Panjabi",
    nameBn: "রাজশাহী র সিল্ক পাঞ্জাবি",
    category: "panjabi",
    price: 5850,
    compareAtPrice: 6900,
    stock: [6, 10, 9, 5],
    badge: "Limited",
    featured: true,
    care: "silk",
    shortDescription: "Textured Rajshahi raw silk in deep maroon, with a mandarin collar and hand-finished mother-of-pearl buttons.",
    descriptionBn: "রাজশাহীর তাঁতে বোনা খাঁটি র সিল্কের পাঞ্জাবি — গাঢ় মেরুন রঙ, ম্যান্ডারিন কলার ও হাতে বসানো ঝিনুকের বোতাম। ঈদ, বিয়ে ও বিশেষ সন্ধ্যার জন্য।",
    details: ["100% Rajshahi raw silk", "Hand-finished mother-of-pearl buttons", "Mandarin band collar", "French-seamed side slits"],
    tags: ["silk", "maroon", "eid"],
    photos: [unsplash("1683105653852-25028a53a3e4")],
  },
  {
    code: "RBD-PJ-02",
    name: "Noor Minimalist Cotton Panjabi",
    nameBn: "নূর মিনিমালিস্ট কটন পাঞ্জাবি",
    category: "panjabi",
    price: 2450,
    compareAtPrice: 3200,
    stock: [12, 16, 14, 10],
    badge: "Bestseller",
    featured: true,
    care: "clothing",
    shortDescription: "A clean white panjabi in breathable organic cotton — concealed placket, straight tailored cut, made for Jumu'ah.",
    descriptionBn: "অর্গানিক কটনের ধবধবে সাদা পাঞ্জাবি — লুকানো বোতাম প্ল্যাকেট ও স্ট্রেইট কাট। গরমেও আরামদায়ক, জুমা ও প্রতিদিনের জন্য আদর্শ।",
    details: ["100% organic combed cotton", "Concealed button placket", "Breathable for Bangladeshi summers", "Tailored straight cut"],
    tags: ["cotton", "white", "jummah"],
    photos: [unsplash("1774527929685-0372244a6232"), unsplash("1774527929750-f2f32fbb3b93")],
  },
  {
    code: "RBD-PJ-03",
    name: "Zayn Hand-Embroidered Panjabi",
    nameBn: "জায়ন হ্যান্ড-এমব্রয়ডারি পাঞ্জাবি",
    category: "panjabi",
    price: 3850,
    compareAtPrice: 4600,
    stock: [5, 9, 8, 4],
    badge: "New",
    featured: true,
    care: "clothing",
    shortDescription: "Mint cotton lawn covered in fine hand chikankari embroidery, finished with shell buttons.",
    descriptionBn: "হালকা মিন্ট রঙের কটন লনে সূক্ষ্ম হাতের চিকনকারি কাজ, ঝিনুকের বোতাম। দিনের দাওয়াত ও ঈদের সকালের জন্য স্নিগ্ধ ও মার্জিত।",
    details: ["Fine cotton lawn", "Hand chikankari embroidery", "Shell buttons", "Side seam pockets"],
    tags: ["embroidered", "mint", "chikankari"],
    photos: [unsplash("1727835523545-70ee992b5763")],
  },
  {
    code: "RBD-AB-01",
    name: "Safa Nida Open Abaya",
    nameBn: "সাফা নিদা ওপেন আবায়া",
    category: "abaya",
    price: 3450,
    compareAtPrice: 4200,
    stock: [8, 12, 10, 6],
    badge: "Bestseller",
    featured: true,
    care: "clothing",
    shortDescription: "Soft stone-beige Nida that drapes beautifully — open front, wide sleeves and a matching belt.",
    descriptionBn: "নরম স্টোন-বেইজ নিদা ফেব্রিকের ওপেন আবায়া — চওড়া হাতা ও ম্যাচিং বেল্ট। হালকা, ঝরঝরে ও সারাদিন আরামদায়ক।",
    details: ["Premium Nida fabric", "Open front with inner snap", "Wide bell sleeves", "Matching self-belt"],
    tags: ["nida", "beige", "open-abaya"],
    photos: [unsplash("1752794673269-dc356838c5fd")],
  },
  {
    code: "RBD-AB-02",
    name: "Madinah Crepe Kaftan Abaya",
    nameBn: "মদিনা ক্রেপ কাফতান আবায়া",
    category: "abaya",
    price: 3950,
    compareAtPrice: 4800,
    stock: [6, 9, 8, 5],
    badge: "New",
    featured: true,
    care: "clothing",
    shortDescription: "A belted kaftan abaya in flowing Korean crepe, with pleated godet panels that move as you walk.",
    descriptionBn: "ফ্লোয়িং কোরিয়ান ক্রেপের বেল্টেড কাফতান আবায়া — প্লিটেড গোডেট প্যানেল চলার সাথে সুন্দরভাবে দোলে। কুঁচকায় না, ভ্রমণেও উপযোগী।",
    details: ["Flowing Korean crepe", "Belted kaftan silhouette", "Pleated godet panels", "Wrinkle-resistant"],
    tags: ["crepe", "kaftan", "beige"],
    photos: [unsplash("1760083545495-b297b1690672")],
  },
  {
    code: "RBD-AB-03",
    name: "Layla Royal Embroidered Abaya",
    nameBn: "লায়লা রয়্যাল এমব্রয়ডারি আবায়া",
    category: "abaya",
    price: 5450,
    compareAtPrice: 6500,
    stock: [4, 7, 6, 3],
    badge: "Eid Edit",
    featured: true,
    care: "silk",
    shortDescription: "Formal black crepe with hand-beaded floral appliqué and pearl-trimmed cuffs — our Eid statement piece.",
    descriptionBn: "কালো ফর্মাল ক্রেপে হাতে বসানো ফ্লোরাল অ্যাপ্লিক ও মুক্তার কাজ করা হাতা। ঈদ ও বিশেষ অনুষ্ঠানের জন্য রাজকীয় আবায়া।",
    details: ["Hand-beaded floral appliqué", "Pearl-trimmed cuffs", "Silk-touch formal crepe", "Concealed front closure"],
    tags: ["embroidered", "black", "eid", "formal"],
    photos: [unsplash("1772474500365-c2c520545f44"), unsplash("1772474578035-bebcd90b355d"), unsplash("1772474521525-c022114367ce")],
  },
  {
    code: "RBD-TH-01",
    name: "Emirati Classic Tassel Thobe",
    nameBn: "এমিরাতি ক্লাসিক ট্যাসেল জুব্বা",
    category: "thobe",
    price: 3650,
    compareAtPrice: 4400,
    stock: [8, 13, 12, 7],
    badge: "Bestseller",
    featured: true,
    care: "clothing",
    shortDescription: "Crisp white Emirati thobe with a collarless neckline and the signature braided farukha tassel.",
    descriptionBn: "কলারবিহীন এমিরাতি কাটের সাদা জুব্বা, গলায় ঐতিহ্যবাহী ব্রেইডেড ফারুখা ট্যাসেল। ঢিলেঢালা, মার্জিত ও সারাদিন আরামদায়ক।",
    details: ["Japanese poly-viscose blend", "Braided farukha tassel", "Collarless Emirati neckline", "Hidden press-stud placket"],
    tags: ["thobe", "white", "emirati"],
    photos: [unsplash("1616147147027-60d49d3582c4")],
  },
  {
    code: "RBD-TH-02",
    name: "Moroccan Hooded Djellaba",
    nameBn: "মরোক্কান হুডেড জেল্লাবা",
    category: "thobe",
    price: 4650,
    compareAtPrice: 5500,
    stock: [3, 6, 6, 4],
    badge: "Limited",
    featured: false,
    care: "clothing",
    shortDescription: "Hand-loomed striped djellaba with the traditional pointed hood and hand-knotted sfifa trim.",
    descriptionBn: "হাতে বোনা স্ট্রাইপড জেল্লাবা — ঐতিহ্যবাহী সূচালো হুড ও হাতে গিঁট দেওয়া সফিফা ট্রিম। শীতের সকাল ও ভ্রমণের জন্য।",
    details: ["Hand-loomed striped cotton-wool", "Traditional pointed hood (qob)", "Hand-knotted sfifa trim", "Relaxed full length"],
    tags: ["djellaba", "moroccan", "striped", "winter"],
    photos: [unsplash("1762782777495-9d297f3d9d3d")],
  },
  {
    code: "RBD-TH-03",
    name: "Omani Collarless Thobe",
    nameBn: "ওমানি কলারলেস জুব্বা",
    category: "thobe",
    price: 3250,
    compareAtPrice: 3900,
    stock: [9, 12, 11, 8],
    featured: true,
    care: "clothing",
    shortDescription: "Dusty-blue brushed cotton thobe with a soft round neckline and a relaxed, breathable fit.",
    descriptionBn: "ডাস্টি-ব্লু ব্রাশড কটনের জুব্বা — নরম গোল গলা ও ঢিলেঢালা আরামদায়ক কাট। অফিস থেকে মসজিদ, সারাদিনের সঙ্গী।",
    details: ["Soft brushed cotton blend", "Collarless round neckline", "Single chest pocket", "Side seam pockets"],
    tags: ["thobe", "blue", "omani"],
    photos: [unsplash("1785613590379-a59aef767c16")],
  },
  {
    code: "RBD-CS-01",
    name: "Medina Linen Kurta",
    nameBn: "মদিনা লিনেন কুর্তা",
    category: "casual",
    price: 2650,
    compareAtPrice: 3200,
    stock: [10, 14, 12, 8],
    badge: "New",
    featured: true,
    care: "clothing",
    shortDescription: "An easy linen-cotton kurta set in ocean blue — short band collar, matching straight trousers.",
    descriptionBn: "ওশান ব্লু লিনেন-কটনের কুর্তা সেট — ছোট ব্যান্ড কলার ও ম্যাচিং স্ট্রেইট পায়জামা। ছুটির দিন ও ঘরোয়া দাওয়াতের জন্য।",
    details: ["Linen-cotton blend", "Short band collar", "Kurta & trouser set", "Relaxed straight cut"],
    tags: ["linen", "blue", "kurta-set"],
    photos: [unsplash("1770359993283-a2c2f386584e")],
  },
  {
    code: "RBD-CS-02",
    name: "Everyday Relaxed Modest Shirt",
    nameBn: "এভরিডে রিল্যাক্সড মডেস্ট শার্ট",
    category: "casual",
    price: 2450,
    compareAtPrice: 2950,
    stock: [12, 16, 14, 10],
    featured: false,
    care: "clothing",
    shortDescription: "Washed linen with a grandad band collar and a longer, modest hem — the shirt you reach for every day.",
    descriptionBn: "ওয়াশড লিনেনের ব্যান্ড কলার শার্ট, একটু লম্বা মার্জিত হেম। অফিস, ক্লাস বা আড্ডা — প্রতিদিনের জন্য।",
    details: ["Washed linen", "Grandad band collar", "Longer modest hem", "Relaxed fit"],
    tags: ["linen", "shirt", "everyday"],
    photos: [unsplash("1627686011747-74adda3d2343"), unsplash("1713881842156-3d9ef36418cc")],
  },
  {
    code: "RBD-FR-01",
    name: "Royal Cambodian Oud Attar (6ml)",
    nameBn: "রয়্যাল কম্বোডিয়ান উদ আতর (৬ মি.লি.)",
    category: "fragrance",
    price: 2850,
    compareAtPrice: 3400,
    stock: 45,
    badge: "Bestseller",
    featured: true,
    care: "fragrance",
    shortDescription: "Concentrated, alcohol-free Cambodian oud with rose and saffron, hand-filled in a 6ml glass roll-on.",
    descriptionBn: "অ্যালকোহলমুক্ত ঘন কম্বোডিয়ান উদ আতর — গোলাপ ও জাফরানের ছোঁয়া। এক ফোঁটাই সারাদিন, নামাজের জন্য উপযোগী।",
    details: ["Alcohol-free concentrated oil", "Cambodian oud, rose & saffron", "8–12 hour longevity", "Hand-filled 6ml glass roll-on"],
    tags: ["attar", "oud", "alcohol-free"],
    photos: [unsplash("1738414808975-201966230c59"), unsplash("1646149757906-e6e9e9a7c77f")],
  },
  {
    code: "RBD-FR-02",
    name: "Imperial Amber & Musk Extrait",
    nameBn: "ইম্পেরিয়াল অ্যাম্বার অ্যান্ড মাস্ক এক্সট্রেইট",
    category: "fragrance",
    price: 3450,
    compareAtPrice: 4100,
    stock: 30,
    badge: "New",
    featured: false,
    care: "fragrance",
    shortDescription: "A warm, oil-based extrait of golden amber, white musk and vanilla — alcohol-free, 30ml.",
    descriptionBn: "সোনালি অ্যাম্বার, হোয়াইট মাস্ক ও ভ্যানিলার উষ্ণ সুবাস — তেলভিত্তিক, অ্যালকোহলমুক্ত, ৩০ মি.লি.। সন্ধ্যা ও শীতের জন্য।",
    details: ["Alcohol-free, oil-based extrait", "Amber, white musk & vanilla", "30ml amber glass bottle", "Long-lasting sillage"],
    tags: ["amber", "musk", "alcohol-free"],
    photos: [unsplash("1784822041091-604b5172e4d0")],
  },
  {
    code: "RBD-AC-01",
    name: "Handcrafted Sultan Velvet Tupi",
    nameBn: "হ্যান্ডক্রাফটেড সুলতান ভেলভেট টুপি",
    category: "accessories",
    price: 2450,
    compareAtPrice: 2950,
    stock: 25,
    badge: "Limited",
    featured: false,
    care: "accessory",
    shortDescription: "Royal-blue crown hand-beaded in gold, lined in soft velvet — structured yet breathable.",
    descriptionBn: "রয়্যাল ব্লু টুপিতে হাতে বসানো সোনালি পুঁতির কাজ, ভেতরে নরম ভেলভেট লাইনিং। শক্ত গড়ন অথচ বাতাস চলাচল করে।",
    details: ["Hand-beaded crown in royal blue & gold", "Soft velvet lining", "Structured, breathable shape", "One size, comfort fit"],
    tags: ["tupi", "cap", "handcrafted"],
    photos: [unsplash("1589189476482-98754635c620"), unsplash("1782237319321-bac65528d4a5")],
  },
  {
    code: "RBD-AC-02",
    name: "Geometric Kashmiri Shemagh",
    nameBn: "জ্যামিতিক কাশ্মীরি শেমাগ",
    category: "accessories",
    price: 2650,
    compareAtPrice: 3200,
    stock: 35,
    featured: false,
    care: "accessory",
    shortDescription: "A fine cotton-wool shemagh in classic red and ivory geometric weave, with hand-knotted tassels.",
    descriptionBn: "লাল ও আইভরি জ্যামিতিক বুননের কটন-উল শেমাগ, হাতে গিঁট দেওয়া ট্যাসেল। শীত, ভ্রমণ ও ঐতিহ্যবাহী সাজে।",
    details: ["Fine cotton-wool weave", "Classic geometric pattern", "Hand-knotted tassels", "120 × 120 cm"],
    tags: ["shemagh", "scarf", "red"],
    photos: [unsplash("1756412066366-b46dafaca253")],
  },
];

const slugOf = (p: DemoProduct) => p.name.toLowerCase().replace(/[()]/g, "").replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const demoSlugs = PRODUCTS.map(slugOf);
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

type Backup = { at: string; products: { slug: string; status: ProductStatus }[]; categories: { slug: string; imageUrl: string | null }[] };

async function apply() {
  const backupDir = path.resolve("prisma/backups");
  fs.mkdirSync(backupDir, { recursive: true });
  const backup: Backup = {
    at: new Date().toISOString(),
    products: await db.product.findMany({ where: { slug: { notIn: demoSlugs } }, select: { slug: true, status: true } }),
    categories: await db.category.findMany({ select: { slug: true, imageUrl: true } }),
  };
  const backupPath = path.join(backupDir, `demo-catalog-${backup.at.replace(/[:.]/g, "-")}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
  console.log(`✔ Backup: ${path.relative(process.cwd(), backupPath)}`);

  const size = await db.attribute.findUniqueOrThrow({ where: { slug: "size" } });
  const sizeValues = await db.attributeValue.findMany({ where: { attributeId: size.id, slug: { in: SIZES.map((s) => s.toLowerCase()) } } });
  const sizeId = (s: string) => {
    const v = sizeValues.find((x) => x.slug === s.toLowerCase());
    if (!v) throw new Error(`Size ${s} missing — run \`npm run db:seed\` first`);
    return v.id;
  };
  const newArrivals = await db.collection.findUnique({ where: { slug: "new-arrivals" }, select: { id: true } });

  await db.$transaction(
    async (tx) => {
      const drafted = await tx.product.updateMany({ where: { slug: { notIn: demoSlugs }, status: { not: "DRAFT" } }, data: { status: "DRAFT" } });
      console.log(`✔ Moved ${drafted.count} existing products to DRAFT`);

      for (const [position, c] of CATEGORIES.entries()) {
        const imageUrl = `/images/categories/${c.slug}.svg`;
        await tx.category.upsert({
          where: { slug: c.slug },
          update: { imageUrl, isActive: true },
          create: { ...c, imageUrl, position },
        });
      }
      console.log(`✔ Categories (${CATEGORIES.length}) with line-art tiles`);

      let created = 0;
      const now = Date.now();
      for (const [pi, p] of PRODUCTS.entries()) {
        const slug = slugOf(p);
        if (await tx.product.findUnique({ where: { slug }, select: { id: true } })) continue;

        const sized = typeof p.stock !== "number";
        const stocks = typeof p.stock === "number" ? [p.stock] : [...p.stock];
        const variants = stocks.map((stock, vi) => {
          const s = sized ? SIZES[vi] : null;
          return {
            sku: `${p.code}-${s ?? "STD"}`,
            title: s ?? "Standard",
            optionKey: optionKeyFor(s ? [sizeId(s)] : []),
            price: p.price,
            compareAtPrice: p.compareAtPrice,
            costPrice: Math.round(p.price * 0.45),
            stock,
            isDefault: vi === 0,
            position: vi,
            options: s ? { create: [{ attributeId: size.id, attributeValueId: sizeId(s) }] } : undefined,
          };
        });
        // Staggered so "Newest" sorting follows the list order.
        const createdAt = new Date(now - pi * 60 * 60 * 1000);
        await tx.product.create({
          data: {
            name: p.name,
            nameBn: p.nameBn,
            slug,
            type: sized ? "VARIABLE" : "SIMPLE",
            status: "ACTIVE",
            badge: p.badge ?? null,
            shortDescription: p.shortDescription,
            description:
              `<p>${esc(p.descriptionBn)}</p><p>${esc(p.shortDescription)}</p>` +
              `<ul>${p.details.map((d) => `<li>${esc(d)}</li>`).join("")}</ul>`,
            fabricCare: CARE[p.care],
            tags: [p.category, ...p.tags],
            isFeatured: p.featured,
            minPrice: p.price,
            maxPrice: p.price,
            totalStock: stocks.reduce((n, s) => n + s, 0),
            metaTitle: `${p.name} | Ribat`,
            metaDescription: p.shortDescription.slice(0, 160),
            publishedAt: createdAt,
            createdAt,
            category: { connect: { slug: p.category } },
            ...(newArrivals && { collections: { connect: { id: newArrivals.id } } }),
            images: { create: p.photos.map((url, position) => ({ url, alt: `${p.name} — photo ${position + 1}`, position })) },
            variants: { create: variants },
          },
        });
        created++;
      }
      console.log(`✔ Demo products (${created} created, ${PRODUCTS.length - created} already present)`);
    },
    { timeout: 60_000 },
  );
  console.log(`\nUndo with: npm run db:seed:demo-catalog -- --restore ${path.relative(process.cwd(), backupPath)}`);
}

async function restore(file: string) {
  const backup = JSON.parse(fs.readFileSync(file, "utf8")) as Backup;
  await db.$transaction(
    async (tx) => {
      for (const p of backup.products) await tx.product.updateMany({ where: { slug: p.slug }, data: { status: p.status } });
      for (const c of backup.categories) await tx.category.updateMany({ where: { slug: c.slug }, data: { imageUrl: c.imageUrl } });
      const demo = await tx.product.updateMany({ where: { slug: { in: demoSlugs } }, data: { status: "DRAFT" } });
      console.log(`✔ Restored ${backup.products.length} product statuses and ${backup.categories.length} category images; ${demo.count} demo products moved to DRAFT`);
    },
    { timeout: 60_000 },
  );
}

const restoreIndex = process.argv.indexOf("--restore");
(restoreIndex >= 0 ? restore(process.argv[restoreIndex + 1] ?? "") : apply())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
