import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AlertTriangle, Boxes, Package, Plus, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminPageHeader, DemoDataNotice, StatCard } from "@/components/admin/page-header";
import { ProductsTable } from "@/components/admin/products/products-table";
import { products } from "@/lib/mock/catalog";
import { formatBDT } from "@/lib/money";
import { requireStaff } from "@/server/auth/guards";

export const metadata: Metadata = { title: "Products" };

export default function AdminProductsPage() {
  return (
    <div className="space-y-6 p-6">
      <AdminPageHeader
        title="Products"
        description="Manage your catalog, variants and stock."
        actions={
          <Button asChild>
            <Link href="/admin/products/new">
              <Plus /> Add Product
            </Link>
          </Button>
        }
      />
      <Suspense fallback={<Skeleton className="h-[600px] w-full rounded-xl" />}>
        <ProductsContent />
      </Suspense>
    </div>
  );
}

async function ProductsContent() {
  await requireStaff();
  // TODO(admin): replace with a products service query (paginated, server-side filters).
  const active = products.filter((p) => p.status === "ACTIVE").length;
  const lowStock = products.filter((p) => p.status === "ACTIVE" && p.stock <= 10).length;
  const units = products.reduce((n, p) => n + p.stock, 0);
  const value = products.reduce((n, p) => n + p.stock * p.price, 0);

  return (
    <>
      <DemoDataNotice />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Products" value={String(products.length)} hint={`${active} active`} icon={<Package className="size-4" />} />
        <StatCard label="Units in stock" value={units.toLocaleString("en-IN")} icon={<Boxes className="size-4" />} />
        <StatCard
          label="Low stock"
          value={String(lowStock)}
          hint="Active products ≤ 10 units"
          icon={<AlertTriangle className="size-4 text-amber-600" />}
        />
        <StatCard label="Inventory value" value={formatBDT(value)} hint="At retail price" icon={<Wallet className="size-4" />} />
      </div>
      <ProductsTable products={products} />
    </>
  );
}
