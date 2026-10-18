import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductForm } from "@/components/admin/products/product-form";
import { requireStaff } from "@/server/auth/guards";
import { listCategoryOptions } from "@/server/services/admin";

export const metadata: Metadata = { title: "Add Product" };

export default function NewProductPage() {
  return (
    <Suspense fallback={<Skeleton className="m-6 h-[700px]" />}>
      <NewProduct />
    </Suspense>
  );
}

async function NewProduct() {
  await requireStaff();
  return <ProductForm categories={await listCategoryOptions()} />;
}
