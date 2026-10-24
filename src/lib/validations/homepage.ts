import { z } from "zod";
import { frameEffects, frameShapes } from "@/lib/validations/frames";

/**
 * Homepage sections and footer content, stored as JSON settings ("home_sections",
 * "footer_settings"). Defaults reproduce the original hardcoded storefront exactly, so an
 * unsaved site looks unchanged.
 */

/** http(s) URL, /path, or embedded base64 image; "" = not set (falls back to built-in art). */
const image = z
  .string()
  .trim()
  .max(1_500_000, "Image is too large — max 1 MB")
  .refine(
    (v) => v === "" || /^(https?:\/\/|\/)\S+$/.test(v) || /^data:image\/[a-z+.-]+;base64,[A-Za-z0-9+/]+=*$/.test(v),
    "Use the Media Library, a full https:// URL or a /path",
  )
  .default("");
const link = z
  .string()
  .trim()
  .min(1, "Add a link")
  .max(300)
  .refine((v) => /^(\/|#|https?:\/\/)/.test(v), "Use a /path or a full https:// URL");
const optionalLink = z.union([z.literal(""), link]).default("");
const id = z
  .string()
  .min(1)
  .max(40)
  .default(() => Math.random().toString(36).slice(2, 10));
const short = (max: number) => z.string().trim().max(max).default("");

/** Section heading shared by most blocks: small gold eyebrow, title, Bengali subtitle. */
const heading = { eyebrow: short(80), title: short(120), titleBn: short(160) };

export const valuePropIcons = [
  "truck",
  "refresh",
  "gem",
  "banknote",
  "shield",
  "sparkles",
  "gift",
  "heart",
  "clock",
  "star",
  "leaf",
  "phone",
] as const;

const valuePropsSection = z.object({
  id,
  type: z.literal("valueProps"),
  enabled: z.boolean().default(true),
  items: z
    .array(
      z.object({
        id,
        icon: z.enum(valuePropIcons).default("gem"),
        /** Optional uploaded icon (SVG/PNG from the Media Library); replaces the built-in icon. */
        iconUrl: image,
        title: z.string().trim().min(1, "Add a title").max(60),
        body: short(120),
        bn: short(120),
        active: z.boolean().default(true),
      }),
    )
    .max(6),
});

const categoriesSection = z.object({
  id,
  type: z.literal("categories"),
  enabled: z.boolean().default(true),
  ...heading,
  linkLabel: short(40),
  linkUrl: optionalLink,
  /** "bento": one large + four tiles (max 5). "cards": uniform portrait cards (max 8). */
  layout: z.enum(["bento", "cards"]).default("bento"),
  /** Tiles in order. Empty = the first five (bento) or eight (cards) active categories. */
  items: z.array(z.object({ slug: z.string().trim().min(1, "Choose a category").max(80), imageUrl: image })).max(8),
});

const hexColor = z.string().regex(/^#[0-9a-f]{6}$/i, "Use a hex colour like #123e31");
/** Video file URL (no data: URIs — videos are too large to embed). */
const videoUrl = z
  .string()
  .trim()
  .max(2000)
  .refine((v) => v === "" || /^(https?:\/\/|\/)\S+$/.test(v), "Use a /path or a full https:// URL")
  .default("");

/** Promo shape names saved before the banner adopted the Hero Slider's shapes. */
const legacyPromoShapes: Record<string, (typeof frameShapes)[number]> = {
  mihrab: "islamic_arch",
  moroccan: "moroccan_arch",
  octagon: "diagonal_cut",
  star: "islamic_arch",
  rectangle: "rounded_card",
};

const promoSection = z.object({
  id,
  type: z.literal("promo"),
  enabled: z.boolean().default(true),
  eyebrow: short(80),
  /** Line breaks are kept. */
  title: z.string().trim().min(1, "Add a heading").max(160),
  titleBn: short(160),
  body: short(600),
  /** Text colour scheme, and the accent used for the badge, button, frame outline and pattern. */
  text: z.enum(["light", "dark"]).default("light"),
  accent: hexColor.default("#d8c08a"),
  ctaLabel: short(40),
  ctaUrl: optionalLink,
  ctaStyle: z.enum(["solid", "outline", "link"]).default("solid"),
  note: short(120),
  /** Defaults reproduce the original emerald banner with the gold pattern. */
  background: z
    .object({
      type: z.enum(["solid", "gradient", "image", "video"]).default("gradient"),
      color: hexColor.default("#1f3b33"),
      color2: hexColor.default("#0b1a16"),
      gradient: z.enum(["linear", "radial"]).default("linear"),
      /** Linear gradient angle in degrees. */
      angle: z.number().int().min(0).max(360).default(135),
      imageUrl: image,
      size: z.enum(["cover", "contain"]).default("cover"),
      position: z.enum(["center", "top", "bottom", "left", "right"]).default("center"),
      videoUrl,
      /** Poster shown while the video loads. */
      posterUrl: image,
      pattern: z.boolean().default(true),
      overlayColor: hexColor.default("#000000"),
      /** Overlay opacity over the whole background, 0–100 %. */
      overlay: z.number().int().min(0).max(100).default(0),
    })
    .prefault({}),
  /** Empty = the drawn garment inside the frame. */
  imageUrl: image,
  imageFit: z.enum(["cover", "contain"]).default("contain"),
  /** Which side of the banner the image column sits on. */
  imagePosition: z.enum(["right", "left"]).default("right"),
  frame: z
    .object({
      /** Same shapes and effects as the Hero Slider frame (HERO_SHAPES / HERO_EFFECTS). */
      shape: z.preprocess((v) => (typeof v === "string" && v in legacyPromoShapes ? legacyPromoShapes[v] : v), z.enum(frameShapes).default("islamic_arch")),
      effect: z.enum(frameEffects).default("light_sheen"),
      /** Horizontal placement of the frame inside its column. */
      align: z.enum(["start", "center", "end"]).default("center"),
      border: z.enum(["accent", "white", "none"]).default("accent"),
      shadow: z.enum(["none", "soft", "elevated", "glow"]).default("soft"),
    })
    .prefault({}),
});

/** "trending" = best sellers (recent orders) first, then the rest of the catalog. */
export const productSources = ["featured", "trending", "all", "category"] as const;
export const productDisplays = ["viewAll", "loadMore", "pagination", "none"] as const;

const productsSection = z.object({
  id,
  type: z.literal("products"),
  enabled: z.boolean().default(true),
  ...heading,
  source: z.enum(productSources).default("featured"),
  categorySlug: short(80),
  columns: z.union([z.literal(3), z.literal(4), z.literal(5), z.literal(6)]).default(4),
  /** Products shown at first (and per page / per "load more"). */
  limit: z.number().int().min(2).max(48).default(8),
  display: z.enum(productDisplays).default("viewAll"),
  viewAllLabel: short(40),
  viewAllUrl: optionalLink,
  /** Category filter tabs above the grid. */
  tabs: z.boolean().default(true),
});

const productCarouselSection = z.object({
  id,
  type: z.literal("productCarousel"),
  enabled: z.boolean().default(true),
  ...heading,
  source: z.enum(productSources).default("featured"),
  categorySlug: short(80),
  limit: z.number().int().min(3).max(24).default(10),
  /** Cards visible at once on desktop (phones show ~1.5, tablets ~2.5). */
  perView: z.number().int().min(2).max(6).default(4),
  autoplay: z.boolean().default(true),
  /** Seconds between autoplay steps. */
  interval: z.number().min(2).max(15).default(5),
  viewAllLabel: short(40),
  viewAllUrl: optionalLink,
});

const richTextSection = z.object({
  id,
  type: z.literal("richText"),
  enabled: z.boolean().default(true),
  eyebrow: short(80),
  title: short(160),
  /** Plain text; blank lines start new paragraphs. */
  body: short(2000),
  buttonLabel: short(40),
  buttonUrl: optionalLink,
  align: z.enum(["center", "left"]).default("center"),
  background: z.enum(["cream", "plain", "emerald"]).default("cream"),
});

const testimonialsSection = z.object({
  id,
  type: z.literal("testimonials"),
  enabled: z.boolean().default(true),
  ...heading,
  items: z
    .array(
      z.object({
        id,
        name: z.string().trim().min(1, "Add a name").max(80),
        city: short(80),
        rating: z.number().int().min(1).max(5).default(5),
        quote: z.string().trim().min(1, "Add the review text").max(600),
        product: short(120),
        verified: z.boolean().default(true),
        active: z.boolean().default(true),
      }),
    )
    .max(30),
});

const communitySection = z.object({
  id,
  type: z.literal("community"),
  enabled: z.boolean().default(true),
  handle: short(40),
  profileUrl: optionalLink,
  title: short(120),
  titleBn: short(160),
  /** Empty image = built-in illustrated tile. */
  items: z
    .array(z.object({ id, imageUrl: image, link: optionalLink, caption: short(80), likes: z.number().int().min(0).max(10_000_000).default(0) }))
    .max(12),
});

export const homeSection = z.discriminatedUnion("type", [
  valuePropsSection,
  categoriesSection,
  promoSection,
  productsSection,
  productCarouselSection,
  testimonialsSection,
  communitySection,
  richTextSection,
]);
export type HomeSection = z.infer<typeof homeSection>;
export type HomeSectionType = HomeSection["type"];
export type HomeSectionOf<T extends HomeSectionType> = Extract<HomeSection, { type: T }>;

/** HomeSection.type values stored in the database, per section type. */
export const homeSectionDbTypes = {
  valueProps: "TRUST_BADGES",
  categories: "CATEGORY_SHOWCASE",
  promo: "PROMO_BANNER",
  products: "PRODUCT_GRID",
  productCarousel: "PRODUCT_SLIDER",
  testimonials: "TESTIMONIALS",
  community: "COMMUNITY_GRID",
  richText: "RICH_TEXT",
} as const satisfies Record<HomeSectionType, string>;

/** Row shape for a section; `config` is everything except the columns stored separately. */
export function toHomeSectionRow(section: HomeSection, order: number) {
  const { id, type, enabled, ...config } = section;
  const title = "title" in config && config.title ? config.title.slice(0, 200) : null;
  return { id, type: homeSectionDbTypes[type], title, order, isEnabled: enabled, config };
}

export const sectionTypeFromDb = (dbType: string): HomeSectionType | undefined =>
  (Object.keys(homeSectionDbTypes) as HomeSectionType[]).find((t) => homeSectionDbTypes[t] === dbType);

/** Fresh widget with sensible defaults, for the builder's "Add section" drawer. */
export function newHomeSection(type: HomeSectionType): HomeSection {
  const sectionId = Math.random().toString(36).slice(2, 10);
  switch (type) {
    case "valueProps":
      return homeSection.parse({ ...defaultHomeSections()[0], id: sectionId });
    case "categories":
      return homeSection.parse({ ...defaultHomeSections()[1], id: sectionId });
    case "promo":
      return homeSection.parse({ ...defaultHomeSections()[2], id: sectionId });
    case "products":
      return { ...newProductsSection({ eyebrow: "Collection", title: "New product grid", tabs: false }), id: sectionId };
    case "productCarousel":
      return homeSection.parse({
        id: sectionId,
        type,
        eyebrow: "New In",
        title: "Fresh from the atelier",
        titleBn: "নতুন সংগ্রহ",
        source: "all",
        viewAllLabel: "View all",
        viewAllUrl: "/products",
      });
    case "testimonials":
      return homeSection.parse({ id: sectionId, type, eyebrow: "Customer Love", title: "What our customers say", titleBn: "আমাদের গ্রাহকদের কথা", items: [] });
    case "community":
      return homeSection.parse({ ...defaultHomeSections()[5], id: sectionId });
    case "richText":
      return homeSection.parse({
        id: sectionId,
        type,
        eyebrow: "Our story",
        title: "Modesty, crafted with intention",
        body: "Every Ribat piece is designed and finished in Dhaka.",
        buttonLabel: "Shop the collection",
        buttonUrl: "/products",
      });
  }
}

// --- Defaults: the original hardcoded homepage --------------------------------------

const testimonialDefaults = [
  {
    name: "Tanvir Ahmed",
    city: "Dhaka",
    rating: 5,
    quote:
      "The embroidery on the Noor panjabi is even finer in person. Fit is true to size and the cotton stays cool through Jumu'ah.",
    product: "Noor Embroidered Cotton Panjabi",
  },
  {
    name: "নুসরাত জাহান",
    city: "চট্টগ্রাম",
    rating: 5,
    quote: "আবায়ার ফেব্রিক অসাধারণ, একদম ছবির মতো। ডেলিভারি দুই দিনেই পেয়েছি, ক্যাশ অন ডেলিভারি থাকায় নিশ্চিন্তে অর্ডার করেছি।",
    product: "Safa Nida Open Abaya",
  },
  {
    name: "Imran Hossain",
    city: "Sylhet",
    rating: 5,
    quote: "Royal Oud lasts the whole day — I get compliments at the masjid every week. Packaging feels like a gift.",
    product: "Royal Oud Attar",
  },
  {
    name: "Farhana Rahman",
    city: "Rajshahi",
    rating: 4,
    quote:
      "Exchanged a size within 7 days without any hassle. The Layla abaya pleats are beautiful and hold their shape after washing.",
    product: "Layla Pleated Crepe Abaya",
  },
  {
    name: "মাহমুদুল হাসান",
    city: "খুলনা",
    rating: 5,
    quote: "এমিরাতি জুব্বাটা কুঁচকায় না, অফিস থেকে মসজিদ সারাদিন পরে থাকা যায়। দামের তুলনায় কোয়ালিটি অনেক ভালো।",
    product: "Emirati Classic Thobe",
  },
].map((t, i) => ({ ...t, id: `t${i + 1}` }));

const communityDefaults = [
  ["Jumu'ah in ivory", 2410],
  ["Nida, in motion", 3870],
  ["Oud & amber", 1932],
  ["Raw silk details", 2766],
  ["Emerald evenings", 3104],
  ["Linen weekends", 1588],
] as const;

/** A product grid with the original "Trending Now" defaults. */
export const newProductsSection = (overrides: Partial<z.input<typeof productsSection>> = {}) =>
  productsSection.parse({
    eyebrow: "Trending Now",
    title: "This week's most loved",
    titleBn: "এই সপ্তাহের জনপ্রিয় পণ্য",
    viewAllLabel: "View all",
    viewAllUrl: "/products",
    ...overrides,
    type: "products",
  });

export const defaultHomeSections = (): HomeSection[] =>
  [
    {
      id: "value-props",
      type: "valueProps",
      items: [
        { id: "v1", icon: "truck", title: "Free Delivery", body: "On orders over ৳3,000, nationwide", bn: "সারা দেশে ফ্রি ডেলিভারি" },
        { id: "v2", icon: "refresh", title: "7 Days Exchange", body: "Easy size & colour exchange, no questions", bn: "৭ দিনের সহজ এক্সচেঞ্জ" },
        { id: "v3", icon: "gem", title: "Premium Quality", body: "Hand-finished fabrics, quality checked twice", bn: "প্রিমিয়াম কোয়ালিটি নিশ্চিত" },
        { id: "v4", icon: "banknote", title: "Cash on Delivery", body: "Pay at your door — or bKash / Nagad", bn: "ক্যাশ অন ডেলিভারি" },
      ],
    },
    {
      id: "categories",
      type: "categories",
      eyebrow: "Shop by Category",
      title: "Curated for every occasion",
      titleBn: "আপনার পছন্দের ক্যাটাগরি",
      linkLabel: "Shop all",
      linkUrl: "/products",
      items: [],
    },
    {
      id: "promo",
      type: "promo",
      eyebrow: "Atelier · Made in Dhaka",
      title: "The Raw Silk\nCollection",
      titleBn: "রাজশাহীর সিল্ক, ঢাকার কারিগরের হাতে।",
      body: "Woven in Rajshahi, cut and finished by hand in our Dhaka atelier. Mother-of-pearl buttons, French seams, and a fit made for long nights of Taraweeh and mornings of Eid.",
      ctaLabel: "Discover the collection",
      ctaUrl: "/products",
      note: "From ৳4,850 · Limited run of 200",
    },
    { ...newProductsSection(), id: "trending" },
    {
      id: "testimonials",
      type: "testimonials",
      eyebrow: "Customer Love",
      title: "4.8 ★ from 12,000+ orders",
      titleBn: "আমাদের গ্রাহকদের কথা",
      items: testimonialDefaults,
    },
    {
      id: "community",
      type: "community",
      handle: "@ribat.bd",
      profileUrl: "https://instagram.com/ribat.bd",
      title: "Worn by our community",
      titleBn: "ইনস্টাগ্রামে আমাদের সাথে থাকুন",
      items: communityDefaults.map(([caption, likes], i) => ({ id: `ig${i + 1}`, caption, likes })),
    },
  ].map((s) => homeSection.parse(s));

export const homeSectionsSetting = z.object({
  sections: z.array(homeSection).max(20).default(defaultHomeSections),
});

// --- Footer ----------------------------------------------------------------------------

export const socialPlatforms = ["instagram", "facebook", "youtube", "tiktok", "whatsapp"] as const;

export const footerSetting = z.object({
  about: z.string().trim().max(400).default("Premium Islamic lifestyle clothing, designed and finished in Dhaka. Modesty, crafted with intention."),
  aboutBn: z.string().trim().max(200).default("সারা বাংলাদেশে ক্যাশ অন ডেলিভারি"),
  columns: z
    .array(
      z.object({
        id,
        title: z.string().trim().min(1, "Add a column title").max(40),
        links: z.array(z.object({ title: z.string().trim().min(1, "Add a title").max(60), url: link })).max(10),
      }),
    )
    .max(4)
    .default(() => [
      {
        id: "shop",
        title: "Shop",
        links: [
          { title: "New Arrivals", url: "/products" },
          { title: "Panjabi", url: "/categories/panjabi" },
          { title: "Thobe", url: "/categories/thobe" },
          { title: "Abaya", url: "/categories/abaya" },
          { title: "Casual", url: "/categories/casual" },
          { title: "Fragrance", url: "/categories/fragrance" },
        ],
      },
      {
        id: "help",
        title: "Help",
        links: [
          { title: "Track Order", url: "/account" },
          { title: "Size Guide", url: "/products" },
          { title: "Exchange Policy", url: "/products" },
          { title: "Contact Us", url: "/products" },
        ],
      },
    ]),
  newsletter: z
    .object({
      enabled: z.boolean().default(true),
      title: z.string().trim().max(60).default("Join the Ribat circle"),
      body: z.string().trim().max(200).default("Early access to Eid drops and members-only offers."),
      buttonLabel: z.string().trim().max(30).default("Subscribe"),
    })
    .prefault({}),
  social: z
    .array(z.object({ platform: z.enum(socialPlatforms), label: short(60), url: link }))
    .max(6)
    .default(() => [{ platform: "instagram" as const, label: "@ribat.bd", url: "https://instagram.com/ribat.bd" }]),
  /** Empty = "© <store name>. All rights reserved." */
  copyright: short(160),
  payments: z.array(z.string().trim().min(1).max(20)).max(10).default(() => ["COD", "bKash", "Nagad", "VISA", "Mastercard"]),
});
export type FooterSettings = z.infer<typeof footerSetting>;
