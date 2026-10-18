"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Archive,
  BarChart3,
  Copy,
  ExternalLink,
  Eye,
  FileText,
  Link2,
  MoreHorizontal,
  Pencil,
  Plus,
  Rocket,
  ShoppingCart,
  Video,
} from "lucide-react";
import { toast } from "sonner";
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
import type { MockLandingPage } from "@/lib/mock/admin";
import type { MockProduct } from "@/lib/mock/catalog";
import { formatCompact, formatDate } from "@/lib/format";
import { formatBDT } from "@/lib/money";
import { cn } from "@/lib/utils";

const templates = {
  "bengali-longform": { label: "Bengali long-form", icon: FileText, body: "Hero, benefits, reviews, FAQ, countdown & checkout." },
  minimal: { label: "Minimal", icon: ShoppingCart, body: "Product hero + offers + checkout. Fast to launch." },
  "video-first": { label: "Video first", icon: Video, body: "Facebook-ad style video hero with sticky order button." },
} as const;

type Template = keyof typeof templates;

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");

export function LandingPagesManager({
  pages: initial,
  products,
}: {
  pages: MockLandingPage[];
  products: Pick<MockProduct, "id" | "name" | "price" | "compareAtPrice">[];
}) {
  const [pages, setPages] = useState(initial);
  const [filter, setFilter] = useState<"ALL" | MockLandingPage["status"]>("ALL");

  const live = pages.filter((p) => p.status === "PUBLISHED");
  const views = pages.reduce((n, p) => n + p.viewCount, 0);
  const conversions = pages.reduce((n, p) => n + p.conversionCount, 0);
  const revenue = pages.reduce((n, p) => n + p.revenue, 0);
  const visible = filter === "ALL" ? pages : pages.filter((p) => p.status === filter);

  // TODO(admin): server actions on the landing-page service; revalidate landingPageTag(slug) on publish.
  const update = (id: string, patch: Partial<MockLandingPage>) =>
    setPages((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Live pages" value={String(live.length)} hint={`${pages.length} total`} icon={<Rocket className="size-4" />} />
        <StatCard label="Views" value={formatCompact(views)} hint="All time" icon={<Eye className="size-4" />} />
        <StatCard
          label="Conversion rate"
          value={`${views ? ((conversions / views) * 100).toFixed(1) : "0"}%`}
          hint={`${conversions.toLocaleString("en-IN")} orders`}
          icon={<BarChart3 className="size-4" />}
        />
        <StatCard label="Revenue" value={formatBDT(revenue)} hint="From landing page orders" icon={<ShoppingCart className="size-4" />} />
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
          <CreateLandingDialog
            products={products}
            onCreate={(page) => {
              setPages((ps) => [page, ...ps]);
              toast.success(`“${page.title}” created as draft (demo)`);
            }}
            existingSlugs={pages.map((p) => p.slug)}
          />
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
              const Icon = templates[p.template].icon;
              return (
                <TableRow key={p.id}>
                  <TableCell className="pl-4">
                    <div className="flex items-start gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                        <Icon className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium">{p.title}</p>
                        <p className="font-mono text-[11px] text-muted-foreground">/lp/{p.slug}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {templates[p.template].label} · updated {formatDate(p.updatedAt)}
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
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${p.title}`}>
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => toast.info("The block editor is the next milestone.")}>
                          <Pencil /> Edit sections
                        </DropdownMenuItem>
                        {p.status === "PUBLISHED" && (
                          <DropdownMenuItem asChild>
                            <Link href={`/lp/${p.slug}`} target="_blank">
                              <ExternalLink /> View live
                            </Link>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onSelect={() => {
                            void navigator.clipboard?.writeText(`${window.location.origin}/lp/${p.slug}`);
                            toast.success("Link copied");
                          }}
                        >
                          <Link2 /> Copy link
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => {
                            let slug = `${p.slug}-copy`;
                            for (let n = 2; pages.some((x) => x.slug === slug); n++) slug = `${p.slug}-copy-${n}`;
                            setPages((ps) => [
                              { ...p, id: `lp_${slug}`, slug, title: `${p.title} (copy)`, status: "DRAFT", viewCount: 0, conversionCount: 0, revenue: 0 },
                              ...ps,
                            ]);
                            toast.success("Duplicated as draft (demo)");
                          }}
                        >
                          <Copy /> Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {p.status !== "PUBLISHED" ? (
                          <DropdownMenuItem
                            onSelect={() => {
                              update(p.id, { status: "PUBLISHED" });
                              toast.success("Published (demo)");
                            }}
                          >
                            <Rocket /> Publish
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onSelect={() => {
                              update(p.id, { status: "DRAFT" });
                              toast.success("Unpublished (demo)");
                            }}
                          >
                            <Eye /> Unpublish
                          </DropdownMenuItem>
                        )}
                        {p.status !== "ARCHIVED" && (
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={() => {
                              update(p.id, { status: "ARCHIVED" });
                              toast.success("Archived (demo)");
                            }}
                          >
                            <Archive /> Archive
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
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

function CreateLandingDialog({
  products,
  existingSlugs,
  onCreate,
}: {
  products: Pick<MockProduct, "id" | "name" | "price" | "compareAtPrice">[];
  existingSlugs: string[];
  onCreate: (page: MockLandingPage) => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [productId, setProductId] = useState("");
  const [template, setTemplate] = useState<Template>("bengali-longform");
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setTitle("");
    setSlug("");
    setSlugTouched(false);
    setProductId("");
    setTemplate("bengali-longform");
    setError(null);
  }

  function submit() {
    const product = products.find((p) => p.id === productId);
    if (title.trim().length < 3) return setError("Give the page a name (3+ characters).");
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return setError("Slug: lowercase letters, numbers and hyphens only.");
    if (existingSlugs.includes(slug)) return setError("That slug is already in use.");
    if (!product) return setError("Choose the product this page sells.");
    onCreate({
      id: `lp_${slug}`,
      title: title.trim(),
      slug,
      status: "DRAFT",
      productId: product.id,
      productName: product.name,
      template,
      offers: [{ label: "1 pc", quantity: 1, price: product.price, compareAtPrice: product.compareAtPrice }],
      viewCount: 0,
      conversionCount: 0,
      revenue: 0,
      facebookPixel: false,
      updatedAt: new Date().toISOString(),
    });
    setOpen(false);
    reset();
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
              {(Object.entries(templates) as [Template, (typeof templates)[Template]][]).map(([key, t]) => (
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
                  <t.icon className={cn("mt-0.5 size-4", template === key ? "text-primary" : "text-muted-foreground")} />
                  <span>
                    <span className="block text-sm font-medium">{t.label}</span>
                    <span className="block text-xs text-muted-foreground">{t.body}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" form="create-lp">
            Create draft
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
