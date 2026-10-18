import Link from "next/link";
import { Suspense } from "react";
import { AlertTriangle, ArrowRight, Banknote, Clock, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DemoDataNotice, StatCard } from "@/components/admin/page-header";
import { OrderStatusBadge } from "@/components/admin/status-badge";
import { orders } from "@/lib/mock/admin";
import { products } from "@/lib/mock/catalog";
import { formatDateTime } from "@/lib/format";
import { formatBDT } from "@/lib/money";
import { requireStaff } from "@/server/auth/guards";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6 p-6">
      <Suspense fallback={<Skeleton className="h-9 w-64" />}>
        <Greeting />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-[480px] w-full rounded-xl" />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}

async function Greeting() {
  const user = await requireStaff();
  return <h1 className="text-3xl">Assalamu Alaikum, {user.name ?? "Admin"}</h1>;
}

async function DashboardContent() {
  await requireStaff();
  // TODO(admin): dashboard service with real aggregates (today / 30d) once on Prisma.
  const today = orders.filter((o) => o.createdAt.startsWith("2026-10-18")).length;
  const pending = orders.filter((o) => o.status === "PENDING").length;
  const revenue = orders
    .filter((o) => o.status !== "CANCELLED" && o.status !== "RETURNED")
    .reduce((n, o) => n + o.total, 0);
  const lowStock = products.filter((p) => p.status === "ACTIVE" && p.stock <= 10);

  return (
    <>
      <DemoDataNotice />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Today's Orders" value={String(today)} icon={<ShoppingBag className="size-4" />} />
        <StatCard label="Pending Orders" value={String(pending)} hint="Awaiting phone confirmation" icon={<Clock className="size-4 text-amber-600" />} />
        <StatCard label="Revenue (30d)" value={formatBDT(revenue)} icon={<Banknote className="size-4" />} />
        <StatCard
          label="Low Stock"
          value={String(lowStock.length)}
          hint={lowStock.map((p) => p.name.split(" ").slice(0, 2).join(" ")).join(", ") || "All good"}
          icon={<AlertTriangle className="size-4 text-amber-600" />}
        />
      </div>

      <div className="rounded-xl border bg-card">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="font-sans text-base font-medium">Recent orders</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/orders">
              View all <ArrowRight />
            </Link>
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="pr-4">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.slice(0, 6).map((o) => (
              <TableRow key={o.id}>
                <TableCell className="pl-4">
                  <p className="font-mono text-sm">{o.orderNumber}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(o.createdAt)}</p>
                </TableCell>
                <TableCell>
                  {o.customerName}
                  <span className="block text-xs text-muted-foreground">{o.district}</span>
                </TableCell>
                <TableCell className="text-right tabular-nums">{formatBDT(o.total)}</TableCell>
                <TableCell className="pr-4">
                  <OrderStatusBadge status={o.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
