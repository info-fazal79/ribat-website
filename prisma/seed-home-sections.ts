/**
 * One-time move of the homepage layout into the HomeSection table (Homepage Builder).
 *   npm run db:seed:home
 * Copies exactly what the storefront renders today — the saved "home_sections" setting, or the
 * built-in defaults if it was never saved — so there is no visual change. Does nothing if the
 * table already has rows.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Prisma } from "../src/generated/prisma/client";
import { toHomeSectionRow } from "../src/lib/validations/homepage";
import { settingSchemas } from "../src/lib/validations/settings";

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) throw new Error("DIRECT_URL or DATABASE_URL must be set");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  const existing = await db.homeSection.count();
  if (existing > 0) {
    console.log(`↷ HomeSection already has ${existing} rows — nothing to do`);
    return;
  }
  const setting = await db.setting.findUnique({ where: { key: "home_sections" } });
  const { sections } = settingSchemas.home_sections.parse(setting?.value ?? {});
  await db.homeSection.createMany({
    data: sections.map((section, i) => {
      const { config, ...row } = toHomeSectionRow(section, i);
      return { ...row, config: config as Prisma.InputJsonValue };
    }),
  });
  console.log(`✔ Seeded ${sections.length} homepage sections from ${setting ? "the saved home_sections setting" : "the built-in defaults"}:`);
  for (const [i, s] of sections.entries()) console.log(`  ${i + 1}. ${toHomeSectionRow(s, i).type}${s.enabled ? "" : " (hidden)"}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
