"use client";

import { useMemo, useState, useTransition } from "react";
import { Download, MapPin, Phone, Printer, Search, StickyNote, Truck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  OrderStatusBadge,
  PaymentBadge,
  SourceBadge,
  paymentMethodLabel,
} from "@/components/admin/status-badge";
import { OrderStatus } from "@/generated/prisma/enums";
import { updateOrderStatus } from "@/app/(admin)/admin/orders/actions";
import type { AdminOrder } from "@/lib/admin/types";
import { formatDateTime } from "@/lib/format";
import { formatBDT } from "@/lib/money";
import { cn } from "@/lib/utils";

const statuses = Object.values(OrderStatus);
const label = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

export function OrdersTable({ orders }: { orders: AdminOrder[] }) {
  const [status, setStatus] = useState<OrderStatus | "ALL">("ALL");
  const [query, setQuery] = useState("");
  const [payment, setPayment] = useState("all");
  const [source, setSource] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: orders.length };
    for (const o of orders) c[o.status] = (c[o.status] ?? 0) + 1;
    return c;
  }, [orders]);

  const q = query.trim().toLowerCase();
  const filtered = orders.filter(
    (o) =>
      (status === "ALL" || o.status === status) &&
      (payment === "all" || o.paymentMethod === payment) &&
      (source === "all" || o.source === source) &&
      (!q ||
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.includes(q) ||
        o.district.toLowerCase().includes(q)),
  );

  const open = orders.find((o) => o.id === openId) ?? null;

  return (
    <>
      <div className="rounded-xl border bg-card">
        <div className="flex gap-1 overflow-x-auto border-b p-3">
          {(["ALL", ...statuses] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm whitespace-nowrap transition",
                status === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
              )}
            >
              {s === "ALL" ? "All orders" : label(s)}
              <span className="ml-1.5 text-xs opacity-70">{counts[s] ?? 0}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 border-b p-3">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search order #, name, phone or district…"
              className="max-w-sm pl-8"
              aria-label="Search orders"
            />
          </div>
          <Select value={payment} onValueChange={setPayment}>
            <SelectTrigger className="w-40" aria-label="Payment method">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All payments</SelectItem>
              {Object.entries(paymentMethodLabel).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={source} onValueChange={setSource}>
            <SelectTrigger className="w-40" aria-label="Order source">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources</SelectItem>
              <SelectItem value="STOREFRONT">Storefront</SelectItem>
              <SelectItem value="LANDING_PAGE">Landing page</SelectItem>
              <SelectItem value="ADMIN">Manual</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => toast.info("CSV export is coming soon.")}>
            <Download /> Export
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Items</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Source</TableHead>
              <TableHead className="pr-4">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                  No orders match these filters.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((o) => (
              <TableRow
                key={o.id}
                onClick={() => setOpenId(o.id)}
                className="cursor-pointer"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && setOpenId(o.id)}
              >
                <TableCell className="pl-4">
                  <p className="font-mono text-sm font-medium">{o.orderNumber}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(o.createdAt)}</p>
                </TableCell>
                <TableCell>
                  <p className="font-medium">{o.customerName}</p>
                  <p className="text-xs text-muted-foreground">
                    {o.customerPhone} · {o.district}
                  </p>
                </TableCell>
                <TableCell>
                  <p className="max-w-56 truncate text-sm">{o.items[0].name}</p>
                  <p className="text-xs text-muted-foreground">
                    {o.items.reduce((n, i) => n + i.quantity, 0)} item(s)
                    {o.items.length > 1 && ` · +${o.items.length - 1} more`}
                  </p>
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">{formatBDT(o.total)}</TableCell>
                <TableCell>
                  <PaymentBadge status={o.paymentStatus} method={o.paymentMethod} />
                </TableCell>
                <TableCell>
                  <SourceBadge source={o.source} />
                </TableCell>
                <TableCell className="pr-4">
                  <OrderStatusBadge status={o.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <p className="border-t px-4 py-3 text-xs text-muted-foreground">
          Showing {filtered.length} of {orders.length} orders
        </p>
      </div>

      <Sheet open={!!open} onOpenChange={(v) => !v && setOpenId(null)}>
        <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-lg">
          {open && <OrderDetail key={open.id} order={open} />}
        </SheetContent>
      </Sheet>
    </>
  );
}

