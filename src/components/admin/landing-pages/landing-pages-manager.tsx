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
  Video,
} from "lucide-react";
import { toast } from "sonner";
import {
  createLandingPage,
  duplicateLandingPage,
  setLandingPageStatus,
} from "@/app/(admin)/admin/landing-pages/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LandingStatusBadge, StatusPill } from "@/components/admin/status-badge";
import { StatCard } from "@/components/admin/page-header";
import type { AdminLandingPage } from "@/lib/admin/types";
import { formatCompact, formatDate } from "@/lib/format";
import { landingTemplates, type LandingTemplate } from "@/lib/landing/templates";
import { formatBDT } from "@/lib/money";
import { cn } from "@/lib/utils";

const templateIcons: Record<LandingTemplate, typeof FileText> = {
  "bengali-longform": FileText,
  minimal: ShoppingCart,
  "video-first": Video,
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");

type ProductOption = { id: string; name: string; price: number };

export function LandingPagesManager({ pages, products }: { pages: AdminLandingPage[]; products: ProductOption[] }) {
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
          <CreateLandingDialog products={products} />
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
                        <p className="font-medium">{p.title}</p>
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
        <DropdownMenuItem onSelect={() => toast.info("The section editor is the next milestone.")}>
          <Pencil /> Edit sections
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

function CreateLandingDialog({ products }: { products: ProductOption[] }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [productId, setProductId] = useState("");
  const [template, setTemplate] = useState<LandingTemplate>("bengali-longform");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function reset() {
    setTitle("");
    setSlug("");
    setSlugTouched(false);
    setProductId("");
    setTemplate("bengali-longform");
    setError(null);
  }

  function submit() {
    startTransition(async () => {
      const result = await createLandingPage({ title, slug, productId, template });
      if (!result.ok) return setError(result.message);
      toast.success(`“${title}” created as a draft`);
      setOpen(false);
      reset();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus /> New landing page
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-sans text-lg">New landing page</DialogTitle>
          <DialogDescription>One-page checkout for a single product — ideal for Facebook & TikTok ads.</DialogDescription>
        </DialogHeader>
        <form
          id="create-lp"
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="lp-title">Page name</Label>
            <Input
              id="lp-title"
              value={title}
              placeholder="e.g. Royal Oud — Eid Offer"
              onChange={(e) => {
                setTitle(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lp-slug">URL</Label>
            <div className="flex items-center rounded-lg border focus-within:ring-3 focus-within:ring-ring/50">
              <span className="pl-2.5 text-sm text-muted-foreground">/lp/</span>
              <input
                id="lp-slug"
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value);
                }}
                className="h-8 flex-1 bg-transparent pr-2.5 font-mono text-sm outline-none"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Product</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger className="w-full" aria-label="Product">
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} · {formatBDT(p.price)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Template</Label>
            <div className="grid gap-2">
              {(Object.keys(landingTemplates) as LandingTemplate[]).map((key) => {
                const t = landingTemplates[key];
                const Icon = templateIcons[key];
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={template === key}
                    onClick={() => setTemplate(key)}
                    className={cn(
                      "flex items-start gap-3 rounded-lg border p-3 text-left transition",
                      template === key ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-foreground/30",
                    )}
                  >
                    <Icon className={cn("mt-0.5 size-4", template === key ? "text-primary" : "text-muted-foreground")} />
                    <span>
                      <span className="block text-sm font-medium">{t.label}</span>
                      <span className="block text-xs text-muted-foreground">{t.body}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" form="create-lp" disabled={pending}>
            {pending && <Loader2 className="animate-spin" />}
            Create draft
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
