import type { Metadata } from "next";
import { Suspense } from "react";
import { Banknote, Clock, PackageCheck, ShoppingBag } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminPageHeader, DemoDataNotice, StatCard } from "@/components/admin/page-header";
import { OrdersTable } from "@/components/admin/orders/orders-table";
import { orders } from "@/lib/mock/admin";
import { formatBDT } from "@/lib/money";
import { requireStaff } from "@/server/auth/guards";

export const metadata: Metadata = { title: "Orders" };

export default function AdminOrdersPage() {
  return (
    <div className="space-y-6 p-6">
      <AdminPageHeader title="Orders" description="Confirm, fulfil and track orders from the storefront and landing pages." />
      <Suspense fallback={<Skeleton className="h-[600px] w-full rounded-xl" />}>
        <OrdersContent />
      </Suspense>
    </div>
  );
}

async function OrdersContent() {
  await requireStaff();
  // TODO(admin): replace with an orders service query (paginated, server-side filters).
  const pending = orders.filter((o) => o.status === "PENDING").length;
  const live = orders.filter((o) => o.status !== "CANCELLED" && o.status !== "RETURNED");
  const revenue = live.reduce((n, o) => n + o.total, 0);
  const codDue = orders
    .filter((o) => o.paymentMethod === "COD" && o.paymentStatus !== "PAID" && o.status === "SHIPPED")
    .reduce((n, o) => n + o.total, 0);
  const delivered = orders.filter((o) => o.status === "DELIVERED").length;

  return (
    <>
      <DemoDataNotice />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Orders" value={String(orders.length)} hint="Last 10 days" icon={<ShoppingBag className="size-4" />} />
        <StatCard label="Needs confirmation" value={String(pending)} hint="Pending — call to confirm" icon={<Clock className="size-4 text-amber-600" />} />
        <StatCard label="Revenue" value={formatBDT(revenue)} hint="Excl. cancelled & returned" icon={<Banknote className="size-4" />} />
        <StatCard label="COD in transit" value={formatBDT(codDue)} hint={`${delivered} delivered`} icon={<PackageCheck className="size-4" />} />
      </div>
      <OrdersTable orders={orders} />
    </>
  );
}
