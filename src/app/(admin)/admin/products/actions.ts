"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { productFormSchema } from "@/lib/validations/product";
import { requireStaff } from "@/server/auth/guards";
import { catalogTag } from "@/server/services/catalog";
import { ProductSaveError, saveProduct as persistProduct, setProductStatus } from "@/server/services/products";

export type SaveProductResult =
  | { ok: true; id: string }
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

  try {
    const id = await persistProduct(parsed.data);
    updateTag(catalogTag);
    revalidatePath("/admin/products");
    return { ok: true, id };
  } catch (e) {
    if (e instanceof ProductSaveError) return { ok: false, message: e.message, fieldErrors: e.fieldErrors };
    console.error("saveProduct failed", e);
    return { ok: false, message: "Could not save the product. Please try again.", fieldErrors: {} };
  }
}

const statusInput = z.object({ id: z.string().min(1), status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]) });

export async function updateProductStatus(input: z.input<typeof statusInput>) {
  await requireStaff();
  const { id, status } = statusInput.parse(input);
  await setProductStatus(id, status);
  updateTag(catalogTag);
  revalidatePath("/admin/products");
}