function OrderDetail({ order }: { order: AdminOrder }) {
  const canShip = order.status === "PENDING" || order.status === "PROCESSING";
  const [pending, startTransition] = useTransition();

  function changeStatus(status: OrderStatus) {
    startTransition(async () => {
      try {
        await updateOrderStatus({ id: order.id, status });
        toast.success(`${order.orderNumber} marked ${label(status)}`);
      } catch {
        toast.error("Could not update the order status");
      }
    });
  }

  function book(courier: "Steadfast" | "Pathao") {
    // TODO(admin): server action → src/server/integrations/courier, then store courierName/trackingCode.
    toast.info(`${courier} isn't connected yet`, { description: "Add the API keys in .env and implement the courier client." });
  }

  return (
    <>
      <SheetHeader className="border-b">
        <div className="flex items-center gap-2">
          <SheetTitle className="font-mono text-lg">{order.orderNumber}</SheetTitle>
          <OrderStatusBadge status={order.status} />
        </div>
        <SheetDescription>
          {formatDateTime(order.createdAt)} · <SourceBadge source={order.source} />
          {order.landingPage && <span className="ml-1 text-xs">via “{order.landingPage}”</span>}
        </SheetDescription>
      </SheetHeader>

      <div className="space-y-6 p-4">
        <section className="space-y-2">
          <h3 className="font-sans text-xs font-semibold tracking-wide text-muted-foreground uppercase">Update status</h3>
          <div className="flex gap-2">
            <Select value={order.status} disabled={pending} onValueChange={(v) => changeStatus(v as OrderStatus)}>
              <SelectTrigger className="flex-1" aria-label="Order status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((s) => (
                  <SelectItem key={s} value={s}>
                    {label(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer /> Invoice
            </Button>
          </div>
        </section>

        <section className="space-y-2 rounded-lg border p-4">
          <h3 className="font-sans text-xs font-semibold tracking-wide text-muted-foreground uppercase">Customer</h3>
          <p className="font-medium">{order.customerName}</p>
          <a href={`tel:${order.customerPhone}`} className="flex items-center gap-2 text-sm text-primary hover:underline">
            <Phone className="size-3.5" /> {order.customerPhone}
          </a>
          <p className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 size-3.5 shrink-0" />
            {order.addressLine}, {order.area}, {order.district}
          </p>
          {order.customerNote && (
            <p className="flex items-start gap-2 rounded-md bg-amber-50 p-2 text-sm text-amber-900">
              <StickyNote className="mt-0.5 size-3.5 shrink-0" /> {order.customerNote}
            </p>
          )}
        </section>

        <section className="space-y-3">
          <h3 className="font-sans text-xs font-semibold tracking-wide text-muted-foreground uppercase">Items</h3>
          <ul className="divide-y rounded-lg border">
            {order.items.map((i) => (
              <li key={i.id} className="flex justify-between gap-4 p-3 text-sm">
                <div className="min-w-0">
                  <p className="font-medium">{i.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {i.variant} · <span className="font-mono">{i.sku}</span>
                  </p>
                </div>
                <div className="shrink-0 text-right tabular-nums">
                  <p>{formatBDT(i.unitPrice * i.quantity)}</p>
                  <p className="text-xs text-muted-foreground">
                    {i.quantity} × {formatBDT(i.unitPrice)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <dl className="space-y-1 text-sm">
            <SummaryRow label="Subtotal" value={formatBDT(order.subtotal)} />
            <SummaryRow label="Delivery" value={order.shippingFee ? formatBDT(order.shippingFee) : "Free"} />
            {order.discountTotal > 0 && <SummaryRow label="Discount" value={`−${formatBDT(order.discountTotal)}`} />}
            <Separator className="my-2" />
            <SummaryRow label="Total" value={formatBDT(order.total)} strong />
            <SummaryRow
              label={paymentMethodLabel[order.paymentMethod]}
              value={order.paymentStatus === "PAID" ? "Paid" : order.paymentMethod === "COD" ? `Collect ${formatBDT(order.total)}` : label(order.paymentStatus)}
            />
          </dl>
        </section>

        <section className="space-y-3 rounded-lg border p-4">
          <h3 className="flex items-center gap-2 font-sans text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            <Truck className="size-3.5" /> Fulfilment
          </h3>
          {order.courierName ? (
            <p className="text-sm">
              {order.courierName} · <span className="font-mono">{order.trackingCode}</span>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Not booked with a courier yet.</p>
          )}
          {canShip && (
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={() => book("Steadfast")}>Send to Steadfast</Button>
              <Button variant="outline" onClick={() => book("Pathao")}>
                Send to Pathao
              </Button>
            </div>
          )}
        </section>
      </div>
    </>
  );
}

function SummaryRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={cn("flex justify-between", strong ? "text-base font-semibold" : "text-muted-foreground")}>
      <dt>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
