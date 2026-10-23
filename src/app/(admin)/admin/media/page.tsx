import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminPageHeader } from "@/components/admin/page-header";
import { MediaLibrary } from "@/components/admin/media/media-library";
import { requireStaff } from "@/server/auth/guards";
import { listMedia } from "@/server/services/media";

export const metadata: Metadata = { title: "Media" };

export default function AdminMediaPage() {
  return (
    <div className="space-y-6 p-6">
      <AdminPageHeader title="Media Library" description="Product photos, banners and brand assets. Drag files anywhere on this page to upload." />
      <Suspense fallback={<Skeleton className="h-[600px] w-full rounded-xl" />}>
        <MediaContent />
      </Suspense>
    </div>
  );
}

async function MediaContent() {
  await requireStaff();
  return <MediaLibrary initialItems={await listMedia()} />;
}
