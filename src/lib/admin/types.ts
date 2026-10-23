/** Serializable admin shapes returned by src/server/services/admin.ts. */
import type {
  LandingPageStatus,
  OrderSource,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ProductStatus,
  ProductType,
} from "@/generated/prisma/enums";
import type { ArtKind, ProductColor } from "@/lib/catalog/types";

export type AdminProductRow = {
  id: string;
  slug: string;
  sku: string;
  name: string;
  nameBn: string | null;
  art: ArtKind;
  color: string;
  category: { slug: string; name: string } | null;
  type: ProductType;
  status: ProductStatus;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  variantCount: number;
  isFeatured: boolean;
};

export type AdminOrderItem = {
  id: string;
  name: string;
  variant: string;
  sku: string;
  quantity: number;
  unitPrice: number;
};

export type AdminOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  district: string;
  area: string;
  addressLine: string;
  customerNote: string | null;
  items: AdminOrderItem[];
  subtotal: number;
  shippingFee: number;
  discountTotal: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  source: OrderSource;
  landingPage: string | null;
  courierName: string | null;
  trackingCode: string | null;
  createdAt: string;
};

export type AdminLandingPage = {
  id: string;
  title: string;
  slug: string;
  status: LandingPageStatus;
  productName: string;
  offers: { label: string; quantity: number; price: number }[];
  sectionCount: number;
  viewCount: number;
  conversionCount: number;
  revenue: number;
  facebookPixel: boolean;
  updatedAt: string;
};

/** Initial values for the product form when editing. */
export type ProductEditData = {
  id: string;
  name: string;
  slug: string;
  type: ProductType;
  status: ProductStatus;
  category: string;
  art: ArtKind;
  shortDescription: string;
  description: string;
  fabricCare: string;
  tags: string[];
  isFeatured: boolean;
  metaTitle: string;
  metaDescription: string;
  sku: string;
  price: number;
  compareAtPrice: number | null;
  costPrice: number | null;
  stock: number;
  lowStockAt: number;
  colors: ProductColor[];
  sizes: string[];
  variants: {
    color: string | null;
    size: string | null;
    sku: string;
    price: number;
    compareAtPrice: number | null;
    stock: number;
    isActive: boolean;
  }[];
  /** Ordered image URLs; [0] is the featured image. */
  images: string[];
};
