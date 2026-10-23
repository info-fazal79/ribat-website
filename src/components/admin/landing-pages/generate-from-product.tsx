"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ImageOff, Loader2, Search, Zap } from "lucide-react";
import { toast } from "sonner";
import { generateLandingFromProduct } from "@/app/(admin)/admin/landing-pages/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatBDT } from "@/lib/money";
import { cn } from "@/lib/utils";

type ProductOption = {
  id: string;
  name: string;
  nameBn: string | null;
  type: "SIMPLE" | "VARIABLE";
  price: number;
  image: string | null;
  variantCount: number;
};

/** Generates a landing page for a product and opens it in the builder. */
export function useGenerateLanding() {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const generate = (productId: string) => {
    setPendingId(productId);
    startTransition(async () => {
      const result = await generateLandingFromProduct(productId);
      if (!result.ok) {
        setPendingId(null);
        toast.error(result.message);
        return;
      }
      toast.success(`Landing page generated at /lp/${result.slug} — opening the builder`);
      router.push(`/admin/landing-pages/${result.id}/edit`);
    });
  };
  return { generate, pendingId };
}

/** "⚡ Generate from Product" button + searchable product picker. */
export function GenerateFromProductButton({ products }: { products: ProductOption[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { generate, pendingId } = useGenerateLanding();

  const q = query.trim().toLowerCase();
  const matches = q ? products.filter((p) => p.name.toLowerCase().includes(q) || p.nameBn?.includes(query.trim())) : products;

  return (
    <>
      <Button onClick={() => setOpen(true)} className="bg-gradient-to-r from-[#b8862f] to-[#d8c08a] text-[#13231e] shadow-sm hover:opacity-90">
        <Zap className="fill-current" /> Generate from Product
      </Button>
      <Dialog open={open} onOpenChange={(o) => !pendingId && setOpen(o)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Generate a landing page</DialogTitle>
            <DialogDescription>
              Pick a product — we build the hero, benefits, gallery, 1/2/3-piece offers, colour &amp; size checkout, reviews and
              FAQ, then open it in the builder as a draft.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 rounded-md border px-3">
            <Search className="size-4 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search published products…"
              className="h-9 w-full bg-transparent text-sm outline-none"
            />
          </div>
          <ul className="-mx-1 max-h-[50vh] space-y-1 overflow-y-auto px-1">
            {matches.length === 0 && (
              <li className="py-8 text-center text-sm text-muted-foreground">
                {products.length ? "No products match." : "No published products yet."}
              </li>
            )}
            {matches.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  disabled={!!pendingId || p.variantCount === 0}
                  onClick={() => generate(p.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border p-2 text-left transition hover:border-primary hover:bg-primary/5 disabled:opacity-50",
                    pendingId === p.id && "border-primary bg-primary/5",
                  )}
                >
                  <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-md border bg-muted">
                    {p.image ? (
                      // eslint-disable-next-line @next/next/no-img-element -- product asset
                      <img src={p.image} alt="" className="size-full object-cover" />
                    ) : (
                      <ImageOff className="size-4 text-muted-foreground" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{p.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {formatBDT(p.price)} · {p.type === "VARIABLE" ? `Variable · ${p.variantCount} variants` : "Single product"}
                      {p.variantCount === 0 && " · no active variants"}
                    </span>
                  </span>
                  {pendingId === p.id ? <Loader2 className="size-4 animate-spin text-primary" /> : <Zap className="size-4 text-muted-foreground" />}
                </button>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </>
  );
}
