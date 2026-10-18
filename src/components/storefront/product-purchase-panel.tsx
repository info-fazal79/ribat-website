"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Banknote, Minus, Plus, RefreshCw, ShoppingBag, Truck, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ProductArt } from "@/components/storefront/art";
import { StarRating } from "@/components/storefront/star-rating";
import { useVariantSelection } from "@/components/storefront/use-variant-selection";
import { FREE_DELIVERY_THRESHOLD } from "@/lib/cart/store";
import type { CatalogProduct } from "@/lib/catalog/types";
import { discountPercent, formatBDT } from "@/lib/money";
import { cn } from "@/lib/utils";

// Placeholder "views": same art with different crops until real photos exist.
const views = ["scale-100", "scale-[1.6] translate-y-[18%]", "scale-[1.35] -translate-y-[6%]"];

export function ProductPurchasePanel({ product }: { product: CatalogProduct }) {
  const router = useRouter();
  const sel = useVariantSelection(product);
  const [quantity, setQuantity] = useState(1);
  const [view, setView] = useState(0);

  const price = sel.priced?.price ?? product.price;
  const compareAt = sel.priced?.compareAtPrice ?? null;
  const discount = discountPercent(price, compareAt);
  const maxQty = Math.min(20, sel.variant?.stock ?? 20);

  return (
    <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
      <div className="flex flex-col-reverse gap-3 md:flex-row">
        <div className="flex gap-3 md:flex-col">
          {views.map((v, i) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(i)}
              aria-label={`View ${i + 1}`}
              className={cn("w-20 overflow-hidden border-2 transition", i === view ? "border-foreground" : "border-transparent")}
            >
              <div className={cn("transition-transform", v)}>
                <ProductArt kind={product.art} color={sel.swatch.hex} className="aspect-[3/4] w-full" />
              </div>
            </button>
          ))}
        </div>
        <div className="group/art relative flex-1 overflow-hidden">
          <div className={cn("origin-center transition-transform duration-700", views[view])}>
            <ProductArt kind={product.art} color={sel.swatch.hex} className="aspect-[3/4] w-full" />
          </div>
          {discount > 0 && (
            <span className="absolute top-4 left-4 bg-primary px-3 py-1.5 text-xs font-semibold tracking-wider text-primary-foreground">
              −{discount}% OFF
            </span>
          )}
        </div>
      </div>

      <div className="space-y-7 lg:sticky lg:top-40 lg:self-start">
        <div className="space-y-3">
          <p className="text-[11px] font-medium tracking-[0.3em] text-gold uppercase">
            {product.category?.name}
            {product.badge && ` · ${product.badge}`}
          </p>
          <h1 className="text-4xl leading-tight font-medium md:text-5xl">{product.name}</h1>
          {product.nameBn && <p className="font-bengali text-muted-foreground">{product.nameBn}</p>}
          {product.reviewCount > 0 && <StarRating rating={product.rating} count={product.reviewCount} size="md" />}
        </div>

        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-semibold">{formatBDT(price)}</span>
          {compareAt && compareAt > price && (
            <>
              <span className="text-lg text-muted-foreground line-through">{formatBDT(compareAt)}</span>
              <span className="bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">Save {formatBDT(compareAt - price)}</span>
            </>
          )}
        </div>

        {product.shortDescription && <p className="text-sm leading-relaxed text-muted-foreground">{product.shortDescription}</p>}

        {product.colors.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase">
              Colour: <span className="font-normal tracking-normal normal-case text-muted-foreground">{sel.color?.name}</span>
            </p>
            <div className="flex gap-2" role="radiogroup" aria-label="Colour">
              {product.colors.map((c, i) => (
                <button
                  key={c.name}
                  type="button"
                  role="radio"
                  aria-checked={i === sel.colorIndex}
                  aria-label={c.name}
                  onClick={() => sel.selectColor(i)}
                  className={cn(
                    "size-9 rounded-full border border-black/10 ring-offset-2 ring-offset-background transition",
                    i === sel.colorIndex ? "ring-1 ring-foreground" : "hover:ring-1 hover:ring-border",
                  )}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          </div>
        )}

        {sel.needsSize && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold tracking-[0.2em] uppercase">
                Size: <span className="font-normal tracking-normal text-muted-foreground">{sel.size ?? "Select"}</span>
              </p>
              <button type="button" className="text-xs underline underline-offset-4">
                Size guide
              </button>
            </div>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Size">
              {product.sizes.map((s) => {
                const available = sel.sizeInStock(s);
                return (
                  <button
                    key={s}
                    type="button"
                    role="radio"
                    aria-checked={sel.size === s}
                    disabled={!available}
                    title={available ? undefined : "Out of stock"}
                    onClick={() => sel.setSize(s)}
                    className={cn(
                      "h-11 min-w-14 border px-3 text-sm transition disabled:cursor-not-allowed disabled:text-muted-foreground/50 disabled:line-through",
                      sel.size === s ? "border-foreground bg-foreground text-background" : "enabled:hover:border-foreground",
                    )}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
            {sel.variant && sel.variant.stock <= 5 && (
              <p className="text-xs text-destructive">Only {sel.variant.stock} left in this size</p>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <div className="flex items-center border">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              aria-label="Decrease quantity"
              className="grid h-12 w-10 place-items-center hover:bg-muted"
            >
              <Minus className="size-3.5" />
            </button>
            <span className="w-8 text-center tabular-nums">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
              aria-label="Increase quantity"
              className="grid h-12 w-10 place-items-center hover:bg-muted"
            >
              <Plus className="size-3.5" />
            </button>
          </div>
          <Button
            variant="outline"
            disabled={sel.soldOut}
            className="h-12 flex-1 rounded-none text-xs tracking-[0.2em] uppercase"
            onClick={() => {
              if (sel.addToCart(quantity, true)) toast.success("Added to bag");
            }}
          >
            <ShoppingBag /> {sel.soldOut ? "Sold out" : "Add to Bag"}
          </Button>
        </div>
        <Button
          disabled={sel.soldOut}
          className="h-12 w-full rounded-none text-xs tracking-[0.2em] uppercase"
          onClick={() => {
            if (sel.addToCart(quantity, false)) router.push("/cart");
          }}
        >
          <Zap /> Buy Now — Cash on Delivery
        </Button>

        <ul className="grid gap-3 border-y py-5 text-sm">
          <li className="flex items-center gap-3">
            <Truck className="size-4 text-primary" /> Free delivery over {formatBDT(FREE_DELIVERY_THRESHOLD)} · 2–4 days
          </li>
          <li className="flex items-center gap-3">
            <RefreshCw className="size-4 text-primary" /> 7 days easy exchange
          </li>
          <li className="flex items-center gap-3">
            <Banknote className="size-4 text-primary" /> Cash on Delivery, bKash & Nagad
          </li>
        </ul>

        <div className="space-y-4 text-sm">
          {product.description && (
            <Detail title="বিবরণ">
              {/* Plain text for now; sanitize before switching to rich-text HTML. */}
              <p className="font-bengali leading-relaxed whitespace-pre-line">{product.description}</p>
            </Detail>
          )}
          {product.fabricCare && (
            <Detail title="Fabric & Care">
              <p className="whitespace-pre-line">{product.fabricCare}</p>
            </Detail>
          )}
          <Detail title="SKU">
            <p className="font-mono text-xs">{sel.variant?.sku ?? product.sku}</p>
          </Detail>
        </div>
      </div>
    </div>
  );
}

function Detail({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details open className="group border-b pb-4">
      <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-semibold tracking-[0.2em] uppercase">
        <span className={/[ঀ-৿]/.test(title) ? "font-bengali tracking-normal" : undefined}>{title}</span>
        <Plus className="size-3.5 transition-transform group-open:rotate-45" />
      </summary>
      <div className="mt-3 space-y-1">{children}</div>
    </details>
  );
}
