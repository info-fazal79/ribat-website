import { z } from "zod";

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
  /** Up to five tiles (bento layout), in order. Empty = the first five active categories. */
  items: z.array(z.object({ slug: z.string().trim().min(1, "Choose a category").max(80), imageUrl: image })).max(5),
});

const promoSection = z.object({
  id,
  type: z.literal("promo"),
  enabled: z.boolean().default(true),
  eyebrow: short(80),
  /** Line breaks are kept. */
  title: z.string().trim().min(1, "Add a heading").max(160),
  titleBn: short(160),
  body: short(600),
  ctaLabel: short(40),
  ctaUrl: optionalLink,
  note: short(120),
  /** Empty = the drawn garment inside the arch. */
  imageUrl: image,
  imageFit: z.enum(["cover", "contain"]).default("contain"),
});

export const productSources = ["featured", "all", "category"] as const;
export const productDisplays = ["viewAll", "loadMore", "pagination", "none"] as const;

const productsSection = z.object({
  id,
  type: z.literal("products"),
  enabled: z.boolean().default(true),
  ...heading,
  source: z.enum(productSources).default("featured"),
  categorySlug: short(80),
  columns: z.union([z.literal(4), z.literal(5), z.literal(6)]).default(4),
  /** Products shown at first (and per page / per "load more"). */
  limit: z.number().int().min(2).max(48).default(8),
  display: z.enum(productDisplays).default("viewAll"),
  viewAllLabel: short(40),
  viewAllUrl: optionalLink,
  /** Category filter tabs above the grid. */
  tabs: z.boolean().default(true),
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
  testimonialsSection,
  communitySection,
]);
export type HomeSection = z.infer<typeof homeSection>;
export type HomeSectionType = HomeSection["type"];
export type HomeSectionOf<T extends HomeSectionType> = Extract<HomeSection, { type: T }>;

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
