"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Heart, ShoppingBag, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ProductArt } from "@/components/storefront/art";
import { StarRating } from "@/components/storefront/star-rating";
import { cart } from "@/lib/cart/store";
import { getCategory, type MockProduct } from "@/lib/mock/catalog";
import { discountPercent, formatBDT } from "@/lib/money";
import { cn } from "@/lib/utils";

export function ProductCard({ product }: { product: MockProduct }) {
  const router = useRouter();
  const [colorIndex, setColorIndex] = useState(0);
  const [size, setSize] = useState<string | null>(null);
  const [sizeError, setSizeError] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);

  const color = product.colors[colorIndex];
  const discount = discountPercent(product.price, product.compareAtPrice);
  const href = `/products/${product.slug}`;
  const needsSize = product.sizes.length > 0;

  function addToCart(open: boolean) {
    if (needsSize && !size) {
      setSizeError(true);
      toast.error("Please select a size first");
      return false;
    }
    cart.add(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        category: product.category,
        color,
        size,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
      },
      1,
      { open },
    );
    return true;
  }

  return (
    <article className="group/card flex flex-col">
      <div className="group/art relative">
        <Link href={href} aria-label={product.name} className="block">
          <ProductArt category={product.category} color={color.hex} className="aspect-[3/4] w-full" />
        </Link>

        <div className="pointer-events-none absolute top-3 left-3 flex flex-col items-start gap-1.5">
          {discount > 0 && (
            <span className="bg-primary px-2 py-1 text-[10px] font-semibold tracking-wider text-primary-foreground">
              −{discount}% OFF
            </span>
          )}
          {product.badge && (
            <span className="bg-background/90 px-2 py-1 text-[10px] font-medium tracking-[0.15em] uppercase backdrop-blur">
              {product.badge}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            setWishlisted((w) => !w);
            toast.success(wishlisted ? "Removed from wishlist" : "Saved to wishlist");
          }}
          aria-pressed={wishlisted}
          aria-label="Save to wishlist"
          className="absolute top-3 right-3 grid size-9 place-items-center rounded-full bg-background/85 backdrop-blur transition hover:bg-background"
        >
          <Heart className={cn("size-4", wishlisted && "fill-destructive text-destructive")} />
        </button>

        {product.stock > 0 && product.stock <= 10 && (
          <span className="absolute bottom-3 left-3 bg-background/90 px-2 py-1 text-[10px] font-medium text-destructive backdrop-blur">
            Only {product.stock} left
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 pt-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-medium tracking-[0.2em] text-muted-foreground uppercase">
            {getCategory(product.category)?.name}
          </p>
          <StarRating rating={product.rating} count={product.reviewCount} />
        </div>

        <Link href={href} className="group/title">
          <h3 className="font-sans text-sm leading-snug font-medium group-hover/title:underline group-hover/title:underline-offset-4">
            {product.name}
          </h3>
          <p className="font-bengali text-xs text-muted-foreground">{product.nameBn}</p>
        </Link>

        <div className="flex items-baseline gap-2">
          <span className="text-base font-semibold">{formatBDT(product.price)}</span>
          {product.compareAtPrice && (
            <>
              <span className="text-xs text-muted-foreground line-through">{formatBDT(product.compareAtPrice)}</span>
              <span className="text-[11px] font-medium text-primary">
                Save {formatBDT(product.compareAtPrice - product.price)}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Colour">
          {product.colors.map((c, i) => (
            <button
              key={c.name}
              type="button"
              role="radio"
              aria-checked={i === colorIndex}
              aria-label={c.name}
              title={c.name}
              onClick={() => setColorIndex(i)}
              className={cn(
                "size-5 rounded-full border border-black/10 ring-offset-2 ring-offset-background transition",
                i === colorIndex ? "ring-1 ring-foreground" : "hover:ring-1 hover:ring-border",
              )}
              style={{ backgroundColor: c.hex }}
            />
          ))}
          <span className="ml-1 text-xs text-muted-foreground">{color.name}</span>
        </div>

        {needsSize && (
          <div
            className={cn("flex flex-wrap gap-1 rounded-sm", sizeError && "ring-1 ring-destructive/60 ring-offset-2 ring-offset-background")}
            role="radiogroup"
            aria-label="Size"
          >
            {product.sizes.map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={size === s}
                onClick={() => {
                  setSize(s);
                  setSizeError(false);
                }}
                className={cn(
                  "h-7 min-w-9 border px-2 text-[11px] font-medium transition",
                  size === s
                    ? "border-foreground bg-foreground text-background"
                    : "border-border hover:border-foreground",
                )}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="mt-auto grid grid-cols-2 gap-2 pt-2">
          <Button
            variant="outline"
            className="h-10 rounded-none text-xs tracking-wider uppercase"
            onClick={() => {
              if (addToCart(true)) toast.success(`${product.name} added to bag`);
            }}
          >
            <ShoppingBag /> Quick Add
          </Button>
          <Button
            className="h-10 rounded-none text-xs tracking-wider uppercase"
            onClick={() => {
              if (addToCart(false)) router.push("/cart");
            }}
          >
            <Zap /> Buy Now
          </Button>
        </div>
      </div>
    </article>
  );
}
