import "server-only";
import { Prisma } from "@/generated/prisma/client";
import type { ProductStatus } from "@/generated/prisma/enums";
import { optionKeyFor, valueSlug, variantTitle } from "@/lib/catalog/variant-keys";
import type { ProductFormInput } from "@/lib/validations/product";
import { db } from "@/server/db";

export class ProductSaveError extends Error {
  constructor(
    message: string,
    public fieldErrors: Record<string, string> = {},
  ) {
    super(message);
  }
}

type VariantSpec = {
  sku: string;
  title: string;
  price: number;
  compareAtPrice: number | null;
  costPrice: number | null;
  stock: number;
  lowStockAt: number;
  isActive: boolean;
  options: { attributeId: string; attributeValueId: string }[];
};

/** Upserts Color/Size values used by the form; returns name → IDs. */
async function resolveAttributeValues(input: Extract<ProductFormInput, { type: "VARIABLE" }>) {
  const [color, size] = await Promise.all([
    db.attribute.findUniqueOrThrow({ where: { slug: "color" } }),
    db.attribute.findUniqueOrThrow({ where: { slug: "size" } }),
  ]);
  const upsert = async (attributeId: string, value: string, swatchHex?: string) => {
    const row = await db.attributeValue.upsert({
      where: { attributeId_slug: { attributeId, slug: valueSlug(value) } },
      update: {},
      create: { attributeId, value, slug: valueSlug(value), swatchHex },
    });
    return { attributeId, attributeValueId: row.id };
  };
  const colors = new Map(
    await Promise.all(input.colors.map(async (c) => [c.name, await upsert(color.id, c.name, c.hex)] as const)),
  );
  const sizes = new Map(await Promise.all(input.sizes.map(async (s) => [s, await upsert(size.id, s)] as const)));
  return { colors, sizes };
}

async function variantSpecs(input: ProductFormInput): Promise<VariantSpec[]> {
  if (input.type === "SIMPLE") {
    const s = input.simple;
    return [{ ...s, title: "Default", isActive: true, options: [] }];
  }
  const { colors, sizes } = await resolveAttributeValues(input);
  return input.variants.map((v) => ({
    sku: v.sku,
    title: variantTitle(v.color, v.size),
    price: v.price,
    compareAtPrice: v.compareAtPrice,
    costPrice: null,
    stock: v.stock,
    lowStockAt: 3,
    isActive: v.isActive,
    options: [v.color ? colors.get(v.color) : undefined, v.size ? sizes.get(v.size) : undefined].filter(
      (o): o is NonNullable<typeof o> => !!o,
    ),
  }));
}

/** Creates or updates a product with its variants. Returns the product ID. */
export async function saveProduct(input: ProductFormInput): Promise<string> {
  const category = await db.category.findUnique({ where: { slug: input.category }, select: { id: true } });
  if (!category) throw new ProductSaveError("Category not found", { category: "Choose a category" });

  const specs = await variantSpecs(input);
  const active = specs.filter((s) => s.isActive);
  if (active.length === 0) throw new ProductSaveError("Enable at least one variant", { variants: "Enable at least one variant" });

  const productData = {
    name: input.name,
    slug: input.slug,
    type: input.type,
    status: input.status,
    shortDescription: input.shortDescription ?? null,
    description: input.description ?? null,
    fabricCare: input.fabricCare ?? null,
    tags: input.tags,
    isFeatured: input.isFeatured,
    metaTitle: input.metaTitle ?? null,
    metaDescription: input.metaDescription ?? null,
    category: { connect: { id: category.id } },
    // Denormalized listing fields
    minPrice: Math.min(...active.map((s) => s.price)),
    maxPrice: Math.max(...active.map((s) => s.price)),
    totalStock: active.reduce((n, s) => n + s.stock, 0),
  };

  try {
    return await db.$transaction(
      async (tx) => {
        const existing = input.id
          ? await tx.product.findUnique({ where: { id: input.id }, select: { id: true, publishedAt: true } })
          : null;
        if (input.id && !existing) throw new ProductSaveError("This product no longer exists.");

        const publishedAt = input.status === "ACTIVE" ? (existing?.publishedAt ?? new Date()) : existing?.publishedAt;
        const product = existing
          ? await tx.product.update({ where: { id: existing.id }, data: { ...productData, publishedAt } })
          : await tx.product.create({ data: { ...productData, publishedAt } });

        const keep: string[] = [];
        for (const [position, s] of specs.entries()) {
          const optionKey = optionKeyFor(s.options.map((o) => o.attributeValueId));
          keep.push(optionKey);
          const fields = {
            sku: s.sku,
            title: s.title,
            price: s.price,
            compareAtPrice: s.compareAtPrice,
            costPrice: s.costPrice,
            stock: s.stock,
            lowStockAt: s.lowStockAt,
            isActive: s.isActive,
            isDefault: position === 0,
            position,
          };
          await tx.productVariant.upsert({
            where: { productId_optionKey: { productId: product.id, optionKey } },
            update: fields,
            create: { ...fields, productId: product.id, optionKey, options: { create: s.options } },
          });
        }

        // Variants no longer offered: delete if never ordered, otherwise deactivate (keeps order history intact).
        const removed = { productId: product.id, optionKey: { notIn: keep } };
        await tx.productVariant.deleteMany({ where: { ...removed, orderItems: { none: {} } } });
        await tx.productVariant.updateMany({ where: removed, data: { isActive: false } });

        return product.id;
      },
      { timeout: 30_000, maxWait: 10_000 },
    );
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      // With driver adapters the field is reported via the constraint name (e.g. "Product_slug_key").
      const target = `${JSON.stringify(e.meta ?? {})} ${e.message}`;
      if (target.includes("slug")) throw new ProductSaveError("Slug already in use", { slug: "Another product uses this slug" });
      if (target.includes("sku")) throw new ProductSaveError("SKU already in use", { variants: "A SKU is already used by another product" });
    }
    throw e;
  }
}

export async function setProductStatus(id: string, status: ProductStatus) {
  await db.product.update({
    where: { id },
    data: { status, ...(status === "ACTIVE" && { publishedAt: new Date() }) },
  });
}
