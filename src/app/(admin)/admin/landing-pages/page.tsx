import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminPageHeader, DemoDataNotice } from "@/components/admin/page-header";
import { LandingPagesManager } from "@/components/admin/landing-pages/landing-pages-manager";
import { landingPages } from "@/lib/mock/admin";
import { activeProducts } from "@/lib/mock/catalog";
import { requireStaff } from "@/server/auth/guards";

export const metadata: Metadata = { title: "Landing Pages" };

export default function AdminLandingPagesPage() {
  return (
    <div className="space-y-6 p-6">
      <AdminPageHeader
        title="Landing Pages"
        description="CartFlows-style one-page checkouts for ad campaigns — track views, conversions and revenue."
      />
      <Suspense fallback={<Skeleton className="h-[600px] w-full rounded-xl" />}>
        <LandingPagesContent />
      </Suspense>
    </div>
  );
}

async function LandingPagesContent() {
  await requireStaff();
  // TODO(admin): replace with a landing-pages service query.
  const products = activeProducts.map(({ id, name, price, compareAtPrice }) => ({ id, name, price, compareAtPrice }));
  return (
    <>
      <DemoDataNotice />
      <LandingPagesManager pages={landingPages} products={products} />
    </>
  );
}
