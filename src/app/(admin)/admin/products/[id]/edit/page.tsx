import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductForm } from "@/components/admin/products/product-form";
import { products } from "@/lib/mock/catalog";
import { requireStaff } from "@/server/auth/guards";

export const metadata: Metadata = { title: "Edit Product" };

export default function EditProductPage({ params }: PageProps<"/admin/products/[id]/edit">) {
  return (
    <Suspense fallback={<Skeleton className="m-6 h-[700px]" />}>
      <EditProduct params={params} />
    </Suspense>
  );
}

async function EditProduct({ params }: Pick<PageProps<"/admin/products/[id]/edit">, "params">) {
  await requireStaff();
  const { id } = await params;
  // TODO(admin): load from the products service (include variants/options/images).
  const product = products.find((p) => p.id === id);
  if (!product) notFound();
  return <ProductForm key={product.id} product={product} />;
}
