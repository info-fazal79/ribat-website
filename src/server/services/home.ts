import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { homeSection, sectionTypeFromDb, type HomeSection } from "@/lib/validations/homepage";
import { db } from "@/server/db";
import { getSetting, settingsTag } from "@/server/services/settings";

/** Homepage sections cache. The Homepage Builder's save must call updateTag(homeSectionsTag). */
export const homeSectionsTag = "home-sections";
export { toHomeSectionRow } from "@/lib/validations/homepage";

/**
 * Every homepage section (enabled or not) in order, from the HomeSection table. If the table is
 * empty, falls back to the legacy "home_sections" setting, whose own default is the original
 * hardcoded homepage — so the storefront never renders an empty page.
 */
export async function getHomeSections(): Promise<HomeSection[]> {
  "use cache";
  cacheTag(homeSectionsTag, settingsTag); // settings: the legacy fallback below
  cacheLife("hours");

  const rows = await db.homeSection.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }] });
  if (rows.length === 0) return (await getSetting("home_sections")).sections;

  return rows.flatMap((row) => {
    const type = sectionTypeFromDb(row.type);
    const config = row.config && typeof row.config === "object" && !Array.isArray(row.config) ? row.config : {};
    const parsed = type && homeSection.safeParse({ ...config, id: row.id, type, enabled: row.isEnabled });
    if (!parsed || !parsed.success) {
      console.error(`Skipping invalid HomeSection ${row.id} (${row.type})`);
      return [];
    }
    return [parsed.data];
  });
}
