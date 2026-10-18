/**
 * Demo orders & landing pages for `npm run db:seed:demo` (opt-in, removable with
 * `npm run db:seed:demo -- --remove`). Not imported by the app.
 */
import type {
  LandingPageStatus,
  OrderSource,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "../../src/generated/prisma/enums";

export type MockOrderItem = {
  productId: string;
  name: string;
  variant: string;
  sku: string;
  quantity: number;
  unitPrice: number;
};

export type MockOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  district: string;
  area: string;
  addressLine: string;
  customerNote?: string;
  items: MockOrderItem[];
  subtotal: number;
  shippingFee: number;
  discountTotal: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  source: OrderSource;
  landingPage?: string;
  courierName?: "Steadfast" | "Pathao";
  trackingCode?: string;
  createdAt: string;
};

type OrderSeed = Omit<MockOrder, "subtotal" | "total" | "id"> & { id?: string };

function order(seed: OrderSeed): MockOrder {
  const subtotal = seed.items.reduce((n, i) => n + i.unitPrice * i.quantity, 0);
  return {
    ...seed,
    id: seed.id ?? seed.orderNumber.toLowerCase(),
    subtotal,
    total: subtotal + seed.shippingFee - seed.discountTotal,
  };
}

const item = (productId: string, name: string, variant: string, sku: string, unitPrice: number, quantity = 1) => ({
  productId,
  name,
  variant,
  sku,
  unitPrice,
  quantity,
});

