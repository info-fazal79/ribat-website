"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { Archive, ArchiveRestore, ExternalLink, MoreHorizontal, Pencil, Search, Star } from "lucide-react";
import { toast } from "sonner";
import { updateProductStatus } from "@/app/(admin)/admin/products/actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ProductArt } from "@/components/storefront/art";
import { ProductStatusBadge, StatusPill } from "@/components/admin/status-badge";
import type { ProductStatus } from "@/generated/prisma/enums";
import type { AdminProductRow } from "@/lib/admin/types";
import { formatBDT } from "@/lib/money";
import { cn } from "@/lib/utils";

const LOW_STOCK = 10;

export function ProductsTable({
  products,
  categories,
}: {
  products: AdminProductRow[];
  categories: { slug: string; name: string }[];
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ProductStatus | "ALL">("ALL");
  const [category, setCategory] = useState("all");
  const [type, setType] = useState("all");

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: products.length };
    for (const p of products) c[p.status] = (c[p.status] ?? 0) + 1;
    return c;
  }, [products]);

  const q = query.trim().toLowerCase();
  const filtered = products.filter(
    (p) =>
      (status === "ALL" || p.status === status) &&
      (category === "all" || p.category?.slug === category) &&
      (type === "all" || p.type === type) &&
      (!q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || !!p.nameBn?.includes(query.trim())),
  );

  return (
    <div className="rounded-xl border bg-card">
      <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-1 overflow-x-auto">
          {(["ALL", "ACTIVE", "DRAFT", "ARCHIVED"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm whitespace-nowrap transition",
                status === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
              )}
            >
              {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
              <span className="ml-1.5 text-xs opacity-70">{counts[s] ?? 0}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name or SKU…"
              className="w-56 pl-8"
              aria-label="Search products"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-36" aria-label="Category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.slug} value={c.slug}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-32" aria-label="Product type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="SIMPLE">Simple</SelectItem>
              <SelectItem value="VARIABLE">Variable</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">Product</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-12 pr-4" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                {products.length === 0 ? "No products yet — add your first one." : "No products match these filters."}
              </TableCell>
            </TableRow>
          )}
          {filtered.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="pl-4">
                <Link href={`/admin/products/${p.id}/edit`} className="group flex items-center gap-3">
                  <ProductArt kind={p.art} color={p.color} className="aspect-[3/4] w-10 shrink-0 rounded-sm" />
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 font-medium group-hover:underline">
                      {p.name}
                      {p.isFeatured && <Star className="size-3 fill-gold text-gold" aria-label="Featured" />}
                    </p>
                    <p className="font-mono text-[11px] text-muted-foreground">{p.sku}</p>
                  </div>
                </Link>
              </TableCell>
              <TableCell>{p.category?.name ?? <span className="text-muted-foreground">—</span>}</TableCell>
              <TableCell>
                <StatusPill tone={p.type === "VARIABLE" ? "blue" : "neutral"} dot={false}>
                  {p.type === "VARIABLE" ? `Variable · ${p.variantCount}` : "Simple"}
                </StatusPill>
              </TableCell>
              <TableCell className="text-right">
                <p className="font-medium tabular-nums">{formatBDT(p.price)}</p>
                {p.compareAtPrice && (
                  <p className="text-[11px] text-muted-foreground line-through tabular-nums">{formatBDT(p.compareAtPrice)}</p>
                )}
              </TableCell>
              <TableCell>
                <StockCell stock={p.stock} variants={p.variantCount} />
              </TableCell>
              <TableCell>
                <ProductStatusBadge status={p.status} />
              </TableCell>
              <TableCell className="pr-4">
                <RowActions product={p} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p className="border-t px-4 py-3 text-xs text-muted-foreground">
        Showing {filtered.length} of {products.length} products
      </p>
    </div>
  );
}

function StockCell({ stock, variants }: { stock: number; variants: number }) {
  const pct = Math.min(100, (stock / 150) * 100);
  return (
    <div className="w-28 space-y-1">
      <p
        className={cn(
          "text-sm tabular-nums",
          stock === 0 ? "text-destructive" : stock <= LOW_STOCK ? "text-amber-700" : "text-foreground",
        )}
      >
        {stock === 0 ? "Out of stock" : `${stock} in stock`}
        {variants > 1 && <span className="text-muted-foreground"> · {variants}v</span>}
      </p>
      <div className="h-1 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full", stock === 0 ? "bg-destructive" : stock <= LOW_STOCK ? "bg-amber-500" : "bg-primary")}
          style={{ width: `${Math.max(pct, stock > 0 ? 4 : 0)}%` }}
        />
      </div>
    </div>
  );
}

function RowActions({ product }: { product: AdminProductRow }) {
  const [pending, startTransition] = useTransition();

  const setStatus = (status: ProductStatus, message: string) =>
    startTransition(async () => {
      try {
        await updateProductStatus({ id: product.id, status });
        toast.success(message);
      } catch {
        toast.error("Could not update the product");
      }
    });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" disabled={pending} aria-label={`Actions for ${product.name}`}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/admin/products/${product.id}/edit`}>
            <Pencil /> Edit
          </Link>
        </DropdownMenuItem>
        {product.status === "ACTIVE" && (
          <DropdownMenuItem asChild>
            <Link href={`/products/${product.slug}`} target="_blank">
              <ExternalLink /> View on store
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        {product.status === "ARCHIVED" ? (
          <DropdownMenuItem onSelect={() => setStatus("DRAFT", `“${product.name}” restored as draft`)}>
            <ArchiveRestore /> Restore as draft
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setStatus("ARCHIVED", `“${product.name}” archived — hidden from the store`)}
          >
            <Archive /> Archive
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
