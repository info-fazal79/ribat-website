"use server";

import { revalidatePath, updateTag } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { categoryFormSchema } from "@/lib/validations/category";
import { requireStaff } from "@/server/auth/guards";
import { db } from "@/server/db";
import { catalogTag } from "@/server/services/catalog";

export type CategoryActionResult = { ok: true } | { ok: false; message: string; fieldErrors: Record<string, string> };

function refresh() {
  updateTag(catalogTag);
  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
}

export async function saveCategory(raw: unknown): Promise<CategoryActionResult> {
  await requireStaff();
  const parsed = categoryFormSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[issue.path.join(".")] ??= issue.message;
    return { ok: false, message: "Please fix the highlighted fields.", fieldErrors };
  }
  const { id, ...v } = parsed.data;
  const data = {
    name: v.name,
    nameBn: v.nameBn || null,
    slug: v.slug,
    description: v.description || null,
    imageUrl: v.imageUrl || null,
    bannerUrl: v.bannerUrl || null,
    position: v.position,
    isActive: v.isActive,
  };
  try {
    if (id) await db.category.update({ where: { id }, data });
    else await db.category.create({ data });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, message: "That slug is already used by another category.", fieldErrors: { slug: "Already in use" } };
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return { ok: false, message: "This category no longer exists.", fieldErrors: {} };
    }
    throw e;
  }
  refresh();
  return { ok: true };
}

/** Deletes a category; its products stay in the catalog, uncategorised (FK is ON DELETE SET NULL). */
export async function deleteCategory(id: string): Promise<CategoryActionResult> {
  await requireStaff();
  if (typeof id !== "string" || !id) return { ok: false, message: "Missing category", fieldErrors: {} };
  try {
    await db.category.delete({ where: { id } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return { ok: false, message: "This category was already deleted.", fieldErrors: {} };
    }
    throw e;
  }
  refresh();
  return { ok: true };
}
