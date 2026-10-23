import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminPageHeader } from "@/components/admin/page-header";
import { CategoriesManager } from "@/components/admin/categories/categories-manager";
import { requireStaff } from "@/server/auth/guards";
import { listAdminCategories } from "@/server/services/admin";

export const metadata: Metadata = { title: "Categories" };

export default function AdminCategoriesPage() {
  return (
    <div className="space-y-6 p-6">
      <AdminPageHeader
        title="Categories"
        description="Organise products into categories. Display order, images and visibility apply across the storefront."
      />
      <Suspense fallback={<Skeleton className="h-[480px] w-full rounded-xl" />}>
        <CategoriesContent />
      </Suspense>
    </div>
  );
}

async function CategoriesContent() {
  await requireStaff();
  return <CategoriesManager categories={await listAdminCategories()} />;
}
