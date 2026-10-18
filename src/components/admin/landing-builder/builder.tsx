"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ChevronDown,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  GripVertical,
  Loader2,
  Monitor,
  Plus,
  Smartphone,
  Trash2,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { saveLandingPage } from "@/app/(admin)/admin/landing-pages/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BlockEditor } from "@/components/admin/landing-builder/block-editors";
import { Field, TextArea, TextInput, Toggle } from "@/components/admin/landing-builder/fields";
import { LandingView } from "@/components/landing/section-renderer";
import type { LandingPageView } from "@/lib/landing/types";
import { blockCatalog, bundleOffers, newBlock } from "@/lib/landing/templates";
import { formatBDT } from "@/lib/money";
import type { LandingSection, LandingSectionType, LandingTheme } from "@/lib/validations/landing-page";
import type { BuilderProduct, LandingBuilderData } from "@/server/services/admin";
import { cn } from "@/lib/utils";

type Zone = { id: string; name: string; fee: number; estimatedDays: string | null };

/** Offer as edited (string inputs, converted on save/preview). */
type OfferDraft = {
  key: string;
  label: string;
  quantity: string;
  price: string;
  compareAtPrice: string;
  badge: string;
  freeShipping: boolean;
  isDefault: boolean;
};

type Draft = Omit<LandingBuilderData, "offers" | "viewCount" | "conversionCount"> & { offers: OfferDraft[] };

const uid = () => Math.random().toString(36).slice(2, 10);
const str = (n: number | null) => (n === null ? "" : String(n));
const nullable = (s: string | null | undefined) => (s && s.trim() ? s.trim() : null);

function toOfferDraft(o: LandingBuilderData["offers"][number]): OfferDraft {
  return {
    key: uid(),
    label: o.label,
    quantity: String(o.quantity),
    price: String(o.price),
    compareAtPrice: str(o.compareAtPrice),
    badge: o.badge ?? "",
    freeShipping: o.freeShipping,
    isDefault: o.isDefault,
  };
}

function offerPayload(o: OfferDraft) {
  return {
    label: o.label,
    quantity: Number(o.quantity) || 0,
    price: Number(o.price) || 0,
    compareAtPrice: o.compareAtPrice.trim() ? Number(o.compareAtPrice) : null,
    badge: nullable(o.badge),
    freeShipping: o.freeShipping,
    isDefault: o.isDefault,
  };
}