export const orders: MockOrder[] = [
  order({
    orderNumber: "DEMO-100248",
    customerName: "Tanvir Ahmed",
    customerPhone: "01712345678",
    district: "Dhaka",
    area: "Dhanmondi",
    addressLine: "House 14, Road 7/A",
    items: [
      item("prod_01", "Noor Embroidered Cotton Panjabi", "Ivory / L", "RBT-PJ-001-IVO-L", 2450),
      item("prod_09", "Royal Oud Attar — 12ml", "Default", "RBT-FR-001", 1450),
    ],
    shippingFee: 0,
    discountTotal: 0,
    status: "PENDING",
    paymentStatus: "UNPAID",
    paymentMethod: "COD",
    source: "STOREFRONT",
    createdAt: "2026-10-18T09:42:00.000Z",
  }),
  order({
    orderNumber: "DEMO-100247",
    customerName: "নুসরাত জাহান",
    customerPhone: "01819876543",
    district: "Chattogram",
    area: "Khulshi",
    addressLine: "Flat 5B, Lake View Tower, Road 2",
    customerNote: "Please call before delivery",
    items: [item("prod_03", "Safa Nida Open Abaya", "Onyx / 54", "RBT-AB-001-ONY-54", 3650)],
    shippingFee: 130,
    discountTotal: 0,
    status: "PENDING",
    paymentStatus: "UNPAID",
    paymentMethod: "COD",
    source: "LANDING_PAGE",
    landingPage: "Safa Abaya — Eid Combo",
    createdAt: "2026-10-18T08:15:00.000Z",
  }),
  order({
    orderNumber: "DEMO-100246",
    customerName: "Imran Hossain",
    customerPhone: "01556123987",
    district: "Sylhet",
    area: "Zindabazar",
    addressLine: "32 Chowhatta Road",
    items: [item("prod_09", "Royal Oud Attar — 12ml", "Default", "RBT-FR-001", 1250, 3)],
    shippingFee: 0,
    discountTotal: 0,
    status: "PROCESSING",
    paymentStatus: "PAID",
    paymentMethod: "BKASH",
    source: "LANDING_PAGE",
    landingPage: "Royal Oud — 3 for ৳3,750",
    createdAt: "2026-10-17T19:03:00.000Z",
  }),
  order({
    orderNumber: "DEMO-100245",
    customerName: "Farhana Rahman",
    customerPhone: "01911223344",
    district: "Rajshahi",
    area: "Shaheb Bazar",
    addressLine: "Green Plaza, 3rd floor",
    items: [
      item("prod_04", "Layla Pleated Crepe Abaya", "Navy / 52", "RBT-AB-002-NAV-52", 4200),
      item("prod_10", "White Musk Tahara — 6ml", "Default", "RBT-FR-002", 650),
    ],
    shippingFee: 0,
    discountTotal: 485,
    status: "PROCESSING",
    paymentStatus: "UNPAID",
    paymentMethod: "COD",
    source: "STOREFRONT",
    createdAt: "2026-10-17T14:27:00.000Z",
  }),
  order({
    orderNumber: "DEMO-100244",
    customerName: "Mahmudul Hasan",
    customerPhone: "01677889900",
    district: "Khulna",
    area: "Sonadanga",
    addressLine: "12/1 KDA Avenue",
    items: [item("prod_05", "Emirati Classic Thobe", "Pure White / 56", "RBT-TH-001-PUR-56", 3450, 2)],
    shippingFee: 0,
    discountTotal: 0,
    status: "SHIPPED",
    paymentStatus: "UNPAID",
    paymentMethod: "COD",
    source: "STOREFRONT",
    courierName: "Steadfast",
    trackingCode: "SF-88214573",
    createdAt: "2026-10-16T11:50:00.000Z",
  }),
  order({
    orderNumber: "DEMO-100243",
    customerName: "Sadia Islam",
    customerPhone: "01722334455",
    district: "Dhaka",
    area: "Uttara Sector 7",
    addressLine: "House 22, Road 18",
    items: [item("prod_03", "Safa Nida Open Abaya", "Mocha / 56", "RBT-AB-001-MOC-56", 3650)],
    shippingFee: 70,
    discountTotal: 0,
    status: "SHIPPED",
    paymentStatus: "PAID",
    paymentMethod: "NAGAD",
    source: "LANDING_PAGE",
    landingPage: "Safa Abaya — Eid Combo",
    courierName: "Pathao",
    trackingCode: "PTH-DX5521",
    createdAt: "2026-10-16T09:12:00.000Z",
  }),
  order({
    orderNumber: "DEMO-100242",
    customerName: "Rakib Chowdhury",
    customerPhone: "01811002200",
    district: "Cumilla",
    area: "Kandirpar",
    addressLine: "Bishwa Road, near Town Hall",
    items: [
      item("prod_07", "Medina Linen Short Kurta", "Oat / M", "RBT-CS-001-OAT-M", 1650),
      item("prod_08", "Sunnah Piqué Polo", "Forest / L", "RBT-CS-002-FOR-L", 1250),
    ],
    shippingFee: 130,
    discountTotal: 0,
    status: "DELIVERED",
    paymentStatus: "PAID",
    paymentMethod: "COD",
    source: "STOREFRONT",
    courierName: "Steadfast",
    trackingCode: "SF-88199012",
    createdAt: "2026-10-14T16:40:00.000Z",
  }),
  order({
    orderNumber: "DEMO-100241",
    customerName: "Ayesha Siddiqua",
    customerPhone: "01988776655",
    district: "Dhaka",
    area: "Mirpur 10",
    addressLine: "Block C, Road 3, House 9",
    items: [item("prod_02", "Zayn Raw Silk Panjabi", "Champagne / XL", "RBT-PJ-002-CHA-XL", 4850)],
    shippingFee: 0,
    discountTotal: 0,
    status: "DELIVERED",
    paymentStatus: "PAID",
    paymentMethod: "SSLCOMMERZ",
    source: "STOREFRONT",
    courierName: "Pathao",
    trackingCode: "PTH-DW9930",
    createdAt: "2026-10-13T12:05:00.000Z",
  }),
  order({
    orderNumber: "DEMO-100240",
    customerName: "শফিকুল ইসলাম",
    customerPhone: "01533445566",
    district: "Bogura",
    area: "Satmatha",
    addressLine: "Jaleshwaritola, House 41",
    items: [item("prod_01", "Noor Embroidered Cotton Panjabi", "Emerald / XL", "RBT-PJ-001-EME-XL", 2290, 2)],
    shippingFee: 0,
    discountTotal: 0,
    status: "DELIVERED",
    paymentStatus: "PAID",
    paymentMethod: "COD",
    source: "LANDING_PAGE",
    landingPage: "Noor Panjabi — Jumu'ah Deal",
    courierName: "Steadfast",
    trackingCode: "SF-88170444",
    createdAt: "2026-10-12T08:31:00.000Z",
  }),
  order({
    orderNumber: "DEMO-100239",
    customerName: "Nabila Karim",
    customerPhone: "01799887766",
    district: "Gazipur",
    area: "Tongi",
    addressLine: "Station Road, Hazi Market",
    items: [item("prod_06", "Moroccan Hooded Jubba", "Sand / L", "RBT-TH-002-SAN-L", 3990)],
    shippingFee: 130,
    discountTotal: 0,
    status: "CANCELLED",
    paymentStatus: "UNPAID",
    paymentMethod: "COD",
    source: "STOREFRONT",
    customerNote: "Customer unreachable after 3 calls",
    createdAt: "2026-10-11T18:22:00.000Z",
  }),
  order({
    orderNumber: "DEMO-100238",
    customerName: "Arif Mahmud",
    customerPhone: "01611223399",
    district: "Narayanganj",
    area: "Chashara",
    addressLine: "BB Road, House 7",
    items: [item("prod_05", "Emirati Classic Thobe", "Stone / 54", "RBT-TH-001-STO-54", 3450)],
    shippingFee: 70,
    discountTotal: 0,
    status: "RETURNED",
    paymentStatus: "REFUNDED",
    paymentMethod: "BKASH",
    source: "STOREFRONT",
    courierName: "Pathao",
    trackingCode: "PTH-DV1187",
    createdAt: "2026-10-09T10:10:00.000Z",
  }),
  order({
    orderNumber: "DEMO-100237",
    customerName: "Tasnim Ferdous",
    customerPhone: "01844556677",
    district: "Dhaka",
    area: "Bashundhara R/A",
    addressLine: "Block D, Road 5, House 210",
    items: [
      item("prod_03", "Safa Nida Open Abaya", "Sage / 54", "RBT-AB-001-SAG-54", 3650),
      item("prod_04", "Layla Pleated Crepe Abaya", "Dusty Rose / 54", "RBT-AB-002-DUS-54", 4200),
    ],
    shippingFee: 0,
    discountTotal: 785,
    status: "DELIVERED",
    paymentStatus: "PAID",
    paymentMethod: "COD",
    source: "STOREFRONT",
    courierName: "Steadfast",
    trackingCode: "SF-88102231",
    createdAt: "2026-10-08T15:48:00.000Z",
  }),
];

