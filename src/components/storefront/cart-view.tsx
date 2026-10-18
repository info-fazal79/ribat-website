"use client";

import Link from "next/link";
import { Lock, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CartLineItem } from "@/components/storefront/cart-drawer";
import { FREE_DELIVERY_THRESHOLD, useCart } from "@/lib/cart/store";
import { formatBDT } from "@/lib/money";

// Display estimate only; the server picks the zone fee at checkout.
const DHAKA_DELIVERY = 70;

export function CartView() {
  const { lines, subtotal, savings, count } = useCart();

  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center gap-5 py-16 text-center">
        <ShoppingBag className="size-12 text-muted-foreground" strokeWidth={1} />
        <p className="text-muted-foreground">Your bag is empty.</p>
        <Button asChild className="h-12 rounded-none px-8 text-xs tracking-[0.2em] uppercase">
          <Link href="/products">Continue Shopping</Link>
        </Button>
      </div>
    );
  }

  const delivery = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DHAKA_DELIVERY;

  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_380px]">
      <ul className="divide-y border-y">
        {lines.map((line) => (
          <CartLineItem key={line.key} line={line} />
        ))}
      </ul>
      <aside className="h-fit space-y-4 bg-secondary/60 p-6">
        <h2 className="text-2xl font-medium">Order Summary</h2>
        <dl className="space-y-2 text-sm">
          <Row label={`Subtotal (${count} items)`} value={formatBDT(subtotal)} />
          {savings > 0 && <Row label="You save" value={`−${formatBDT(savings)}`} className="text-primary" />}
          <Row label="Delivery (Inside Dhaka)" value={delivery === 0 ? "Free" : formatBDT(delivery)} />
        </dl>
        <div className="flex items-center justify-between border-t pt-4">
          <span className="text-sm font-medium">Estimated Total</span>
          <span className="text-2xl font-semibold">{formatBDT(subtotal + delivery)}</span>
        </div>
        {/* TODO(checkout): one-page COD checkout using checkoutSchema + server-side totals. */}
        <Button disabled className="h-12 w-full rounded-none text-xs tracking-[0.2em] uppercase">
          <Lock /> Checkout — coming soon
        </Button>
        <p className="text-center font-bengali text-xs text-muted-foreground">ক্যাশ অন ডেলিভারি · বিকাশ · নগদ</p>
      </aside>
    </div>
  );
}

function Row({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={`flex justify-between ${className ?? ""}`}>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
