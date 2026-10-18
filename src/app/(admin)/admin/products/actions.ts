"use server";

import { productFormSchema } from "@/lib/validations/product";
import { requireStaff } from "@/server/auth/guards";

export type SaveProductResult =
  | { ok: true; demo: true; id: string }
  | { ok: false; message: string; fieldErrors: Record<string, string> };

export async function saveProduct(input: unknown): Promise<SaveProductResult> {
  await requireStaff();

  const parsed = productFormSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".");
      fieldErrors[key] ??= issue.message;
    }
    return { ok: false, message: "Please fix the highlighted fields.", fieldErrors };
  }

  // TODO(admin): persist via a products service — upsert Product + ProductVariant/VariantOption rows
  // in a transaction (Prisma.Decimal for money), sync minPrice/maxPrice/totalStock, then
  // updateTag("products") and revalidate the storefront product tag.
  return { ok: true, demo: true, id: parsed.data.id ?? `draft_${parsed.data.slug}` };
}
