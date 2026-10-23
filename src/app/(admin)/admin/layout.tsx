import type { Metadata } from "next";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Ribat Admin" },
  robots: { index: false, follow: false },
};

// Layout stays static; each page calls requireStaff() inside <Suspense>.
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex min-h-screen flex-1">
      <AdminSidebar />
      {/* min-w-0 stops wide content (e.g. the ticker preview) from stretching the column past the viewport. */}
      <div className="flex min-w-0 flex-1 flex-col bg-muted/40">{children}</div>
    </div>
  );
}
