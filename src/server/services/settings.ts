import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { settingSchemas, type SettingKey, type SettingValue } from "@/lib/validations/settings";
import { db } from "@/server/db";

/** Storefront settings cache. Setting mutations must call updateTag(settingsTag). */
export const settingsTag = "settings";

/** Reads a typed setting, falling back to schema defaults when missing or invalid. */
export async function getSetting<K extends SettingKey>(key: K): Promise<SettingValue<K>> {
  "use cache";
  cacheTag(settingsTag);
  cacheLife("days");

  const row = await db.setting.findUnique({ where: { key } });
  const schema = settingSchemas[key];
  const parsed = schema.safeParse(row?.value ?? {});
  return (parsed.success ? parsed.data : schema.parse({})) as SettingValue<K>;
}
