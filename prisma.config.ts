import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  // Migrations need a direct (non-pooled) connection. Read with process.env
  // (not env()) so `prisma generate` / postinstall works without a database.
  datasource: {
    url: process.env.DIRECT_URL ?? "",
  },
});