export type MockLandingOffer = { label: string; quantity: number; price: number; compareAtPrice: number | null; badge?: string };

export type MockLandingPage = {
  id: string;
  title: string;
  slug: string;
  status: LandingPageStatus;
  productId: string;
  productName: string;
  template: "bengali-longform" | "minimal" | "video-first";
  offers: MockLandingOffer[];
  viewCount: number;
  conversionCount: number;
  revenue: number;
  facebookPixel: boolean;
  updatedAt: string;
};

export const landingPages: MockLandingPage[] = [
  {
    id: "lp_01",
    title: "Royal Oud — 3 for ৳3,750",
    slug: "royal-oud-offer",
    status: "PUBLISHED",
    productId: "prod_09",
    productName: "Royal Oud Attar — 12ml",
    template: "bengali-longform",
    offers: [
      { label: "১টি আতর", quantity: 1, price: 1450, compareAtPrice: 1800 },
      { label: "২টি আতর", quantity: 2, price: 2650, compareAtPrice: 3600, badge: "Popular" },
      { label: "৩টি আতর + ফ্রি ডেলিভারি", quantity: 3, price: 3750, compareAtPrice: 5400, badge: "Best Value" },
    ],
    viewCount: 18420,
    conversionCount: 612,
    revenue: 1_486_300,
    facebookPixel: true,
    updatedAt: "2026-10-15T10:00:00.000Z",
  },
  {
    id: "lp_02",
    title: "Safa Abaya — Eid Combo",
    slug: "safa-abaya-eid",
    status: "PUBLISHED",
    productId: "prod_03",
    productName: "Safa Nida Open Abaya",
    template: "bengali-longform",
    offers: [
      { label: "১টি আবায়া + হিজাব", quantity: 1, price: 3650, compareAtPrice: 4500 },
      { label: "২টি আবায়া কম্বো", quantity: 2, price: 6800, compareAtPrice: 9000, badge: "Save ৳2,200" },
    ],
    viewCount: 9730,
    conversionCount: 284,
    revenue: 1_102_400,
    facebookPixel: true,
    updatedAt: "2026-10-14T10:00:00.000Z",
  },
  {
    id: "lp_03",
    title: "Noor Panjabi — Jumu'ah Deal",
    slug: "noor-panjabi-jumuah",
    status: "PUBLISHED",
    productId: "prod_01",
    productName: "Noor Embroidered Cotton Panjabi",
    template: "minimal",
    offers: [
      { label: "1 Panjabi", quantity: 1, price: 2450, compareAtPrice: 3200 },
      { label: "2 Panjabi", quantity: 2, price: 4580, compareAtPrice: 6400, badge: "Popular" },
    ],
    viewCount: 6215,
    conversionCount: 141,
    revenue: 361_900,
    facebookPixel: false,
    updatedAt: "2026-10-10T10:00:00.000Z",
  },
  {
    id: "lp_04",
    title: "Emirati Thobe — Pre-order",
    slug: "emirati-thobe-preorder",
    status: "DRAFT",
    productId: "prod_05",
    productName: "Emirati Classic Thobe",
    template: "video-first",
    offers: [{ label: "1 Thobe", quantity: 1, price: 3450, compareAtPrice: 3950 }],
    viewCount: 0,
    conversionCount: 0,
    revenue: 0,
    facebookPixel: false,
    updatedAt: "2026-10-17T10:00:00.000Z",
  },
  {
    id: "lp_05",
    title: "Ramadan Attar Bundle",
    slug: "ramadan-attar-bundle",
    status: "ARCHIVED",
    productId: "prod_10",
    productName: "White Musk Tahara — 6ml",
    template: "bengali-longform",
    offers: [{ label: "৩টি তাহারা মাস্ক", quantity: 3, price: 1650, compareAtPrice: 1950 }],
    viewCount: 22104,
    conversionCount: 905,
    revenue: 1_493_250,
    facebookPixel: true,
    updatedAt: "2026-04-02T10:00:00.000Z",
  },
];
