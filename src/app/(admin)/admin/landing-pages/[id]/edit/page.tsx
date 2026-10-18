import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { LandingBuilder } from "@/components/admin/landing-builder/builder";
import { requireStaff } from "@/server/auth/guards";
import { getLandingPageForBuilder, listBuilderProducts, listShippingZoneOptions } from "@/server/services/admin";

export const metadata: Metadata = { title: "Landing Page Builder" };

export default function EditLandingPage({ params }: PageProps<"/admin/landing-pages/[id]/edit">) {
  return (
    <Suspense fallback={<Skeleton className="m-6 h-[80vh]" />}>
      <Builder params={params} />
    </Suspense>
  );
}

async function Builder({ params }: Pick<PageProps<"/admin/landing-pages/[id]/edit">, "params">) {
  await requireStaff();
  const { id } = await params;
  const [page, products, zones] = await Promise.all([
    getLandingPageForBuilder(id),
    listBuilderProducts(),
    listShippingZoneOptions(),
  ]);
  if (!page) notFound();
  // Remount on save-refresh only when the record identity changes, not on every refresh.
  return <LandingBuilder key={page.id} page={page} products={products} zones={zones} />;
}
