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
  Layers,
  Loader2,
  Monitor,
  Package,
  PanelLeft,
  Plus,
  Settings2,
  Smartphone,
  Trash2,
  Wand2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { saveLandingPage } from "@/app/(admin)/admin/landing-pages/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BlockEditor } from "@/components/admin/landing-builder/block-editors";
import {
  AddBlockDrawer,
  blockIcons,
  blockSummary,
  CanvasBlock,
  InsertSlot,
  type DragState,
} from "@/components/admin/landing-builder/canvas";
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [panel, setPanel] = useState<"layers" | "offers" | "settings">("layers");
  const [panelOpen, setPanelOpen] = useState(false); // below lg the left panel is an overlay
  const [insertAt, setInsertAt] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();

  const dirty = JSON.stringify(draft) !== saved;
  const product = products.find((p) => p.id === draft.productId) ?? null;
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const sections = draft.sections;
  const selectedIndex = sections.findIndex((s) => s.id === selectedId);
  const selected = selectedIndex >= 0 ? sections[selectedIndex] : null;

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  // Ctrl/Cmd+S saves; Escape closes the inspector.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        document.getElementById("builder-save")?.click();
      } else if (e.key === "Escape" && !document.querySelector("[role=dialog]")) {
        setSelectedId(null);
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
        // Open the first block with an error, or the panel that holds the failing field.
        const key = Object.keys(result.fieldErrors)[0] ?? "";
        const m = key.match(/^sections\.(\d+)\./);
        if (m) select(draft.sections[Number(m[1])]?.id ?? null, true);
        else if (key.startsWith("offers")) openPanel("offers");
        else if (key) openPanel("settings");
        toast.error(result.message);
      }
    });
  }

  // --- Sections ---------------------------------------------------------------
  const setSections = (next: LandingSection[]) => set("sections", next);
  const updateSection = (id: string, next: LandingSection) => setSections(sections.map((s) => (s.id === id ? next : s)));
  const isTaken = (type: LandingSectionType) => !!blockCatalog[type].single && sections.some((s) => s.type === type);

  function select(id: string | null, scroll = false) {
    setSelectedId(id);
    if (id && scroll) {
      // Wait for the inspector to open so the canvas has its final width.
      requestAnimationFrame(() =>
        document.getElementById(`canvas-block-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" }),
      );
    }
  }
  function openPanel(next: typeof panel) {
    setPanel(next);
    setPanelOpen(true);
  }
  function insertBlock(type: LandingSectionType, at: number) {
    const block = newBlock(type, `${type}-${uid()}`, product?.nameBn ?? product?.name);
    const next = [...sections];
    next.splice(at, 0, block);
    setSections(next);
    setInsertAt(null);
    select(block.id, true);
  }
  function duplicate(id: string) {
    const i = sections.findIndex((s) => s.id === id);
    if (i < 0 || isTaken(sections[i].type)) return;
    const copy = { ...structuredClone(sections[i]), id: `${sections[i].type}-${uid()}` };
    const next = [...sections];
    next.splice(i + 1, 0, copy);
    setSections(next);
    select(copy.id);
  }
  function remove(id: string) {
    const section = sections.find((s) => s.id === id);
    if (!section) return;
    setSections(sections.filter((s) => s.id !== id));
    if (selectedId === id) setSelectedId(null);
    toast(`${blockCatalog[section.type].label} deleted`, {
      action: { label: "Undo", onClick: () => setDraft((d) => ({ ...d, sections })) },
    });
  }
  const toggleHidden = (s: LandingSection) => updateSection(s.id, { ...s, hidden: !s.hidden });

  // Drag & drop reorder (canvas and layers share this). dropIndex is an insertion index.
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const drag: DragState = {
    dragId,
    dropIndex,
    start: (id, e) => {
      setDragId(id);
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", id);
      const block = document.getElementById(`canvas-block-${id}`);
      if (block && e.currentTarget.closest(`#canvas-block-${id}`)) e.dataTransfer.setDragImage(block, 24, 24);
    },
    over: (index, e) => {
      if (!dragId) return;
      e.preventDefault();
      const rect = e.currentTarget.getBoundingClientRect();
      const next = e.clientY < rect.top + rect.height / 2 ? index : index + 1;
      if (next !== dropIndex) setDropIndex(next);
    },
    drop: () => {
      const from = sections.findIndex((s) => s.id === dragId);
      if (from >= 0 && dropIndex !== null) {
        const to = dropIndex > from ? dropIndex - 1 : dropIndex;
        if (to !== from) {
          const next = [...sections];
          const [s] = next.splice(from, 1);
          next.splice(to, 0, s);
          setSections(next);
        }
      }
      setDragId(null);
      setDropIndex(null);
    },
    end: () => {
      setDragId(null);
      setDropIndex(null);
    },
  };

  const sectionErrors = (i: number) => {
    const prefix = `sections.${i}.props.`;
    return Object.fromEntries(
      Object.entries(errors)
        .filter(([k]) => k.startsWith(prefix))
        .map(([k, v]) => [k.slice(prefix.length), v]),
    );
  };
  const hasErrors = (i: number) => Object.keys(errors).some((k) => k.startsWith(`sections.${i}.`));

  // --- Preview ----------------------------------------------------------------
  // Recomputed each render — cheap, and keeps the canvas exactly in sync with the draft.
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

  const noCheckout = !sections.some((s) => s.type === "checkout" && !s.hidden);

  return (
    <div className="flex h-screen flex-col">
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
              {page.viewCount > 0 && ` · ${((page.conversionCount / page.viewCount) * 100).toFixed(1)}% CVR`}
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

      <div className="relative flex min-h-0 flex-1">
        {/* Left panel: layers / offers / settings */}
        {panelOpen && <div className="absolute inset-0 z-30 bg-black/20 lg:hidden" onClick={() => setPanelOpen(false)} />}
        <aside
          className={cn(
            "absolute inset-y-0 left-0 z-40 w-[340px] max-w-[90vw] flex-col border-r bg-background shadow-xl lg:static lg:z-auto lg:flex lg:shadow-none",
            panelOpen ? "flex" : "hidden",
          )}
        >
          <Tabs value={panel} onValueChange={(v) => setPanel(v as typeof panel)} className="min-h-0 flex-1 gap-0">
            <TabsList className="w-full shrink-0 rounded-none border-b bg-background p-1">
              <TabsTrigger value="layers">
                <Layers /> Layers
              </TabsTrigger>
              <TabsTrigger value="offers">
                <Package /> Offers
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings2 /> Settings
              </TabsTrigger>
            </TabsList>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <TabsContent value="layers" className="space-y-1.5 p-3">
                {noCheckout && (
                  <p className="rounded-md bg-amber-50 p-2 text-xs text-amber-900">
                    No visible Checkout block — customers can&apos;t order from this page.
                  </p>
                )}
                {sections.map((section, i) => {
                  const Icon = blockIcons[section.type];
                  const summary = blockSummary(section);
                  return (
                    <div
                      key={section.id}
                      onDragOver={(e) => drag.over(i, e)}
                      onDrop={(e) => {
                        e.preventDefault();
                        drag.drop();
                      }}
                      className={cn(
                        "relative flex items-center gap-1 rounded-lg border bg-card p-1.5 transition",
                        selectedId === section.id && "border-primary ring-1 ring-primary",
                        hasErrors(i) && "border-destructive",
                        section.hidden && "opacity-55",
                        dragId === section.id && "opacity-40",
                      )}
                    >
                      {dropIndex === i && <span className="absolute inset-x-0 -top-1 h-0.5 rounded bg-primary" />}
                      {dropIndex === i + 1 && i === sections.length - 1 && <span className="absolute inset-x-0 -bottom-1 h-0.5 rounded bg-primary" />}
                      <span
                        draggable
                        onDragStart={(e) => drag.start(section.id, e)}
                        onDragEnd={drag.end}
                        className="grid size-7 shrink-0 cursor-grab place-items-center text-muted-foreground active:cursor-grabbing"
                        aria-label="Drag to reorder"
                      >
                        <GripVertical className="size-4" />
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          select(section.id, true);
                          setPanelOpen(false);
                        }}
                        className="flex min-w-0 flex-1 items-center gap-2 text-left"
                      >
                        <Icon className="size-4 shrink-0 text-primary" />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">{blockCatalog[section.type].label}</span>
                          {summary && <span className="block truncate font-bengali text-xs text-muted-foreground">{summary}</span>}
                        </span>
                      </button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => toggleHidden(section)}
                        aria-label={section.hidden ? "Show block" : "Hide block"}
                        title={section.hidden ? "Hidden — click to show" : "Visible — click to hide"}
                      >
                        {section.hidden ? <EyeOff /> : <Eye />}
                      </Button>
                    </div>
                  );
                })}
                <Button variant="outline" className="w-full border-dashed" onClick={() => setInsertAt(sections.length)}>
                  <Plus /> Add block
                </Button>
              </TabsContent>

              <TabsContent value="offers" className="p-3">
                <OffersEditor offers={draft.offers} onChange={(offers) => set("offers", offers)} errors={errors} unitPrice={product?.price ?? 0} />
              </TabsContent>

              <TabsContent value="settings" className="p-3">
                <SettingsPanel draft={draft} set={set} products={products} zones={zones} errors={errors} />
              </TabsContent>
            </div>
          </Tabs>
        </aside>

        {/* Canvas */}
        <main className="relative flex min-w-0 flex-1 flex-col bg-muted/60">
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b bg-background/80 px-3 py-2 backdrop-blur">
            <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setPanelOpen(true)}>
              <PanelLeft /> Panels
            </Button>
            <div className="flex items-center gap-1 rounded-lg bg-muted p-0.5 lg:mx-auto" role="radiogroup" aria-label="Device preview">
              {(
                [
                  ["desktop", Monitor, "Desktop"],
                  ["mobile", Smartphone, "Mobile · 375px"],
                ] as const
              ).map(([value, Icon, label]) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={device === value}
                  onClick={() => setDevice(value)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium text-muted-foreground transition",
                    device === value && "bg-background text-foreground shadow-sm",
                  )}
                >
                  <Icon className="size-3.5" /> {label}
                </button>
              ))}
            </div>
            <Button size="sm" onClick={() => setInsertAt(selectedIndex >= 0 ? selectedIndex + 1 : sections.length)}>
              <Plus /> Add block
            </Button>
          </div>

          <div
            className={cn("min-h-0 flex-1 overflow-y-auto px-4 py-6 transition-[padding] sm:px-6", selected && "xl:pr-[404px]")}
            onClick={(e) => e.target === e.currentTarget && setSelectedId(null)}
          >
            <div
              className={cn(
                "mx-auto bg-background transition-[max-width] duration-300",
                device === "mobile"
                  ? "max-w-[391px] overflow-hidden rounded-[2.25rem] border-8 border-neutral-900 shadow-2xl"
                  : "max-w-[1280px] rounded-xl shadow-xl ring-1 ring-black/5",
              )}
            >
              {!previewPage ? (
                <p className="p-10 text-center text-sm text-muted-foreground">Choose a product in Settings to preview.</p>
              ) : sections.length === 0 ? (
                <div className="flex flex-col items-center gap-3 p-16 text-center">
                  <p className="text-sm text-muted-foreground">This page is empty.</p>
                  <Button onClick={() => setInsertAt(0)}>
                    <Plus /> Add your first block
                  </Button>
                </div>
              ) : (
                <LandingView
                  page={previewPage}
                  preview
                  renderSection={(section, i, node) => (
                    <>
                      {i > 0 && <InsertSlot onClick={() => setInsertAt(i)} />}
                      <CanvasBlock
                        section={section}
                        index={i}
                        last={i === sections.length - 1}
                        selected={section.id === selectedId}
                        hasError={hasErrors(i)}
                        drag={drag}
                        canDuplicate={!blockCatalog[section.type].single}
                        onSelect={() => select(section.id)}
                        onDuplicate={() => duplicate(section.id)}
                        onToggleHidden={() => toggleHidden(section)}
                        onDelete={() => remove(section.id)}
                      >
                        {node}
                      </CanvasBlock>
                    </>
                  )}
                />
              )}
            </div>
            {previewPage && sections.length > 0 && (
              <div className="mx-auto mt-4 flex max-w-[1280px] justify-center">
                <Button variant="outline" className="border-dashed bg-background" onClick={() => setInsertAt(sections.length)}>
                  <Plus /> Add block at the end
                </Button>
              </div>
            )}
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Live preview · ordering disabled · click a block to edit, drag <GripVertical className="inline size-3" /> to reorder
            </p>
          </div>

          {/* Slide-over inspector */}
          <div
            className={cn(
              "absolute inset-y-0 right-0 z-30 flex w-full flex-col border-l bg-background shadow-2xl transition-transform duration-300 sm:w-[400px]",
              selected ? "translate-x-0" : "pointer-events-none translate-x-full",
            )}
            aria-hidden={!selected}
            inert={!selected}
          >
            {selected && (
              <Inspector
                key={selected.id}
                section={selected}
                errors={sectionErrors(selectedIndex)}
                onChange={(next) => updateSection(selected.id, next)}
                onClose={() => setSelectedId(null)}
                onDuplicate={blockCatalog[selected.type].single ? undefined : () => duplicate(selected.id)}
                onToggleHidden={() => toggleHidden(selected)}
                onDelete={() => remove(selected.id)}
                offers={
                  ["hero", "offers", "checkout", "stickyBar"].includes(selected.type) ? (
                    <OffersEditor offers={draft.offers} onChange={(offers) => set("offers", offers)} errors={errors} unitPrice={product?.price ?? 0} />
                  ) : null
                }
              />
            )}
          </div>
        </main>
      </div>

      <AddBlockDrawer
        open={insertAt !== null}
        onOpenChange={(o) => !o && setInsertAt(null)}
        position={insertAt ?? sections.length}
        total={sections.length}
        existing={sections.map((s) => s.type)}
        onAdd={(type) => insertBlock(type, insertAt ?? sections.length)}
      />
    </div>
  );
}

