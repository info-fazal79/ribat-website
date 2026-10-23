"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { settingSchemas } from "@/lib/validations/settings";
import { requireAdmin } from "@/server/auth/guards";
import { db } from "@/server/db";
import { settingsTag } from "@/server/services/settings";

const appearanceInput = z.object({
  branding: settingSchemas["appearance.branding"],
  announcement: settingSchemas["appearance.announcement"],
  headerMenu: settingSchemas.header_menu,
});

export type SaveAppearanceResult = { ok: true } | { ok: false; message: string; fieldErrors: Record<string, string> };

export async function saveAppearance(raw: unknown): Promise<SaveAppearanceResult> {
  await requireAdmin();
  const parsed = appearanceInput.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[issue.path.join(".")] ??= issue.message;
    return { ok: false, message: Object.values(fieldErrors)[0] ?? "Please fix the highlighted fields.", fieldErrors };
  }
  const { branding, announcement, headerMenu } = parsed.data;
  if (branding.logoType === "image" && !branding.logoUrl) {
    return { ok: false, message: "Add a logo image URL or switch to Text logo.", fieldErrors: { "branding.logoUrl": "Required for an image logo" } };
  }

  await db.$transaction([
    db.setting.upsert({ where: { key: "appearance.branding" }, update: { value: branding }, create: { key: "appearance.branding", value: branding } }),
    db.setting.upsert({
      where: { key: "appearance.announcement" },
      update: { value: announcement },
      create: { key: "appearance.announcement", value: announcement },
    }),
    db.setting.upsert({ where: { key: "header_menu" }, update: { value: headerMenu }, create: { key: "header_menu", value: headerMenu } }),
  ]);

  updateTag(settingsTag);
  // Header + favicon live in layouts, so refresh every page under the root layout.
  revalidatePath("/", "layout");
  return { ok: true };
}
