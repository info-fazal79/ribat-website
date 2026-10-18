import { z } from "zod";

/** Admin product form. Prices are BDT; the server converts to Prisma.Decimal. */
const money = z.number({ error: "Enter a price" }).min(0, "Must be 0 or more").max(10_000_000);
const optionalMoney = money.nullable();
const stock = z.number({ error: "Enter stock" }).int("Whole numbers only").min(0, "Can't be negative");
const sku = z.string().trim().min(2, "SKU is required").max(64);

const comparePrice = <T extends { price: number; compareAtPrice: number | null }>(v: T) =>
  v.compareAtPrice === null || v.compareAtPrice > v.price;
const compareMessage = { message: "Compare-at price must be higher than price", path: ["compareAtPrice"] };

export const productVariantInput = z
  .object({
    optionKey: z.string().min(1),
    title: z.string().min(1),
    color: z.string().nullable(),
    size: z.string().nullable(),
    sku,
    price: money,
    compareAtPrice: optionalMoney,
    stock,
    isActive: z.boolean(),
  })
  .refine(comparePrice, compareMessage);

const base = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(3, "Product name is required").max(160),
  slug: z
    .string()
    .trim()
    .min(3, "Slug is required")
    .max(160)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers and hyphens only"),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
  category: z.string().min(1, "Choose a category"),
  shortDescription: z.string().max(300).optional(),
  description: z.string().max(20_000).optional(), // Bengali allowed; sanitize on render
  fabricCare: z.string().max(2000).optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20),
  isFeatured: z.boolean(),
  metaTitle: z.string().max(70).optional(),
  metaDescription: z.string().max(160).optional(),
});

export const productFormSchema = z.discriminatedUnion("type", [
  base.extend({
    type: z.literal("SIMPLE"),
    simple: z
      .object({
        sku,
        price: money,
        compareAtPrice: optionalMoney,
        costPrice: optionalMoney,
        stock,
        lowStockAt: stock,
      })
      .refine(comparePrice, compareMessage),
  }),
  base.extend({
    type: z.literal("VARIABLE"),
    colors: z.array(z.object({ name: z.string().trim().min(1), hex: z.string().regex(/^#[0-9a-fA-F]{6}$/) })),
    sizes: z.array(z.string().trim().min(1)),
    variants: z
      .array(productVariantInput)
      .min(1, "Add at least one colour or size to generate variants")
      .refine((vs) => new Set(vs.map((v) => v.sku)).size === vs.length, "Each variant needs a unique SKU"),
  }),
]);

export type ProductFormInput = z.infer<typeof productFormSchema>;
export type ProductVariantInput = z.infer<typeof productVariantInput>;
