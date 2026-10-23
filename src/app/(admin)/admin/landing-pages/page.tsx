import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminPageHeader } from "@/components/admin/page-header";
import { LandingPagesManager } from "@/components/admin/landing-pages/landing-pages-manager";
import { requireStaff } from "@/server/auth/guards";
import { listLandingPages, listLandingProductOptions } from "@/server/services/admin";

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
  const [pages, products] = await Promise.all([listLandingPages(), listLandingProductOptions()]);
  return <LandingPagesManager pages={pages} products={products} />;
}
