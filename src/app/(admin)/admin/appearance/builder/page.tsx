import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { HomeBuilder } from "@/components/admin/home-builder/home-builder";
import { requireAdmin } from "@/server/auth/guards";
import { getCategories } from "@/server/services/catalog";
import { getHomeSections } from "@/server/services/home";

export const metadata: Metadata = { title: "Homepage Builder" };

export default function HomepageBuilderPage() {
  return (
    <Suspense fallback={<Skeleton className="m-6 h-[80vh]" />}>
      <Builder />
    </Suspense>
  );
}

async function Builder() {
  await requireAdmin();
  const [sections, categories] = await Promise.all([getHomeSections(), getCategories()]);
  return <HomeBuilder initial={sections} categories={categories.map(({ slug, name, nameBn }) => ({ slug, name, nameBn }))} />;
}