function Inspector({
  section,
  errors,
  onChange,
  onClose,
  onDuplicate,
  onToggleHidden,
  onDelete,
  offers,
}: {
  section: LandingSection;
  errors: Record<string, string>;
  onChange: (next: LandingSection) => void;
  onClose: () => void;
  onDuplicate?: () => void;
  onToggleHidden: () => void;
  onDelete: () => void;
  /** Offer pricing editor for blocks that display offers. */
  offers: React.ReactNode;
}) {
  const Icon = blockIcons[section.type];
  const [offersOpen, setOffersOpen] = useState(section.type === "offers");
  return (
    <>
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{blockCatalog[section.type].label}</p>
          <p className="truncate text-xs text-muted-foreground">{section.hidden ? "Hidden from the live page" : blockCatalog[section.type].description}</p>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close settings">
          <X />
        </Button>
      </div>
      <div className="flex gap-1 border-b px-4 py-2">
        <Button variant="ghost" size="sm" onClick={onToggleHidden}>
          {section.hidden ? <Eye /> : <EyeOff />} {section.hidden ? "Show" : "Hide"}
        </Button>
        <Button variant="ghost" size="sm" onClick={onDuplicate} disabled={!onDuplicate}>
          <Copy /> Duplicate
        </Button>
        <Button variant="ghost" size="sm" className="ml-auto text-destructive hover:text-destructive" onClick={onDelete}>
          <Trash2 /> Delete
        </Button>
      </div>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        <BlockEditor section={section} errors={errors} onChange={onChange} />
        {offers && (
          <div className="rounded-lg border">
            <button
              type="button"
              onClick={() => setOffersOpen((o) => !o)}
              aria-expanded={offersOpen}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium"
            >
              <Package className="size-4 text-primary" /> Offer packages & pricing
              <ChevronDown className={cn("ml-auto size-4 transition-transform", offersOpen && "rotate-180")} />
            </button>
            {offersOpen && <div className="border-t p-3">{offers}</div>}
          </div>
        )}
      </div>
      <p className="border-t px-4 py-2 text-[11px] text-muted-foreground">Changes preview instantly · Ctrl+S to save</p>
    </>
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
