"use client";

import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ProductArt } from "@/components/storefront/art";
import { FREE_DELIVERY_THRESHOLD, cart, useCart, type CartLine } from "@/lib/cart/store";
import { formatBDT } from "@/lib/money";

export function CartDrawer() {
  const { lines, open, count, subtotal } = useCart();
  const remaining = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);
  const progress = Math.min(100, (subtotal / FREE_DELIVERY_THRESHOLD) * 100);

  return (
    <Sheet open={open} onOpenChange={cart.setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Cart, ${count} items`} className="relative">
          <ShoppingBag />
          {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 grid size-4 place-items-center rounded-full bg-primary text-[9px] font-semibold text-primary-foreground">
              {count}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full gap-0 sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle className="font-heading text-2xl font-medium">Your Bag ({count})</SheetTitle>
        </SheetHeader>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <ShoppingBag className="size-10 text-muted-foreground" strokeWidth={1} />
            <p className="text-sm text-muted-foreground">Your bag is empty.</p>
            <Button asChild className="rounded-none px-6 text-xs tracking-widest uppercase" onClick={() => cart.setOpen(false)}>
              <Link href="/products">Continue Shopping</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="border-b px-4 py-3">
              <p className="text-xs">
                {remaining > 0 ? (
                  <>
                    Add <strong>{formatBDT(remaining)}</strong> more for <strong>free delivery</strong>
                  </>
                ) : (
                  <strong className="text-primary">You&apos;ve unlocked free delivery 🎉</strong>
                )}
              </p>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
            <ul className="flex-1 divide-y overflow-y-auto px-4">
              {lines.map((line) => (
                <CartLineItem key={line.key} line={line} />
              ))}
            </ul>
            <SheetFooter className="border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-lg font-semibold">{formatBDT(subtotal)}</span>
              </div>
              <p className="text-xs text-muted-foreground">Delivery calculated at checkout.</p>
              <Button asChild className="h-12 rounded-none text-xs tracking-[0.2em] uppercase" onClick={() => cart.setOpen(false)}>
                <Link href="/cart">View Bag & Checkout</Link>
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

export function CartLineItem({ line }: { line: CartLine }) {
  return (
    <li className="flex gap-4 py-4">
      <Link href={`/products/${line.slug}`} className="w-20 shrink-0" onClick={() => cart.setOpen(false)}>
        <ProductArt kind={line.art} color={line.color.hex} className="aspect-[3/4] w-full" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm leading-snug font-medium">{line.name}</p>
          <button
            type="button"
            onClick={() => cart.remove(line.key)}
            aria-label={`Remove ${line.name}`}
            className="text-muted-foreground transition hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          {[line.color.name, line.size && `Size ${line.size}`].filter(Boolean).join(" · ")}
        </p>
        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center border">
            <button
              type="button"
              onClick={() => cart.setQuantity(line.key, line.quantity - 1)}
              aria-label="Decrease quantity"
              className="grid size-8 place-items-center hover:bg-muted"
            >
              <Minus className="size-3" />
            </button>
            <span className="w-8 text-center text-sm tabular-nums">{line.quantity}</span>
            <button
              type="button"
              onClick={() => cart.setQuantity(line.key, line.quantity + 1)}
              aria-label="Increase quantity"
              className="grid size-8 place-items-center hover:bg-muted"
            >
              <Plus className="size-3" />
            </button>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold">{formatBDT(line.price * line.quantity)}</p>
            {line.compareAtPrice && (
              <p className="text-xs text-muted-foreground line-through">{formatBDT(line.compareAtPrice * line.quantity)}</p>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}
