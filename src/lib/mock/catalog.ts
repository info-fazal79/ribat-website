/**
 * Mock catalog used until the storefront is wired to Prisma.
 * Shapes mirror the serializable output of a future `src/server/services/catalog.ts`
 * (Decimal → number, dates → ISO strings), so components won't change when swapped.
 */

export type CategorySlug = "panjabi" | "abaya" | "thobe" | "casual" | "fragrance";

export type MockCategory = {
  slug: CategorySlug;
  name: string;
  nameBn: string;
  blurb: string;
  /** Placeholder art tones until real photography lands. */
  tone: { from: string; to: string; ink: string };
};

export type ProductColor = { name: string; hex: string };

export type MockProduct = {
  id: string;
  slug: string;
  sku: string;
  name: string;
  nameBn: string;
  category: CategorySlug;
  type: "SIMPLE" | "VARIABLE";
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  price: number;
  compareAtPrice: number | null;
  rating: number;
  reviewCount: number;
  colors: ProductColor[];
  /** Empty for one-size items (e.g. attar). */
  sizes: string[];
  badge?: "New" | "Bestseller" | "Limited" | "Eid Edit";
  shortDescription: string;
  descriptionBn: string;
  fabric: string;
  care: string;
  stock: number;
  isFeatured: boolean;
  createdAt: string;
};

export const categories: MockCategory[] = [
  {
    slug: "panjabi",
    name: "Panjabi",
    nameBn: "পাঞ্জাবি",
    blurb: "Hand-finished cotton & silk panjabis",
    tone: { from: "#1f3b33", to: "#0f241e", ink: "#d8c08a" },
  },
  {
    slug: "abaya",
    name: "Abaya",
    nameBn: "আবায়া",
    blurb: "Flowing Nida & crepe silhouettes",
    tone: { from: "#2a2522", to: "#151210", ink: "#cbb38a" },
  },
  {
    slug: "thobe",
    name: "Thobe",
    nameBn: "জুব্বা",
    blurb: "Emirati & Moroccan cuts",
    tone: { from: "#e9e1d3", to: "#d6cab4", ink: "#5b4a2f" },
  },
  {
    slug: "casual",
    name: "Casual",
    nameBn: "ক্যাজুয়াল",
    blurb: "Kurtas, polos & everyday modest wear",
    tone: { from: "#c9b79c", to: "#a8926f", ink: "#2b2418" },
  },
  {
    slug: "fragrance",
    name: "Fragrance",
    nameBn: "আতর",
    blurb: "Alcohol-free attar & oud",
    tone: { from: "#4a2f24", to: "#2a1a14", ink: "#e2c48e" },
  },
];

