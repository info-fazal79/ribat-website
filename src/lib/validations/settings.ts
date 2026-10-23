import { z } from "zod";

const hexColor = z.string().regex(/^#[0-9a-f]{6}$/i, "Use a hex colour like #123e31");

/**
 * Absolute http(s) URL, site-relative path, or an embedded base64 image (upload fallback
 * when Supabase Storage isn't configured); empty string means "not set".
 */
const assetUrl = z
  .string()
  .trim()
  .max(1_500_000, "Image is too large — max 1 MB")
  .refine(
    (v) =>
      v === "" ||
      /^(https?:\/\/|\/)\S+$/.test(v) ||
      /^data:image\/(png|jpeg|webp|svg\+xml|x-icon);base64,[A-Za-z0-9+/]+=*$/.test(v),
    "Enter a full https:// URL or a /path",
  )
  .default("");

const menuUrl = z
  .string()
  .trim()
  .min(1, "Add a link")
  .max(300)
  .refine((v) => /^(\/|#|https?:\/\/)/.test(v), "Use a /path or a full https:// URL");

const menuLink = z.object({
  title: z.string().trim().min(1, "Add a title").max(60),
  url: menuUrl,
});

const menuItem = z.object({
  // Stable key for the admin builder (reorder / expand state); generated for older rows.
  id: z.string().min(1).max(40).default(() => Math.random().toString(36).slice(2, 10)),
  title: z.string().trim().min(1, "Add a title").max(40),
  url: menuUrl,
  // Plain dropdown when megaMenu is off; ignored when it's on.
  links: z.array(menuLink).max(20).default([]),
  megaMenu: z.boolean().default(false),
  // Number of link columns in the mega panel (the promo card sits beside them).
  gridColumns: z.union([z.literal(2), z.literal(3), z.literal(4)]).default(3),
  panelTheme: z.enum(["light", "cream", "emerald"]).default("light"),
  columns: z
    .array(z.object({ title: z.string().trim().max(60).default(""), links: z.array(menuLink).max(12).default([]) }))
    .max(4)
    .default([]),
  promo: z
    .object({
      enabled: z.boolean().default(false),
      imageUrl: assetUrl,
      badge: z.string().trim().max(40).default(""),
      title: z.string().trim().max(80).default(""),
      buttonText: z.string().trim().max(30).default("Shop now"),
      buttonUrl: z.union([z.literal(""), menuUrl]).default(""),
    })
    .prefault({}),
});

export type MenuItem = z.infer<typeof menuItem>;

const defaultMenu = [
  ["New Arrivals", "/products"],
  ["Panjabi", "/categories/panjabi"],
  ["Thobe", "/categories/thobe"],
  ["Abaya", "/categories/abaya"],
  ["Casual", "/categories/casual"],
  ["Fragrance", "/categories/fragrance"],
].map(([title, url]) => menuItem.parse({ title, url }));

// --- Hero slider ---------------------------------------------------------------

const optionalUrl = z
  .string()
  .trim()
  .max(2000)
  .refine((v) => v === "" || /^(https?:\/\/|\/)\S+$/.test(v), "Use a /path or a full https:// URL")
  .default("");

const heroSlide = z.object({
  id: z.string().min(1).max(40).default(() => Math.random().toString(36).slice(2, 10)),
  active: z.boolean().default(true),
  // "product": headline, price, photo and button link come from a linked product at render time;
  // the stored text/visual fields are a snapshot used for overrides and if the product goes away.
  mode: z.enum(["custom", "product"]).default("custom"),
  product: z
    .object({
      id: z.string().max(40).default(""),
      overrideTitle: z.boolean().default(false),
      overrideBadge: z.boolean().default(false),
    })
    .prefault({}),
  background: z
    .object({
      type: z.enum(["solid", "gradient", "image", "video"]).default("gradient"),
      color: hexColor.default("#1f3b33"),
      color2: hexColor.default("#0b1a16"),
      direction: z.enum(["radial", "to bottom", "to right", "to bottom right", "to top right"]).default("radial"),
      imageUrl: optionalUrl,
      videoUrl: optionalUrl,
      // Darkening layer over image/video backgrounds, 0–90 %.
      overlay: z.number().int().min(0).max(90).default(40),
      pattern: z.boolean().default(true),
    })
    .prefault({}),
  // Text colour scheme and accent (badge, arch outline, illustration ink).
  text: z.enum(["light", "dark"]).default("light"),
  accent: hexColor.default("#d8c08a"),
  eyebrow: z.string().trim().max(80).default(""),
  title: z.string().trim().min(1, "Add a headline").max(120),
  titleBn: z.string().trim().max(160).default(""),
  body: z.string().trim().max(400).default(""),
  primary: z.object({ label: z.string().trim().min(1, "Add a button label").max(40), url: menuUrl }),
  secondary: z
    .object({
      enabled: z.boolean().default(true),
      label: z.string().trim().max(40).default(""),
      url: z.union([z.literal(""), menuUrl]).default(""),
    })
    .prefault({}),
  visual: z
    .object({
      type: z.enum(["illustration", "image", "none"]).default("illustration"),
      art: z.enum(["panjabi", "abaya", "thobe", "casual", "fragrance"]).default("panjabi"),
      imageUrl: optionalUrl,
      fit: z.enum(["cover", "contain"]).default("cover"),
      // Frame around the visual (see HERO_SHAPES) and its looping effect (see HERO_EFFECTS).
      shape: z
        .enum(["islamic_arch", "moroccan_arch", "squircle", "pill", "rounded_card", "diagonal_cut", "natural"])
        .default("islamic_arch"),
      effect: z.enum(["none", "light_sheen", "ambient_glow", "subtle_float", "cinematic_zoom"]).default("none"),
    })
    .prefault({}),
});

export type HeroSlideSetting = z.infer<typeof heroSlide>;

export const newHeroSlide = (): HeroSlideSetting =>
  heroSlide.parse({
    title: "New slide headline",
    primary: { label: "Shop now", url: "/products" },
    secondary: { enabled: false },
    visual: { type: "image" },
  });

/** The original storefront slides — used until an admin saves their own. */
const defaultHeroSlides = (
  [
    {
      id: "eid",
      visual: { art: "panjabi" },
      eyebrow: "The Eid Edit · 2026",
      title: "Quiet luxury for sacred moments.",
      titleBn: "পবিত্র মুহূর্তের জন্য নিঃশব্দ আভিজাত্য",
      body: "Raw silk panjabis and hand-embroidered cottons, finished in Dhaka by master tailors.",
      primary: { label: "Shop Panjabi", url: "/categories/panjabi" },
      secondary: { label: "Explore the Edit", url: "/products" },
      background: { color: "#1f3b33", color2: "#0b1a16" },
      accent: "#d8c08a",
      text: "light",
    },
    {
      id: "abaya",
      visual: { art: "abaya" },
      eyebrow: "New Season · Abaya",
      title: "Drape that moves with grace.",
      titleBn: "শালীনতায় সৌন্দর্য",
      body: "Dubai Nida and Korean crepe abayas — fluid, breathable, made to be lived in.",
      primary: { label: "Shop Abaya", url: "/categories/abaya" },
      secondary: { label: "New Arrivals", url: "/products" },
      background: { color: "#2b2420", color2: "#120f0d" },
      accent: "#cbb38a",
      text: "light",
    },
    {
      id: "thobe",
      visual: { art: "thobe" },
      eyebrow: "Essentials · Thobe",
      title: "The thobe, refined.",
      titleBn: "জুব্বা — নতুন রূপে",
      body: "Emirati and Moroccan cuts in wrinkle-resistant Japanese fabric. Free delivery over ৳3,000.",
      primary: { label: "Shop Thobe", url: "/categories/thobe" },
      secondary: { label: "Size Guide", url: "/products" },
      background: { color: "#ece4d4", color2: "#d4c6ab" },
      accent: "#7a6440",
      text: "dark",
    },
  ] as const
).map((s) => heroSlide.parse(s));

export const defaultAnnouncements = [
  "সারা বাংলাদেশে ক্যাশ অন ডেলিভারি",
  "৭ দিনে সহজ এক্সচেঞ্জ সুবিধা",
  "৳৩,০০০ টাকার অর্ডারে ফ্রি ডেলিভারি",
];

/**
 * Typed schemas for the `Setting` key/value table.
 * Always read/write settings through these so the JSON stays valid.
 */
export const settingSchemas = {
  "store.general": z.object({
    storeName: z.string().default("Ribat"),
    supportPhone: z.string().optional(),
    supportEmail: z.email().optional(),
    address: z.string().optional(),
    logoUrl: z.url().optional(),
  }),
  "appearance.branding": z.object({
    logoType: z.enum(["text", "image"]).default("text"),
    logoUrl: assetUrl,
    logoWidth: z.number().int().min(40).max(400).default(140),
    logoHeight: z.number().int().min(20).max(160).default(48),
    faviconUrl: assetUrl,
  }),
  "appearance.announcement": z.object({
    enabled: z.boolean().default(true),
    messages: z
      .array(
        z.object({
          text: z.string().trim().min(1, "Message can't be empty").max(160),
          active: z.boolean().default(true),
        }),
      )
      .max(20)
      .default(defaultAnnouncements.map((text) => ({ text, active: true }))),
    backgroundColor: hexColor.default("#123e31"),
    textColor: hexColor.default("#d4af37"),
    mode: z.enum(["marquee", "static"]).default("marquee"),
    // Seconds for one full loop of the ticker — lower is faster.
    speed: z.number().int().min(5).max(120).default(40),
  }),
  hero_slides: z.object({
    autoplay: z.boolean().default(true),
    interval: z.number().min(2).max(30).default(6.5), // seconds per slide
    pauseOnHover: z.boolean().default(true),
    slides: z.array(heroSlide).max(10).default(defaultHeroSlides),
  }),
  header_menu: z.object({
    items: z.array(menuItem).max(12).default(defaultMenu),
  }),
  "store.currency": z.object({
    code: z.literal("BDT").default("BDT"),
    symbol: z.string().default("৳"),
  }),
  "store.social": z.object({
    facebook: z.url().optional(),
    instagram: z.url().optional(),
    youtube: z.url().optional(),
    tiktok: z.url().optional(),
    whatsapp: z.string().optional(),
  }),
  "checkout.config": z.object({
    codEnabled: z.boolean().default(true),
    onlinePaymentEnabled: z.boolean().default(false),
    requireEmail: z.boolean().default(false),
    minOrderAmount: z.number().nonnegative().default(0),
    // Basic fraud guard: block repeat orders from one phone in a window.
    maxOrdersPerPhonePerDay: z.number().int().positive().default(5),
  }),
  "payments.bkash": z.object({
    enabled: z.boolean().default(false),
    mode: z.enum(["sandbox", "live"]).default("sandbox"),
  }),
  "seo.defaults": z.object({
    titleTemplate: z.string().default("%s | Ribat"),
    defaultTitle: z.string().default("Ribat — Islamic Lifestyle & Premium Clothing"),
    description: z.string().optional(),
    ogImageUrl: z.url().optional(),
  }),
} as const;

export type SettingKey = keyof typeof settingSchemas;
export type SettingValue<K extends SettingKey> = z.infer<(typeof settingSchemas)[K]>;
