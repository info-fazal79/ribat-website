"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  Archive,
  BarChart3,
  Copy,
  ExternalLink,
  Eye,
  FileText,
  Link2,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Rocket,
  ShoppingCart,
} from "lucide-react";
import { toast } from "sonner";
import { duplicateLandingPage, setLandingPageStatus } from "@/app/(admin)/admin/landing-pages/actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LandingStatusBadge, StatusPill } from "@/components/admin/status-badge";
import { StatCard } from "@/components/admin/page-header";
import type { AdminLandingPage } from "@/lib/admin/types";
import { formatCompact, formatDate } from "@/lib/format";
import { formatBDT } from "@/lib/money";
import { cn } from "@/lib/utils";

export function LandingPagesManager({ pages }: { pages: AdminLandingPage[] }) {
  const [filter, setFilter] = useState<"ALL" | AdminLandingPage["status"]>("ALL");

  const live = pages.filter((p) => p.status === "PUBLISHED");
  const views = pages.reduce((n, p) => n + p.viewCount, 0);
  const conversions = pages.reduce((n, p) => n + p.conversionCount, 0);
  const revenue = pages.reduce((n, p) => n + p.revenue, 0);
  const visible = filter === "ALL" ? pages : pages.filter((p) => p.status === filter);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Live pages" value={String(live.length)} hint={`${pages.length} total`} icon={<Rocket className="size-4" />} />
        <StatCard label="Views" value={formatCompact(views)} hint="All time" icon={<Eye className="size-4" />} />
        <StatCard
          label="Conversion rate"
          value={`${views ? ((conversions / views) * 100).toFixed(1) : "0"}%`}
          hint={`${conversions.toLocaleString("en-IN")} conversions`}
          icon={<BarChart3 className="size-4" />}
        />
        <StatCard label="Revenue" value={formatBDT(revenue)} hint="Orders placed via landing pages" icon={<ShoppingCart className="size-4" />} />
      </div>

      <div className="rounded-xl border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b p-3">
          <div className="flex gap-1">
            {(["ALL", "PUBLISHED", "DRAFT", "ARCHIVED"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setFilter(s)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm transition",
                  filter === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
                )}
              >
                {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
          <Button asChild>
            <Link href="/admin/landing-pages/new">
              <Plus /> New landing page
            </Link>
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Page</TableHead>
              <TableHead>Product & offers</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Views</TableHead>
              <TableHead>Conversion</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead className="w-12 pr-4" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                  No landing pages here yet.
                </TableCell>
              </TableRow>
            )}
            {visible.map((p) => {
              const rate = p.viewCount ? (p.conversionCount / p.viewCount) * 100 : 0;
              return (
                <TableRow key={p.id}>
                  <TableCell className="pl-4">
                    <div className="flex items-start gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                        <FileText className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <Link href={`/admin/landing-pages/${p.id}/edit`} className="font-medium hover:underline">
                          {p.title}
                        </Link>
                        <p className="font-mono text-[11px] text-muted-foreground">/lp/{p.slug}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {p.sectionCount} sections · updated {formatDate(p.updatedAt)}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="max-w-52 truncate text-sm">{p.productName}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {p.offers.map((o) => (
                        <span key={o.label} className="rounded bg-muted px-1.5 py-0.5 text-[10px] tabular-nums">
                          {o.quantity}× {formatBDT(o.price)}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col items-start gap-1">
                      <LandingStatusBadge status={p.status} />
                      {p.facebookPixel && (
                        <StatusPill tone="blue" dot={false}>
                          FB Pixel
                        </StatusPill>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{p.viewCount.toLocaleString("en-IN")}</TableCell>
                  <TableCell>
                    <div className="w-28 space-y-1">
                      <p className="text-sm tabular-nums">
                        {rate.toFixed(1)}% <span className="text-xs text-muted-foreground">· {p.conversionCount}</span>
                      </p>
                      <div className="h-1 overflow-hidden rounded-full bg-muted">
                        <div className="h-full bg-primary" style={{ width: `${Math.min(100, rate * 15)}%` }} />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{formatBDT(p.revenue)}</TableCell>
                  <TableCell className="pr-4">
                    <RowActions page={p} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function RowActions({ page }: { page: AdminLandingPage }) {
  const [pending, startTransition] = useTransition();

  const run = (action: () => Promise<{ ok: true } | { ok: false; message: string }>, success: string) =>
    startTransition(async () => {
      try {
        const result = await action();
        if (result.ok) toast.success(success);
        else toast.error(result.message);
      } catch {
        toast.error("Something went wrong. Please try again.");
      }
    });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" disabled={pending} aria-label={`Actions for ${page.title}`}>
          {pending ? <Loader2 className="animate-spin" /> : <MoreHorizontal />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/admin/landing-pages/${page.id}/edit`}>
            <Pencil /> Edit in builder
          </Link>
        </DropdownMenuItem>
        {page.status === "PUBLISHED" && (
          <DropdownMenuItem asChild>
            <Link href={`/lp/${page.slug}`} target="_blank">
              <ExternalLink /> View live
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onSelect={() => {
            void navigator.clipboard?.writeText(`${window.location.origin}/lp/${page.slug}`);
            toast.success("Link copied");
          }}
        >
          <Link2 /> Copy link
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => run(() => duplicateLandingPage(page.id), "Duplicated as a draft")}>
          <Copy /> Duplicate
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {page.status !== "PUBLISHED" ? (
          <DropdownMenuItem onSelect={() => run(() => setLandingPageStatus({ id: page.id, status: "PUBLISHED" }), "Published")}>
            <Rocket /> Publish
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onSelect={() => run(() => setLandingPageStatus({ id: page.id, status: "DRAFT" }), "Unpublished")}>
            <Eye /> Unpublish
          </DropdownMenuItem>
        )}
        {page.status !== "ARCHIVED" && (
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => run(() => setLandingPageStatus({ id: page.id, status: "ARCHIVED" }), "Archived")}
          >
            <Archive /> Archive
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
