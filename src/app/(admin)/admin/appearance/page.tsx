import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminPageHeader } from "@/components/admin/page-header";
import { AppearanceCustomizer } from "@/components/admin/appearance/appearance-customizer";
import { requireAdmin } from "@/server/auth/guards";
import { getSetting } from "@/server/services/settings";

export const metadata: Metadata = { title: "Appearance" };

export default function AdminAppearancePage() {
  return (
    <div className="space-y-6 p-6">
      <AdminPageHeader
        title="Appearance"
        description="Logo, favicon and the top announcement bar. Changes go live on the storefront as soon as you save."
      />
      <Suspense fallback={<Skeleton className="h-[600px] w-full rounded-xl" />}>
        <AppearanceContent />
      </Suspense>
    </div>
  );
}

async function AppearanceContent() {
  await requireAdmin();
  const [branding, announcement] = await Promise.all([getSetting("appearance.branding"), getSetting("appearance.announcement")]);
  return <AppearanceCustomizer branding={branding} announcement={announcement} />;
}
