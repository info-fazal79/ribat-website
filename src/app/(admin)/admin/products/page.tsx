import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AlertTriangle, Boxes, Package, Plus, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminPageHeader, StatCard } from "@/components/admin/page-header";
import { ProductsTable } from "@/components/admin/products/products-table";
import { formatBDT } from "@/lib/money";
import { requireStaff } from "@/server/auth/guards";
import { listCategoryOptions, listProducts } from "@/server/services/admin";

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
  const [products, categories] = await Promise.all([listProducts(), listCategoryOptions()]);
  const active = products.filter((p) => p.status === "ACTIVE");
  const lowStock = active.filter((p) => p.stock <= 10).length;
  const units = products.reduce((n, p) => n + p.stock, 0);
  // Approximation: units × lowest variant price.
  const value = products.reduce((n, p) => n + p.stock * p.price, 0);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Products" value={String(products.length)} hint={`${active.length} active`} icon={<Package className="size-4" />} />
        <StatCard label="Units in stock" value={units.toLocaleString("en-IN")} icon={<Boxes className="size-4" />} />
        <StatCard
          label="Low stock"
          value={String(lowStock)}
          hint="Active products ≤ 10 units"
          icon={<AlertTriangle className="size-4 text-amber-600" />}
        />
        <StatCard label="Inventory value" value={formatBDT(value)} hint="At retail price" icon={<Wallet className="size-4" />} />
      </div>
      <ProductsTable products={products} categories={categories} />
    </>
  );
}
