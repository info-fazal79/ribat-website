# Ribat — eCommerce & Landing Page Engine

Islamic lifestyle & premium clothing store for Bangladesh.
Storefront · Admin dashboard · CartFlows-style one-page landing checkout.

**Stack:** Next.js 16 (App Router, Cache Components) · TypeScript · Tailwind CSS v4 · shadcn/ui (Radix) · Prisma 7 + PostgreSQL · Auth.js v5 · Zod 4

## Getting started

```bash
cp .env.example .env          # fill DATABASE_URL, DIRECT_URL, AUTH_SECRET (npx auth secret)
npm install                   # also runs `prisma generate`
npm run db:migrate            # create tables (first run: name it "init")
npm run db:seed               # admin, shipping zones, Color/Size, categories, starter catalog, settings
npm run db:seed:demo          # optional: demo orders + landing pages (`-- --remove` to delete)
npm run dev                   # http://localhost:3000  ·  admin: /login → /admin
```

## Scripts

| Script | Purpose |
| --- | --- |
| `dev` / `build` / `start` | Next.js |
| `lint` / `typecheck` | ESLint / route typegen + `tsc` |
| `db:migrate` | `prisma migrate dev` (local schema changes) |
| `db:deploy` | `prisma migrate deploy` (production) |
| `db:push` | Prototype schema without a migration |
| `db:seed` | Idempotent seed (`prisma/seed.ts`, catalog data in `prisma/data/`) |
| `db:seed:demo` | Opt-in demo orders & landing pages (`-- --remove` deletes them) |
| `admin:reset-password` | Set a new admin password in the DB (prompts; `-- --email x` for another user) |
| `db:studio` | Prisma Studio |

## Project structure

```
prisma/
  schema.prisma          # data model (generator → src/generated/prisma)
  seed.ts
prisma.config.ts         # Prisma 7 CLI config (DIRECT_URL for migrations)
src/
  app/
    (storefront)/        # public shop: header/footer layout, home, products…
    (auth)/login/        # admin/staff sign-in
    (admin)/admin/       # dashboard (sidebar layout; pages call requireStaff())
    lp/[slug]/           # landing page engine (standalone, no site chrome)
    api/auth/            # Auth.js handlers
  components/
    ui/                  # shadcn/ui primitives (generated — edit sparingly)
    storefront/ admin/ landing/
  config/site.ts         # brand, nav, admin nav
  lib/
    env.ts               # Zod-validated server env
    money.ts phone.ts    # BDT formatting, BD phone normalisation
    validations/         # Zod: checkout, landing-page blocks, settings keys
  server/                # server-only code
    db.ts                # Prisma client (pg driver adapter, pooled URL)
    auth/                # Auth.js config (edge-safe + full) and guards
    services/            # data access / business logic (cached reads)
    integrations/        # payments (bKash/Nagad/SSLCommerz), courier (Steadfast/Pathao)
  generated/prisma/      # Prisma client output (gitignored)
  proxy.ts               # optimistic auth gate for /admin, /account
```

## Key conventions

- **Money** is `Decimal(12,2)` BDT. Do arithmetic with `Prisma.Decimal` on the server; `formatBDT()` for display only. Always recompute totals server-side.
- **Cache Components** is on: anything reading cookies/session/uncached DB must render inside `<Suspense>`. Cached reads use `"use cache"` + `cacheTag()`; mutations call `revalidateTag()`.
- **Auth:** `proxy.ts` is only an optimistic check. Every admin page, server action and route handler must call `requireStaff()` / `requireAdmin()`.
- **Landing pages:** `LandingPage.sections` is validated by the Zod union in `src/lib/validations/landing-page.ts`. New block = schema + case in `section-renderer.tsx`.
- **Settings:** read/write through `settingSchemas` in `src/lib/validations/settings.ts`.
