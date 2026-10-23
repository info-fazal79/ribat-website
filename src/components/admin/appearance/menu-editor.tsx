"use client";

import { useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronsDownUp,
  ChevronsUpDown,
  Eye,
  FolderTree,
  GripVertical,
  Link2,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Segmented, Switch } from "@/components/admin/appearance/controls";
import { ImageUpload } from "@/components/admin/image-upload";
import { Field, TextInput } from "@/components/admin/landing-builder/fields";
import { DropdownContent, MegaMenuContent, hasSubmenu, megaColumns, megaThemes } from "@/components/storefront/header-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { MenuItem } from "@/lib/validations/settings";

type Link = { title: string; url: string };
export type QuickAddCategory = { slug: string; name: string; nameBn: string | null };

const MAX_ITEMS = 12;

const newId = () => Math.random().toString(36).slice(2, 10);

const newItem = (title: string, url: string): MenuItem => ({
  id: newId(),
  title,
  url,
  links: [],
  megaMenu: false,
  gridColumns: 3,
  panelTheme: "light",
  columns: [],
  promo: { enabled: false, imageUrl: "", badge: "", title: "", buttonText: "Shop now", buttonUrl: "" },
});

function itemBadge(item: MenuItem) {
  if (item.megaMenu) return { label: `Mega Menu · ${item.gridColumns} Cols${item.promo.enabled ? " + Promo" : ""}`, mega: true };
  if (item.links.length) return { label: `Dropdown · ${item.links.length} link${item.links.length === 1 ? "" : "s"}`, mega: false };
  return { label: "Standard Link", mega: false };
}

