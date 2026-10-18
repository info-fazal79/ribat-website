import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminPageHeader } from "@/components/admin/page-header";
import { CreateLandingForm } from "@/components/admin/landing-pages/create-landing-form";
import { requireStaff } from "@/server/auth/guards";
import { listLandingProductOptions } from "@/server/services/admin";

export const metadata: Metadata = { title: "New Landing Page" };

export default function NewLandingPage() {
  return (
    <div className="space-y-6 p-6">
      <AdminPageHeader
        title="New landing page"
        description="One-page checkout for a single product — ideal for Facebook & TikTok ads. You'll customise every section next."
      />
      <Suspense fallback={<Skeleton className="h-96 max-w-2xl rounded-xl" />}>
        <Form />
      </Suspense>
    </div>
  );
}

async function Form() {
  await requireStaff();
  return <CreateLandingForm products={await listLandingProductOptions()} />;
}
