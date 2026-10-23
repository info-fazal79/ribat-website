"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { homeSection } from "@/lib/validations/homepage";
import { requireAdmin } from "@/server/auth/guards";
import { db } from "@/server/db";
import { homeSectionsTag, toHomeSectionRow } from "@/server/services/home";

const input = z.object({ sections: z.array(homeSection).max(30) });

export type SaveHomeSectionsResult = { ok: true } | { ok: false; message: string; fieldErrors: Record<string, string> };

/** Homepage Builder save: replaces the HomeSection rows with the given ordered list. */
export async function saveHomeSections(raw: unknown): Promise<SaveHomeSectionsResult> {
  await requireAdmin();
  const parsed = input.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[issue.path.join(".")] ??= issue.message;
    return { ok: false, message: Object.values(fieldErrors)[0] ?? "Please fix the highlighted fields.", fieldErrors };
  }
  const { sections } = parsed.data;
  const ids = sections.map((s) => s.id);
  if (new Set(ids).size !== ids.length) return { ok: false, message: "Two sections share an ID — reload the builder.", fieldErrors: {} };

  await db.$transaction([
    db.homeSection.deleteMany({ where: { id: { notIn: ids } } }),
    ...sections.map((section, i) => {
      const { config, ...row } = toHomeSectionRow(section, i);
      const data = { ...row, config: config as Prisma.InputJsonValue };
      return db.homeSection.upsert({ where: { id: row.id }, update: data, create: data });
    }),
  ]);

  updateTag(homeSectionsTag);
  revalidatePath("/");
  return { ok: true };
}