/** WordPress/Shopify-style header menu builder: quick add, sortable accordion cards, live mega-menu preview. */
export function MenuEditor({
  items,
  onChange,
  errors,
  categories,
}: {
  items: MenuItem[];
  onChange: (items: MenuItem[]) => void;
  errors: Record<string, string>;
  categories: QuickAddCategory[];
}) {
  const [open, setOpen] = useState<Set<string>>(() => new Set());
  const [previewId, setPreviewId] = useState<string | null>(() => (items.find((i) => i.megaMenu) ?? items[0])?.id ?? null);
  const [dragId, setDragId] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const full = items.length >= MAX_ITEMS;
  const update = (id: string, patch: Partial<MenuItem>) => onChange(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  const toggle = (id: string) =>
    setOpen((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length || from === to) return;
    const next = [...items];
    const [it] = next.splice(from, 1);
    next.splice(to, 0, it);
    onChange(next);
  };
  const add = (title: string, url: string) => {
    if (full) return;
    const item = newItem(title, url);
    onChange([...items, item]);
    setOpen((s) => new Set(s).add(item.id));
  };
  const remove = (id: string) => onChange(items.filter((it) => it.id !== id));

  // Open any card whose fields failed validation on save (state adjusted during render when errors change).
  const [seenErrors, setSeenErrors] = useState(errors);
  if (errors !== seenErrors) {
    setSeenErrors(errors);
    const failing = Object.keys(errors)
      .map((k) => k.match(/^headerMenu\.items\.(\d+)\./)?.[1])
      .filter((i): i is string => i !== undefined)
      .map((i) => items[Number(i)]?.id)
      .filter((id): id is string => !!id);
    if (failing.length) setOpen((s) => new Set([...s, ...failing]));
  }

  const previewItem = items.find((i) => i.id === previewId) ?? items.find((i) => i.megaMenu) ?? items[0];

  return (
    <div className="min-w-0 space-y-6">
      <MenuPreview ref={previewRef} items={items} active={previewItem} onSelect={setPreviewId} />

      <div className="grid min-w-0 gap-6 lg:grid-cols-[17rem_minmax(0,1fr)]">
        <QuickAdd items={items} categories={categories} full={full} onAdd={add} />

        <section className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold">Menu structure</h3>
              <p className="text-xs text-muted-foreground">
                {items.length} / {MAX_ITEMS} items · drag the handle to reorder
              </p>
            </div>
            <div className="flex gap-1">
              <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(new Set(items.map((i) => i.id)))}>
                <ChevronsUpDown />
                Expand all
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(new Set())}>
                <ChevronsDownUp />
                Collapse all
              </Button>
            </div>
          </div>

          {items.length === 0 && (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              Your menu is empty. Add categories or a custom link from the left.
            </div>
          )}

          <ul className="space-y-2">
            {items.map((item, index) => {
              const isOpen = open.has(item.id);
              const badge = itemBadge(item);
              const err = (path: string) => errors[`headerMenu.items.${index}.${path}`];
              const hasError = Object.keys(errors).some((k) => k.startsWith(`headerMenu.items.${index}.`));
              return (
                <li
                  key={item.id}
                  onDragOver={(e) => {
                    if (!dragId) return;
                    e.preventDefault();
                    const from = items.findIndex((i) => i.id === dragId);
                    if (from !== index) move(from, index);
                  }}
                  onDrop={(e) => e.preventDefault()}
                  className={cn(
                    "min-w-0 overflow-hidden rounded-lg border bg-background transition-shadow",
                    isOpen && "shadow-sm ring-1 ring-primary/15",
                    dragId === item.id && "opacity-50",
                    hasError && "border-destructive",
                  )}
                >
                  <div className="flex items-center">
                    <span
                      draggable
                      onDragStart={(e) => {
                        setDragId(item.id);
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData("text/plain", item.id);
                      }}
                      onDragEnd={() => setDragId(null)}
                      className="flex cursor-grab items-center self-stretch px-2 text-muted-foreground hover:text-foreground active:cursor-grabbing"
                      aria-label={`Drag to reorder ${item.title || "item"}`}
                      title="Drag to reorder"
                    >
                      <GripVertical className="size-4" />
                    </span>
                    <button
                      type="button"
                      onClick={() => toggle(item.id)}
                      aria-expanded={isOpen}
                      className="flex min-w-0 flex-1 items-center gap-3 py-3 pr-3 text-left"
                    >
                      <span className="min-w-0 flex-1">
                        <span className={cn("block truncate text-sm font-medium", !item.title && "text-muted-foreground italic")}>
                          {item.title || "Untitled item"}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">{item.url}</span>
                      </span>
                      <span
                        className={cn(
                          "hidden shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium sm:inline",
                          badge.mega ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                        )}
                      >
                        {badge.label}
                      </span>
                      <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                    </button>
                  </div>

                  {isOpen && (
                    <ItemSettings
                      item={item}
                      err={err}
                      onChange={(patch) => update(item.id, patch)}
                      onPreview={() => {
                        setPreviewId(item.id);
                        previewRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
                      }}
                      footer={
                        <div className="flex flex-wrap items-center justify-between gap-2 border-t bg-muted/30 px-4 py-2">
                          <div className="flex gap-1">
                            <Button type="button" variant="ghost" size="sm" disabled={index === 0} onClick={() => move(index, index - 1)}>
                              <ArrowUp />
                              Up
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={index === items.length - 1}
                              onClick={() => move(index, index + 1)}
                            >
                              <ArrowDown />
                              Down
                            </Button>
                          </div>
                          <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => remove(item.id)}>
                            <Trash2 />
                            Remove item
                          </Button>
                        </div>
                      }
                    />
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}

// --- Live preview -------------------------------------------------------------

function MenuPreview({
  ref,
  items,
  active,
  onSelect,
}: {
  ref: React.Ref<HTMLDivElement>;
  items: MenuItem[];
  active: MenuItem | undefined;
  onSelect: (id: string) => void;
}) {
  return (
    <div ref={ref} className="min-w-0 overflow-hidden rounded-xl border bg-background">
      <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-2">
        <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Eye className="size-3.5" />
          Live menu preview
        </p>
        <p className="hidden text-[11px] text-muted-foreground sm:block">Click a menu item to preview its dropdown</p>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[56rem]">
          <div className="flex justify-center gap-8 border-b px-4">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.id)}
                className={cn(
                  "flex items-center gap-1 border-b-2 border-transparent py-3 text-[11px] font-medium tracking-[0.2em] text-foreground/60 uppercase transition-colors hover:text-foreground",
                  active?.id === item.id && "border-foreground text-foreground",
                )}
              >
                {item.title || "Untitled"}
                {hasSubmenu(item) && <ChevronDown className="size-3" />}
              </button>
            ))}
          </div>
          {/* Links inside the preview must not navigate away from the editor. */}
          <div onClickCapture={(e) => e.preventDefault()} className="bg-muted/20">
            {!active ? (
              <p className="p-8 text-center text-sm text-muted-foreground">Add a menu item to see a preview.</p>
            ) : active.megaMenu ? (
              hasSubmenu(active) ? (
                <div className={cn("border-b", megaThemes[active.panelTheme].panel)}>
                  <MegaMenuContent item={active} className="max-w-none py-8" />
                </div>
              ) : (
                <p className="p-8 text-center text-sm text-muted-foreground">Add links to a column or enable the promo banner.</p>
              )
            ) : active.links.length ? (
              <div className="flex justify-center p-4">
                <DropdownContent item={active} />
              </div>
            ) : (
              <p className="p-8 text-center text-sm text-muted-foreground">“{active.title}” is a standard link — no dropdown.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Quick add sidebar ---------------------------------------------------------

function QuickAdd({
  items,
  categories,
  full,
  onAdd,
}: {
  items: MenuItem[];
  categories: QuickAddCategory[];
  full: boolean;
  onAdd: (title: string, url: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const urlOk = /^(\/|#|https?:\/\/)\S*$/.test(url.trim());
  const inMenu = new Set(items.map((i) => i.url));

  return (
    <aside className="min-w-0 space-y-4 lg:sticky lg:top-4 lg:self-start">
      <div className="rounded-lg border bg-background">
        <p className="flex items-center gap-2 border-b px-4 py-3 text-sm font-semibold">
          <FolderTree className="size-4 text-muted-foreground" />
          Categories
        </p>
        <ul className="max-h-72 divide-y overflow-y-auto">
          {categories.length === 0 && <li className="px-4 py-3 text-xs text-muted-foreground">No active categories.</li>}
          {categories.map((c) => {
            const href = `/categories/${c.slug}`;
            const added = inMenu.has(href);
            return (
              <li key={c.slug} className="flex items-center justify-between gap-2 px-4 py-2">
                <span className="min-w-0">
                  <span className="block truncate text-sm">{c.name}</span>
                  {c.nameBn && <span className="block truncate font-bengali text-xs text-muted-foreground">{c.nameBn}</span>}
                </span>
                {added ? (
                  <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                    <Check className="size-3.5" />
                    In menu
                  </span>
                ) : (
                  <Button type="button" variant="outline" size="xs" disabled={full} onClick={() => onAdd(c.name, href)}>
                    <Plus />
                    Add
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <form
        className="space-y-3 rounded-lg border bg-background p-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim() || !urlOk || full) return;
          onAdd(title.trim(), url.trim());
          setTitle("");
          setUrl("");
        }}
      >
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Link2 className="size-4 text-muted-foreground" />
          Custom link
        </p>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Link text, e.g. Eid Collection" aria-label="Link text" />
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="/products or https://…"
          aria-label="Link URL"
          aria-invalid={url !== "" && !urlOk}
        />
        <Button type="submit" className="w-full" disabled={full || !title.trim() || !urlOk}>
          <Plus />
          Add to Menu
        </Button>
        {full && <p className="text-xs text-muted-foreground">Menu is full ({MAX_ITEMS} items).</p>}
      </form>
    </aside>
  );
}

// --- Card body ----------------------------------------------------------------

function ItemSettings({
  item,
  err,
  onChange,
  onPreview,
  footer,
}: {
  item: MenuItem;
  err: (path: string) => string | undefined;
  onChange: (patch: Partial<MenuItem>) => void;
  onPreview: () => void;
  footer: React.ReactNode;
}) {
  const setPromo = (patch: Partial<MenuItem["promo"]>) => onChange({ promo: { ...item.promo, ...patch } });
  // Make sure there is an editable slot for every visible column (extra columns are kept, just hidden).
  const padded = (count: number) => {
    const columns = [...item.columns];
    while (columns.length < count) columns.push({ title: "", links: [] });
    return columns;
  };
  const setGrid = (gridColumns: MenuItem["gridColumns"]) => onChange({ gridColumns, columns: padded(gridColumns) });
  const columns = item.columns.slice(0, item.gridColumns);

  return (
    <div className="border-t">
      <div className="space-y-5 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <TextInput label="Navigation label" value={item.title} error={err("title")} onChange={(title) => onChange({ title })} />
          <TextInput label="URL" value={item.url} placeholder="/categories/panjabi" error={err("url")} onChange={(url) => onChange({ url })} />
        </div>

        <Switch
          checked={item.megaMenu}
          onChange={(megaMenu) => onChange({ megaMenu, columns: padded(item.gridColumns) })}
          label="Enable Mega Menu (Full-width)"
          description="Multi-column panel with an optional promo banner."
        />

        {item.megaMenu ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-end gap-6">
              <Segmented
                label="Grid layout"
                value={item.gridColumns}
                options={[
                  { value: 2, label: "2 cols" },
                  { value: 3, label: "3 cols" },
                  { value: 4, label: "4 cols" },
                ]}
                onChange={setGrid}
              />
              <Segmented
                label="Panel background"
                value={item.panelTheme}
                options={[
                  { value: "light", label: "Light" },
                  { value: "cream", label: "Cream" },
                  { value: "emerald", label: "Emerald" },
                ]}
                onChange={(panelTheme) => onChange({ panelTheme })}
              />
              <Button type="button" variant="outline" size="sm" onClick={onPreview} className="ml-auto">
                <Eye />
                Preview
              </Button>
            </div>

            <div className={cn("grid gap-3", item.gridColumns === 2 ? "md:grid-cols-2" : item.gridColumns === 3 ? "md:grid-cols-3" : "md:grid-cols-2 xl:grid-cols-4")}>
              {columns.map((col, c) => (
                <div key={c} className="min-w-0 space-y-2 rounded-lg border bg-muted/30 p-3">
                  <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Column {c + 1}</p>
                  <Input
                    value={col.title}
                    placeholder={["By Fabric", "By Occasion", "By Fit", "Collections"][c]}
                    aria-label={`Column ${c + 1} title`}
                    className="font-medium"
                    onChange={(e) => onChange({ columns: item.columns.map((x, j) => (j === c ? { ...x, title: e.target.value } : x)) })}
                  />
                  <LinkRows
                    stacked
                    links={col.links}
                    max={12}
                    errorAt={(l, f) => err(`columns.${c}.links.${l}.${f}`)}
                    placeholders={[["Silk", "/categories/panjabi"], ["Cotton", "/categories/panjabi"], ["Kabli", "/categories/panjabi"]]}
                    onChange={(links) => onChange({ columns: item.columns.map((x, j) => (j === c ? { ...x, links } : x)) })}
                  />
                </div>
              ))}
            </div>

            <div className="space-y-4 rounded-lg border p-4">
              <Switch
                checked={item.promo.enabled}
                onChange={(enabled) => setPromo({ enabled })}
                label="Promo banner column"
                description="A tall image card on the right of the panel."
              />
              {item.promo.enabled && (
                <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                  <Field label="Banner image" hint="Portrait (4:5) works best. Large photos are resized automatically." error={err("promo.imageUrl")}>
                    <ImageUpload
                      folder="promo"
                      maxDimension={1200}
                      value={item.promo.imageUrl}
                      onChange={(imageUrl) => setPromo({ imageUrl })}
                      previewClassName="h-36 sm:w-28"
                    />
                  </Field>
                  <div className="space-y-3">
                    <TextInput label="Badge text" value={item.promo.badge} placeholder="Special 30% Off" onChange={(badge) => setPromo({ badge })} />
                    <TextInput label="Headline" value={item.promo.title} placeholder="The Eid Edit" bengali onChange={(title) => setPromo({ title })} />
                    <div className="grid grid-cols-2 gap-3">
                      <TextInput label="Button text" value={item.promo.buttonText} placeholder="Shop now" onChange={(buttonText) => setPromo({ buttonText })} />
                      <TextInput
                        label="Button link"
                        value={item.promo.buttonUrl}
                        placeholder={item.url}
                        error={err("promo.buttonUrl")}
                        onChange={(buttonUrl) => setPromo({ buttonUrl })}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
            {megaColumns(item).length === 0 && !item.promo.enabled && (
              <p className="text-xs text-muted-foreground">Add at least one link or the promo banner — empty mega menus aren’t shown.</p>
            )}
          </div>
        ) : (
          <Field label="Dropdown links" hint="Optional. Leave empty for a plain link without a dropdown.">
            <LinkRows links={item.links} max={20} errorAt={(l, f) => err(`links.${l}.${f}`)} onChange={(links) => onChange({ links })} />
          </Field>
        )}
      </div>
      {footer}
    </div>
  );
}

// --- Small controls -------------------------------------------------------------

function LinkRows({
  links,
  onChange,
  errorAt,
  max,
  placeholders,
  stacked,
}: {
  links: Link[];
  onChange: (links: Link[]) => void;
  errorAt: (index: number, field: "title" | "url") => string | undefined;
  max: number;
  placeholders?: [string, string][];
  /** Label above URL — for narrow mega-menu columns. */
  stacked?: boolean;
}) {
  const set = (i: number, patch: Partial<Link>) => onChange(links.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  return (
    <div className="space-y-1.5">
      {links.map((link, i) => {
        const error = errorAt(i, "title") ?? errorAt(i, "url");
        return (
          <div key={i} className="space-y-1">
            <div className={cn("flex min-w-0 gap-1.5", stacked ? "items-start rounded-md border bg-background p-1.5" : "items-center")}>
              <div className={cn("flex min-w-0 flex-1 gap-1.5", stacked && "flex-col")}>
                <Input
                  value={link.title}
                  placeholder={placeholders?.[i]?.[0] ?? "Label"}
                  aria-label="Link label"
                  aria-invalid={!!errorAt(i, "title")}
                  className="h-8 min-w-0 flex-1"
                  onChange={(e) => set(i, { title: e.target.value })}
                />
                <Input
                  value={link.url}
                  placeholder={placeholders?.[i]?.[1] ?? "/path"}
                  aria-label="Link URL"
                  aria-invalid={!!errorAt(i, "url")}
                  className={cn("min-w-0 flex-1 font-mono text-xs", stacked ? "h-7" : "h-8")}
                  onChange={(e) => set(i, { url: e.target.value })}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Remove link"
                className="shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => onChange(links.filter((_, j) => j !== i))}
              >
                <X />
              </Button>
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        );
      })}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={links.length >= max}
        className="text-primary"
        onClick={() => onChange([...links, { title: "", url: "/" }])}
      >
        <Plus />
        Add link
      </Button>
    </div>
  );
}
