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
  hero: settingSchemas.hero_slides,
  headerLayout: settingSchemas.header_layout,
  homeSections: settingSchemas.home_sections,
  footer: settingSchemas.footer_settings,
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
  const { branding, announcement, headerMenu, hero, headerLayout, homeSections, footer } = parsed.data;
  if (branding.logoType === "image" && !branding.logoUrl) {
    return { ok: false, message: "Add a logo image URL or switch to Text logo.", fieldErrors: { "branding.logoUrl": "Required for an image logo" } };
  }
  const unlinked = hero.slides.findIndex((s) => s.mode === "product" && !s.product.id);
  if (unlinked !== -1) {
    return {
      ok: false,
      message: `Slide ${unlinked + 1}: choose a product or switch to Custom Content.`,
      fieldErrors: { [`hero.slides.${unlinked}.product.id`]: "Choose a product" },
    };
  }

  await db.$transaction([
    db.setting.upsert({ where: { key: "appearance.branding" }, update: { value: branding }, create: { key: "appearance.branding", value: branding } }),
    db.setting.upsert({
      where: { key: "appearance.announcement" },
      update: { value: announcement },
      create: { key: "appearance.announcement", value: announcement },
    }),
    db.setting.upsert({ where: { key: "header_menu" }, update: { value: headerMenu }, create: { key: "header_menu", value: headerMenu } }),
    db.setting.upsert({ where: { key: "hero_slides" }, update: { value: hero }, create: { key: "hero_slides", value: hero } }),
    db.setting.upsert({
      where: { key: "header_layout" },
      update: { value: headerLayout },
      create: { key: "header_layout", value: headerLayout },
    }),
    db.setting.upsert({
      where: { key: "home_sections" },
      update: { value: homeSections },
      create: { key: "home_sections", value: homeSections },
    }),
    db.setting.upsert({
      where: { key: "footer_settings" },
      update: { value: footer },
      create: { key: "footer_settings", value: footer },
    }),
  ]);

  updateTag(settingsTag);
  // Header + favicon live in layouts, so refresh every page under the root layout.
  revalidatePath("/", "layout");
  return { ok: true };
}