export function LandingBuilder({
  page,
  products,
  zones,
}: {
  page: LandingBuilderData;
  products: BuilderProduct[];
  zones: Zone[];
}) {
  const router = useRouter();
  const initial = useMemo<Draft>(() => ({ ...page, offers: page.offers.map(toOfferDraft) }), [page]);
  const [draft, setDraft] = useState<Draft>(initial);
  const [saved, setSaved] = useState(() => JSON.stringify(initial));
  const [openId, setOpenId] = useState<string | null>(page.sections[0]?.id ?? null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile");
  const [pending, startTransition] = useTransition();

  const dirty = JSON.stringify(draft) !== saved;
  const product = products.find((p) => p.id === draft.productId) ?? null;
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  // Ctrl/Cmd+S saves.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        document.getElementById("builder-save")?.click();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  function save() {
    const payload = {
      id: draft.id,
      title: draft.title,
      slug: draft.slug,
      status: draft.status,
      productId: draft.productId,
      sections: draft.sections,
      offers: draft.offers.map(offerPayload),
      allowedVariantIds: draft.allowedVariantIds,
      shippingZoneIds: draft.shippingZoneIds,
      theme: draft.theme,
      thankYouMessage: nullable(draft.thankYouMessage),
      seoTitle: nullable(draft.seoTitle),
      seoDescription: nullable(draft.seoDescription),
      ogImageUrl: nullable(draft.ogImageUrl),
      facebookPixelId: nullable(draft.facebookPixelId),
    };
    startTransition(async () => {
      const result = await saveLandingPage(payload);
      if (result.ok) {
        setErrors({});
        setSaved(JSON.stringify(draft));
        toast.success(draft.status === "PUBLISHED" ? "Saved & live" : "Saved");
        router.refresh();
      } else {
        setErrors(result.fieldErrors);
        // Open the first section with an error.
        const m = Object.keys(result.fieldErrors)[0]?.match(/^sections\.(\d+)\./);
        if (m) setOpenId(draft.sections[Number(m[1])]?.id ?? null);
        toast.error(result.message);
      }
    });
  }

  // --- Sections ---------------------------------------------------------------
  const updateSection = (id: string, next: LandingSection) =>
    set("sections", draft.sections.map((s) => (s.id === id ? next : s)));
  const moveSection = (from: number, to: number) => {
    if (to < 0 || to >= draft.sections.length || from === to) return;
    const next = [...draft.sections];
    const [s] = next.splice(from, 1);
    next.splice(to, 0, s);
    set("sections", next);
  };
  const addSection = (type: LandingSectionType) => {
    const block = newBlock(type, `${type}-${uid()}`, product?.nameBn ?? product?.name);
    // New blocks go just above checkout (checkout normally stays last).
    const checkoutIndex = draft.sections.findIndex((s) => s.type === "checkout");
    const next = [...draft.sections];
    next.splice(type !== "checkout" && checkoutIndex >= 0 ? checkoutIndex : next.length, 0, block);
    set("sections", next);
    setOpenId(block.id);
  };
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const sectionErrors = (i: number) => {
    const prefix = `sections.${i}.props.`;
    return Object.fromEntries(
      Object.entries(errors)
        .filter(([k]) => k.startsWith(prefix))
        .map(([k, v]) => [k.slice(prefix.length), v]),
    );
  };

  // --- Preview ----------------------------------------------------------------
  // Recomputed each render — cheap, and keeps the preview exactly in sync with the draft.
  const previewPage: LandingPageView | null = (() => {
    if (!product) return null;
    const allowed = new Set(draft.allowedVariantIds);
    return {
      id: draft.id,
      slug: draft.slug,
      title: draft.title,
      sections: draft.sections,
      theme: draft.theme,
      product: {
        id: product.id,
        name: product.name,
        nameBn: product.nameBn,
        art: product.art,
        color: product.color,
        images: product.images,
        rating: product.rating,
        reviewCount: product.reviewCount,
      },
      variants: product.variants.filter((v) => allowed.size === 0 || allowed.has(v.id)),
      offers: draft.offers.map((o) => ({ ...offerPayload(o), id: o.key })),
      zones: zones.filter((z) => draft.shippingZoneIds.length === 0 || draft.shippingZoneIds.includes(z.id)),
      productReviews: [],
      facebookPixelId: null, // never fire the pixel from the builder
    };
  })();

  return (
    <div className="flex h-[calc(100vh)] flex-col">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-background px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/landing-pages" aria-label="Back to landing pages">
              <ArrowLeft />
            </Link>
          </Button>
          <div className="min-w-0">
            <p className="truncate font-medium">{draft.title || "Untitled page"}</p>
            <p className="font-mono text-[11px] text-muted-foreground">
              /lp/{draft.slug} · {page.viewCount.toLocaleString("en-IN")} views · {page.conversionCount} orders
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {dirty && <span className="hidden text-xs text-amber-700 sm:inline">Unsaved changes</span>}
          <Select value={draft.status} onValueChange={(v) => set("status", v as Draft["status"])}>
            <SelectTrigger className="w-36" aria-label="Status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="PUBLISHED">Published</SelectItem>
              <SelectItem value="ARCHIVED">Archived</SelectItem>
            </SelectContent>
          </Select>
          {page.status === "PUBLISHED" && (
            <Button variant="outline" asChild>
              <Link href={`/lp/${page.slug}`} target="_blank">
                <ExternalLink /> View live
              </Link>
            </Button>
          )}
          <Button id="builder-save" onClick={save} disabled={pending || !dirty}>
            {pending && <Loader2 className="animate-spin" />}
            Save
          </Button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Editor panel */}
        <div className="w-full shrink-0 overflow-y-auto border-r bg-background lg:w-[440px]">
          <Tabs defaultValue="sections" className="gap-0">
            <TabsList className="sticky top-0 z-10 w-full rounded-none border-b bg-background p-1">
              <TabsTrigger value="sections">Sections ({draft.sections.length})</TabsTrigger>
              <TabsTrigger value="offers">Offers ({draft.offers.length})</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="sections" className="space-y-2 p-3">
              {!draft.sections.some((s) => s.type === "checkout" && !s.hidden) && (
                <p className="rounded-md bg-amber-50 p-2 text-xs text-amber-900">
                  No visible Checkout section — customers can&apos;t order from this page.
                </p>
              )}
              {draft.sections.map((section, i) => {
                const open = openId === section.id;
                const hasError = Object.keys(sectionErrors(i)).length > 0;
                const summary =
                  section.type === "hero"
                    ? section.props.headline
                    : "title" in section.props
                      ? section.props.title
                      : section.type === "richText"
                        ? section.props.html.slice(0, 40)
                        : undefined;
                return (
                  <div
                    key={section.id}
                    draggable
                    onDragStart={() => setDragIndex(i)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (dragIndex !== null) moveSection(dragIndex, i);
                      setDragIndex(null);
                    }}
                    onDragEnd={() => setDragIndex(null)}
                    className={cn(
                      "rounded-lg border bg-card transition",
                      open && "ring-1 ring-primary",
                      hasError && "border-destructive",
                      section.hidden && "opacity-60",
                      dragIndex === i && "opacity-40",
                    )}
                  >
                    <div className="flex items-center gap-1 p-2">
                      <GripVertical className="size-4 shrink-0 cursor-grab text-muted-foreground" aria-hidden />
                      <button
                        type="button"
                        onClick={() => setOpenId(open ? null : section.id)}
                        className="flex min-w-0 flex-1 items-center gap-2 text-left"
                        aria-expanded={open}
                      >
                        <span className="text-sm font-medium">{blockCatalog[section.type].label}</span>
                        {summary && <span className="truncate font-bengali text-xs text-muted-foreground">{summary}</span>}
                        <ChevronDown className={cn("ml-auto size-4 shrink-0 transition-transform", open && "rotate-180")} />
                      </button>
                      <Button variant="ghost" size="icon-xs" onClick={() => moveSection(i, i - 1)} disabled={i === 0} aria-label="Move up">
                        <ArrowUp />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => moveSection(i, i + 1)}
                        disabled={i === draft.sections.length - 1}
                        aria-label="Move down"
                      >
                        <ArrowDown />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => updateSection(section.id, { ...section, hidden: !section.hidden })}
                        aria-label={section.hidden ? "Enable section" : "Disable section"}
                        title={section.hidden ? "Disabled — click to enable" : "Enabled — click to disable"}
                      >
                        {section.hidden ? <EyeOff /> : <Eye />}
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-xs" aria-label="More">
                            <ChevronDown />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onSelect={() => {
                              const copy = { ...structuredClone(section), id: `${section.type}-${uid()}` };
                              const next = [...draft.sections];
                              next.splice(i + 1, 0, copy);
                              set("sections", next);
                            }}
                          >
                            <Copy /> Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={() => set("sections", draft.sections.filter((s) => s.id !== section.id))}
                          >
                            <Trash2 /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    {open && (
                      <div className="border-t p-3">
                        <BlockEditor
                          section={section}
                          errors={sectionErrors(i)}
                          onChange={(next) => updateSection(section.id, next)}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full border-dashed">
                    <Plus /> Add section
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-72">
                  <DropdownMenuLabel>Blocks</DropdownMenuLabel>
                  {(Object.keys(blockCatalog) as LandingSectionType[]).map((type) => (
                    <DropdownMenuItem key={type} onSelect={() => addSection(type)} className="flex-col items-start gap-0">
                      <span className="font-medium">{blockCatalog[type].label}</span>
                      <span className="text-xs text-muted-foreground">{blockCatalog[type].description}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </TabsContent>

            <TabsContent value="offers" className="p-3">
              <OffersEditor
                offers={draft.offers}
                onChange={(offers) => set("offers", offers)}
                errors={errors}
                unitPrice={product?.price ?? 0}
              />
            </TabsContent>

            <TabsContent value="settings" className="p-3">
              <SettingsPanel draft={draft} set={set} products={products} zones={zones} errors={errors} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Live preview */}
        <div className="hidden min-w-0 flex-1 flex-col bg-muted/60 lg:flex">
          <div className="flex items-center justify-center gap-1 border-b bg-background/60 py-2">
            <Button variant={device === "mobile" ? "secondary" : "ghost"} size="sm" onClick={() => setDevice("mobile")}>
              <Smartphone /> Mobile
            </Button>
            <Button variant={device === "desktop" ? "secondary" : "ghost"} size="sm" onClick={() => setDevice("desktop")}>
              <Monitor /> Desktop
            </Button>
            <span className="ml-3 text-xs text-muted-foreground">Live preview · ordering disabled</span>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-6">
            <div
              className={cn(
                "mx-auto overflow-hidden rounded-2xl bg-background shadow-xl ring-1 ring-black/5 transition-all",
                device === "mobile" ? "max-w-[400px]" : "max-w-5xl",
              )}
              // Container queries aren't used by the blocks, so constrain width and let them reflow.
            >
              {previewPage ? (
                <LandingView page={previewPage} preview />
              ) : (
                <p className="p-10 text-center text-sm text-muted-foreground">Choose a product in Settings to preview.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OffersEditor({
  offers,
  onChange,
  errors,
  unitPrice,
}: {
  offers: OfferDraft[];
  onChange: (o: OfferDraft[]) => void;
  errors: Record<string, string>;
  unitPrice: number;
}) {
  const update = (key: string, patch: Partial<OfferDraft>) => onChange(offers.map((o) => (o.key === key ? { ...o, ...patch } : o)));
  const move = (from: number, to: number) => {
    if (to < 0 || to >= offers.length) return;
    const next = [...offers];
    const [o] = next.splice(from, 1);
    next.splice(to, 0, o);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Bundles shown as radio cards in the checkout. Price is the total for the bundle. Product price: {formatBDT(unitPrice)}.
      </p>
      {errors.offers && <p className="text-xs text-destructive">{errors.offers}</p>}
      {offers.map((o, i) => (
        <div key={o.key} className={cn("space-y-2 rounded-lg border p-3", o.isDefault && "ring-1 ring-primary")}>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs font-medium">
              <input
                type="radio"
                name="default-offer"
                checked={o.isDefault}
                onChange={() => onChange(offers.map((x) => ({ ...x, isDefault: x.key === o.key })))}
              />
              Pre-selected
            </label>
            <div className="flex gap-0.5">
              <Button variant="ghost" size="icon-xs" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Move up">
                <ArrowUp />
              </Button>
              <Button variant="ghost" size="icon-xs" onClick={() => move(i, i + 1)} disabled={i === offers.length - 1} aria-label="Move down">
                <ArrowDown />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                className="text-destructive"
                disabled={offers.length === 1}
                onClick={() => onChange(offers.filter((x) => x.key !== o.key))}
                aria-label="Remove offer"
              >
                <Trash2 />
              </Button>
            </div>
          </div>
          <TextInput label="Label" bengali value={o.label} error={errors[`offers.${i}.label`]} placeholder="২ পিস" onChange={(label) => update(o.key, { label })} />
          <div className="grid grid-cols-3 gap-2">
            <TextInput label="Qty" type="number" value={o.quantity} error={errors[`offers.${i}.quantity`]} onChange={(quantity) => update(o.key, { quantity })} />
            <TextInput label="Price ৳" type="number" value={o.price} error={errors[`offers.${i}.price`]} onChange={(price) => update(o.key, { price })} />
            <TextInput
              label="Compare ৳"
              type="number"
              value={o.compareAtPrice}
              error={errors[`offers.${i}.compareAtPrice`]}
              onChange={(compareAtPrice) => update(o.key, { compareAtPrice })}
            />
          </div>
          <div className="grid grid-cols-[1fr_auto] items-end gap-3">
            <TextInput label="Badge" bengali value={o.badge} placeholder="জনপ্রিয়" onChange={(badge) => update(o.key, { badge })} />
            <Toggle label="Free delivery" checked={o.freeShipping} onChange={(freeShipping) => update(o.key, { freeShipping })} />
          </div>
        </div>
      ))}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={offers.length >= 6}
          onClick={() =>
            onChange([
              ...offers,
              { key: uid(), label: "", quantity: "1", price: String(unitPrice), compareAtPrice: "", badge: "", freeShipping: false, isDefault: offers.length === 0 },
            ])
          }
        >
          <Plus /> Add offer
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!unitPrice}
          onClick={() => {
            onChange(bundleOffers(unitPrice).map((o) => toOfferDraft(o)));
            toast.success("1 / 2 / 3-piece bundles generated");
          }}
        >
          <Wand2 /> 1-2-3 bundles
        </Button>
      </div>
    </div>
  );
}

function SettingsPanel({
  draft,
  set,
  products,
  zones,
  errors,
}: {
  draft: Draft;
  set: <K extends keyof Draft>(key: K, value: Draft[K]) => void;
  products: BuilderProduct[];
  zones: Zone[];
  errors: Record<string, string>;
}) {
  const product = products.find((p) => p.id === draft.productId);
  const toggleIn = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  const theme = draft.theme;
  const setTheme = (patch: Partial<LandingTheme>) => set("theme", { ...theme, ...patch });

  return (
    <div className="space-y-5">
      <TextInput label="Page name (internal)" value={draft.title} error={errors.title} onChange={(v) => set("title", v)} />
      <Field label="URL" error={errors.slug}>
        <div className="flex items-center rounded-lg border focus-within:ring-3 focus-within:ring-ring/50">
          <span className="pl-2.5 text-sm text-muted-foreground">/lp/</span>
          <input
            value={draft.slug}
            onChange={(e) => set("slug", e.target.value.toLowerCase())}
            className="h-8 flex-1 bg-transparent pr-2.5 font-mono text-sm outline-none"
            aria-label="URL slug"
          />
        </div>
      </Field>

      <Field label="Product" error={errors.productId}>
        <Select
          value={draft.productId}
          onValueChange={(productId) => {
            set("productId", productId);
            set("allowedVariantIds", []);
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {products.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name} · {formatBDT(p.price)}
                {p.status !== "ACTIVE" && " (draft)"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      {product && product.variants.length > 1 && (
        <Field label="Variants offered" hint="None ticked = all active variants.">
          <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border p-2">
            {product.variants.map((v) => (
              <label key={v.id} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={draft.allowedVariantIds.includes(v.id)}
                  onCheckedChange={() => set("allowedVariantIds", toggleIn(draft.allowedVariantIds, v.id))}
                />
                {v.colorHex && <span className="size-3 rounded-full border" style={{ backgroundColor: v.colorHex }} />}
                {v.title}
                <span className={cn("ml-auto text-xs", v.stock === 0 ? "text-destructive" : "text-muted-foreground")}>
                  {v.stock} in stock
                </span>
              </label>
            ))}
          </div>
        </Field>
      )}

      <Field label="Delivery areas" hint="None ticked = all active zones.">
        <div className="space-y-1 rounded-lg border p-2">
          {zones.map((z) => (
            <label key={z.id} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={draft.shippingZoneIds.includes(z.id)}
                onCheckedChange={() => set("shippingZoneIds", toggleIn(draft.shippingZoneIds, z.id))}
              />
              {z.name} <span className="ml-auto text-xs text-muted-foreground">{formatBDT(z.fee)}</span>
            </label>
          ))}
        </div>
      </Field>

      <TextArea
        label="Thank-you message"
        rows={3}
        value={draft.thankYouMessage ?? ""}
        placeholder="আমাদের প্রতিনিধি শীঘ্রই আপনাকে কল করে অর্ডারটি কনফার্ম করবেন।"
        onChange={(v) => set("thankYouMessage", v)}
      />

      <div className="space-y-3 border-t pt-4">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Look</p>
        <Field label="Accent colour" hint="Buttons & highlights. Empty = brand emerald.">
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={theme.accent ?? "#1f4d3f"}
              onChange={(e) => setTheme({ accent: e.target.value })}
              className="h-8 w-12 cursor-pointer rounded-md border bg-transparent p-0.5"
              aria-label="Accent colour"
            />
            <Input value={theme.accent ?? ""} readOnly placeholder="default" className="w-28 font-mono" />
            {theme.accent && (
              <Button variant="ghost" size="sm" onClick={() => setTheme({ accent: undefined })}>
                Reset
              </Button>
            )}
          </div>
        </Field>
        <Field label="Typeface">
          <Select value={theme.font ?? "bengali"} onValueChange={(font) => setTheme({ font: font as LandingTheme["font"] })}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bengali">Bengali (Noto Sans Bengali)</SelectItem>
              <SelectItem value="serif">Serif headings (Cormorant)</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>

      <div className="space-y-3 border-t pt-4">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">SEO & tracking</p>
        <TextInput label="SEO title" value={draft.seoTitle ?? ""} error={errors.seoTitle} onChange={(v) => set("seoTitle", v)} hint="≤ 70 characters" />
        <TextArea label="SEO description" value={draft.seoDescription ?? ""} error={errors.seoDescription} onChange={(v) => set("seoDescription", v)} />
        <TextInput label="Share image URL (Open Graph)" value={draft.ogImageUrl ?? ""} error={errors.ogImageUrl} onChange={(v) => set("ogImageUrl", v)} placeholder="https://…" />
        <TextInput
          label="Facebook Pixel ID"
          value={draft.facebookPixelId ?? ""}
          error={errors.facebookPixelId}
          onChange={(v) => set("facebookPixelId", v.replace(/\D/g, ""))}
          hint="Fires PageView on the page and Purchase on the thank-you page."
        />
      </div>
    </div>
  );
}
