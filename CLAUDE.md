# Ribat eCommerce & Landing Page Project

## Brand:
Ribat (Islamic Lifestyle & Premium Clothing Brand in Bangladesh).

## Tech Stack:
- Next.js 14+ (App Router), TypeScript, Tailwind CSS, Shadcn UI
- Prisma ORM with PostgreSQL (Supabase/Neon)
- Auth: NextAuth.js / Auth.js
- Payment & Checkout: COD (Cash on Delivery) + bKash/Nagad/SSLCommerz ready
- Courier: Steadfast / Pathao integration ready
- Currency: BDT (৳)
- Language: English UI with Bengali support for product details & banners

## Architecture:
1. Storefront (Modern luxury clothing aesthetic)
2. Custom Admin Dashboard (Product catalog, variants like size/color, inventory, orders)
3. Dynamic Landing Page Engine (CartFlows style 1-page checkout landing pages)

## Implementation Notes (scaffold)
- Actual versions: Next.js 16 (Cache Components on, `proxy.ts` replaces middleware), Tailwind v4, shadcn (radix-nova), Prisma 7, Auth.js v5 beta, Zod 4. Read `AGENTS.md` / `node_modules/next/dist/docs/` before using Next APIs.
- Prisma 7: no URLs in schema. CLI uses `DIRECT_URL` via `prisma.config.ts`; runtime uses pooled `DATABASE_URL` via `@prisma/adapter-pg` in `src/server/db.ts`. Import client/types from `@/generated/prisma/client`, enums (client-safe) from `@/generated/prisma/enums`.
- Session/cookie/uncached DB reads must sit inside `<Suspense>`; keep layouts static. `"use cache"` results must be serializable (convert Decimal → string).
- Authorize in `src/server/auth/guards.ts` on every admin page/action — `proxy.ts` is optimistic only.
- Server-only code lives in `src/server/`; shared Zod schemas in `src/lib/validations/`. See README for full structure.