export const products: MockProduct[] = [
  {
    id: "prod_01",
    slug: "noor-embroidered-cotton-panjabi",
    sku: "RBT-PJ-001",
    name: "Noor Embroidered Cotton Panjabi",
    nameBn: "নূর এমব্রয়ডারি কটন পাঞ্জাবি",
    category: "panjabi",
    type: "VARIABLE",
    status: "ACTIVE",
    price: 2450,
    compareAtPrice: 3200,
    rating: 4.8,
    reviewCount: 214,
    colors: [
      { name: "Ivory", hex: "#efe7d6" },
      { name: "Emerald", hex: "#1f4d3f" },
      { name: "Midnight", hex: "#1c2333" },
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    badge: "Bestseller",
    shortDescription: "Tone-on-tone chikan embroidery on breathable combed cotton.",
    descriptionBn:
      "প্রিমিয়াম কম্বড কটনে হাতে করা চিকন এমব্রয়ডারি। গরমে আরামদায়ক, জুম্মা ও ঈদের জন্য আদর্শ।",
    fabric: "100% combed cotton, 60s count",
    care: "Gentle hand wash in cold water. Dry in shade. Iron on reverse.",
    stock: 86,
    isFeatured: true,
    createdAt: "2026-09-28T10:00:00.000Z",
  },
  {
    id: "prod_02",
    slug: "zayn-raw-silk-panjabi",
    sku: "RBT-PJ-002",
    name: "Zayn Raw Silk Panjabi",
    nameBn: "যায়ন র সিল্ক পাঞ্জাবি",
    category: "panjabi",
    type: "VARIABLE",
    status: "ACTIVE",
    price: 4850,
    compareAtPrice: 5900,
    rating: 4.9,
    reviewCount: 97,
    colors: [
      { name: "Champagne", hex: "#d9c39a" },
      { name: "Maroon", hex: "#5a1f24" },
    ],
    sizes: ["M", "L", "XL", "XXL"],
    badge: "Eid Edit",
    shortDescription: "Rajshahi raw silk with mother-of-pearl buttons and a mandarin collar.",
    descriptionBn: "রাজশাহী র সিল্কে তৈরি, মাদার-অফ-পার্ল বোতাম ও ম্যান্ডারিন কলার। উৎসবের জন্য বিশেষ সংগ্রহ।",
    fabric: "Rajshahi raw silk, cotton lining",
    care: "Dry clean only.",
    stock: 24,
    isFeatured: true,
    createdAt: "2026-10-05T10:00:00.000Z",
  },
  {
    id: "prod_03",
    slug: "safa-nida-open-abaya",
    sku: "RBT-AB-001",
    name: "Safa Nida Open Abaya",
    nameBn: "সাফা নিদা ওপেন আবায়া",
    category: "abaya",
    type: "VARIABLE",
    status: "ACTIVE",
    price: 3650,
    compareAtPrice: 4500,
    rating: 4.9,
    reviewCount: 168,
    colors: [
      { name: "Onyx", hex: "#151515" },
      { name: "Mocha", hex: "#5c4636" },
      { name: "Sage", hex: "#8a9a83" },
    ],
    sizes: ["52", "54", "56", "58"],
    badge: "Bestseller",
    shortDescription: "Premium Dubai Nida with a fluid drape and hidden snap closure.",
    descriptionBn: "দুবাই নিদা ফেব্রিক, নরম ও ভারী ড্রেপ। লুকানো স্ন্যাপ ক্লোজার ও সাথে ম্যাচিং হিজাব।",
    fabric: "Dubai Nida (premium), matching chiffon hijab",
    care: "Machine wash cold, delicate cycle. Low iron.",
    stock: 52,
    isFeatured: true,
    createdAt: "2026-09-15T10:00:00.000Z",
  },
  {
    id: "prod_04",
    slug: "layla-pleated-crepe-abaya",
    sku: "RBT-AB-002",
    name: "Layla Pleated Crepe Abaya",
    nameBn: "লায়লা প্লিটেড ক্রেপ আবায়া",
    category: "abaya",
    type: "VARIABLE",
    status: "ACTIVE",
    price: 4200,
    compareAtPrice: null,
    rating: 4.7,
    reviewCount: 61,
    colors: [
      { name: "Dusty Rose", hex: "#b88b85" },
      { name: "Navy", hex: "#1f2a44" },
    ],
    sizes: ["52", "54", "56"],
    badge: "New",
    shortDescription: "Sunray-pleated sleeves on Korean crepe with a satin cuff trim.",
    descriptionBn: "কোরিয়ান ক্রেপে সানরে প্লিটেড হাতা ও সাটিন কাফ। অফিস ও দাওয়াতের জন্য মার্জিত ডিজাইন।",
    fabric: "Korean crepe, satin trim",
    care: "Hand wash cold. Do not wring.",
    stock: 18,
    isFeatured: true,
    createdAt: "2026-10-12T10:00:00.000Z",
  },
  {
    id: "prod_05",
    slug: "emirati-classic-thobe",
    sku: "RBT-TH-001",
    name: "Emirati Classic Thobe",
    nameBn: "এমিরাতি ক্লাসিক জুব্বা",
    category: "thobe",
    type: "VARIABLE",
    status: "ACTIVE",
    price: 3450,
    compareAtPrice: 3950,
    rating: 4.8,
    reviewCount: 132,
    colors: [
      { name: "Pure White", hex: "#f7f5ef" },
      { name: "Stone", hex: "#c8bfae" },
      { name: "Charcoal", hex: "#3a3a3a" },
    ],
    sizes: ["52", "54", "56", "58", "60"],
    shortDescription: "Collarless Emirati cut with a tassel (farukha) and side pockets.",
    descriptionBn: "কলারবিহীন এমিরাতি কাট, ফারুখা টাসেল ও সাইড পকেট। জাপানি পলি-ভিসকস, কুঁচকায় না।",
    fabric: "Japanese poly-viscose, wrinkle resistant",
    care: "Machine wash 30°C. Hang dry.",
    stock: 64,
    isFeatured: true,
    createdAt: "2026-08-30T10:00:00.000Z",
  },
  {
    id: "prod_06",
    slug: "moroccan-hooded-jubba",
    sku: "RBT-TH-002",
    name: "Moroccan Hooded Jubba",
    nameBn: "মরোক্কান হুডেড জুব্বা",
    category: "thobe",
    type: "VARIABLE",
    status: "ACTIVE",
    price: 3990,
    compareAtPrice: 4800,
    rating: 4.6,
    reviewCount: 44,
    colors: [
      { name: "Sand", hex: "#cdb48c" },
      { name: "Olive", hex: "#4d5236" },
    ],
    sizes: ["M", "L", "XL"],
    badge: "Limited",
    shortDescription: "Relaxed djellaba silhouette in brushed linen-blend with a soft hood.",
    descriptionBn: "ব্রাশড লিনেন ব্লেন্ডে রিল্যাক্সড জেলাবা সিলুয়েট, নরম হুড সহ। সীমিত সংখ্যক।",
    fabric: "55% linen, 45% cotton, brushed finish",
    care: "Cold wash, reshape while damp.",
    stock: 9,
    isFeatured: true,
    createdAt: "2026-10-01T10:00:00.000Z",
  },
  {
    id: "prod_07",
    slug: "medina-linen-kurta",
    sku: "RBT-CS-001",
    name: "Medina Linen Short Kurta",
    nameBn: "মদিনা লিনেন শর্ট কুর্তা",
    category: "casual",
    type: "VARIABLE",
    status: "ACTIVE",
    price: 1650,
    compareAtPrice: 2100,
    rating: 4.7,
    reviewCount: 189,
    colors: [
      { name: "Oat", hex: "#d8ccb4" },
      { name: "Sky", hex: "#a9bccb" },
      { name: "Moss", hex: "#5d6b4c" },
    ],
    sizes: ["S", "M", "L", "XL"],
    shortDescription: "Hip-length linen kurta with a band collar — pairs with jeans or trousers.",
    descriptionBn: "হিপ-লেংথ লিনেন কুর্তা, ব্যান্ড কলার। জিন্স বা ট্রাউজারের সাথে প্রতিদিনের জন্য পারফেক্ট।",
    fabric: "100% washed linen",
    care: "Machine wash cold. Embrace the natural creases.",
    stock: 120,
    isFeatured: true,
    createdAt: "2026-09-20T10:00:00.000Z",
  },
  {
    id: "prod_08",
    slug: "sunnah-pique-polo",
    sku: "RBT-CS-002",
    name: "Sunnah Piqué Polo",
    nameBn: "সুন্নাহ পিকে পোলো",
    category: "casual",
    type: "VARIABLE",
    status: "ACTIVE",
    price: 1250,
    compareAtPrice: 1500,
    rating: 4.5,
    reviewCount: 76,
    colors: [
      { name: "Forest", hex: "#24413a" },
      { name: "Cream", hex: "#ece4d2" },
      { name: "Black", hex: "#1a1a1a" },
    ],
    sizes: ["M", "L", "XL", "XXL"],
    badge: "New",
    shortDescription: "Longer-hem piqué polo cut for modest coverage in prayer.",
    descriptionBn: "নামাজে আরামদায়ক কভারেজের জন্য লম্বা হেম পিকে পোলো। ২২০ জিএসএম কটন।",
    fabric: "220 GSM cotton piqué",
    care: "Machine wash cold, inside out.",
    stock: 140,
    isFeatured: false,
    createdAt: "2026-10-10T10:00:00.000Z",
  },
  {
    id: "prod_09",
    slug: "royal-oud-attar",
    sku: "RBT-FR-001",
    name: "Royal Oud Attar — 12ml",
    nameBn: "রয়্যাল উদ আতর — ১২ মিলি",
    category: "fragrance",
    type: "SIMPLE",
    status: "ACTIVE",
    price: 1450,
    compareAtPrice: 1800,
    rating: 4.9,
    reviewCount: 305,
    colors: [{ name: "Amber Glass", hex: "#8a5a2b" }],
    sizes: [],
    badge: "Bestseller",
    shortDescription: "Assam oud with rose and saffron. Alcohol-free, lasts 10+ hours.",
    descriptionBn: "আসাম উদ, গোলাপ ও জাফরানের মিশ্রণ। অ্যালকোহলমুক্ত, ১০+ ঘণ্টা স্থায়ী।",
    fabric: "Concentrated perfume oil, 12ml roll-on",
    care: "Store away from direct sunlight.",
    stock: 210,
    isFeatured: true,
    createdAt: "2026-07-14T10:00:00.000Z",
  },
  {
    id: "prod_10",
    slug: "white-musk-tahara",
    sku: "RBT-FR-002",
    name: "White Musk Tahara — 6ml",
    nameBn: "হোয়াইট মাস্ক তাহারা — ৬ মিলি",
    category: "fragrance",
    type: "SIMPLE",
    status: "ACTIVE",
    price: 650,
    compareAtPrice: null,
    rating: 4.8,
    reviewCount: 142,
    colors: [{ name: "Frosted", hex: "#e6e2dc" }],
    sizes: [],
    shortDescription: "Soft, clean musk — gentle enough for everyday wear.",
    descriptionBn: "নরম ও পরিচ্ছন্ন মাস্ক সুবাস — প্রতিদিন ব্যবহারের উপযোগী।",
    fabric: "Concentrated perfume oil, 6ml roll-on",
    care: "Store away from direct sunlight.",
    stock: 3,
    isFeatured: false,
    createdAt: "2026-06-02T10:00:00.000Z",
  },
  {
    id: "prod_11",
    slug: "hajj-ihram-set",
    sku: "RBT-CS-003",
    name: "Hajj Ihram Set — Premium Towel",
    nameBn: "হজ্জ ইহরাম সেট — প্রিমিয়াম টাওয়েল",
    category: "casual",
    type: "SIMPLE",
    status: "DRAFT",
    price: 2200,
    compareAtPrice: null,
    rating: 0,
    reviewCount: 0,
    colors: [{ name: "White", hex: "#f8f7f3" }],
    sizes: [],
    shortDescription: "Two-piece 500 GSM cotton ihram with a belt pouch.",
    descriptionBn: "৫০০ জিএসএম কটন দুই পিস ইহরাম, বেল্ট পাউচ সহ।",
    fabric: "100% cotton terry, 500 GSM",
    care: "Machine wash warm.",
    stock: 0,
    isFeatured: false,
    createdAt: "2026-10-16T10:00:00.000Z",
  },
  {
    id: "prod_12",
    slug: "classic-black-butterfly-abaya",
    sku: "RBT-AB-000",
    name: "Classic Butterfly Abaya (2025)",
    nameBn: "ক্লাসিক বাটারফ্লাই আবায়া",
    category: "abaya",
    type: "VARIABLE",
    status: "ARCHIVED",
    price: 2950,
    compareAtPrice: 3400,
    rating: 4.4,
    reviewCount: 88,
    colors: [{ name: "Black", hex: "#141414" }],
    sizes: ["54", "56"],
    shortDescription: "Last season's butterfly cut — archived after sell-through.",
    descriptionBn: "গত সিজনের বাটারফ্লাই কাট।",
    fabric: "Zoom crepe",
    care: "Hand wash cold.",
    stock: 2,
    isFeatured: false,
    createdAt: "2025-11-03T10:00:00.000Z",
  },
];

/** Only ACTIVE products are visible on the storefront. */
export const activeProducts = products.filter((p) => p.status === "ACTIVE");

export function getCategory(slug: string) {
  return categories.find((c) => c.slug === slug);
}

export function getProduct(slug: string) {
  return activeProducts.find((p) => p.slug === slug);
}

export function getProductsByCategory(slug: CategorySlug) {
  return activeProducts.filter((p) => p.category === slug);
}

export const trendingProducts = activeProducts.filter((p) => p.isFeatured);

export type MockVariant = {
  id: string;
  optionKey: string;
  sku: string;
  title: string;
  color: string | null;
  size: string | null;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  isActive: boolean;
};

/** Deterministic colour × size variants, splitting the product's stock across them. */
export function mockVariants(product: MockProduct): MockVariant[] {
  const colors = product.colors.length > 1 || product.sizes.length > 0 ? product.colors : [];
  const combos =
    product.type === "SIMPLE"
      ? [{ color: null, size: null }]
      : (colors.length ? colors : [null]).flatMap((c) =>
          (product.sizes.length ? product.sizes : [null]).map((s) => ({ color: c?.name ?? null, size: s })),
        );
  const weights = combos.map((_, i) => ((i * 7 + product.id.length * 3) % 5) + 1);
  const total = weights.reduce((a, b) => a + b, 0);
  let remaining = product.stock;
  return combos.map((combo, i) => {
    const stock = i === combos.length - 1 ? remaining : Math.floor((product.stock * weights[i]) / total);
    remaining -= stock;
    const parts = [combo.color, combo.size].filter(Boolean) as string[];
    const code = parts.map((p) => p.replace(/\s+/g, "").slice(0, 3).toUpperCase()).join("-");
    return {
      id: `${product.id}_v${i}`,
      optionKey: parts.join("|") || "default",
      sku: code ? `${product.sku}-${code}` : product.sku,
      title: parts.join(" / ") || "Default",
      color: combo.color,
      size: combo.size,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      stock,
      isActive: true,
    };
  });
}
