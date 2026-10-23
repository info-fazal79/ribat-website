"use client";

import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  Images,
  LayoutGrid,
  Megaphone,
  MessageSquareQuote,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { Segmented, Switch } from "@/components/admin/appearance/controls";
import { Field, ListEditor, TextArea, TextInput, Toggle } from "@/components/admin/landing-builder/fields";
import { MediaField } from "@/components/admin/media/media-field";
import { valuePropIconMap } from "@/components/storefront/home/home-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  newProductsSection,
  valuePropIcons,
  type HomeSection,
  type HomeSectionOf,
  type HomeSectionType,
} from "@/lib/validations/homepage";
import type { SettingValue } from "@/lib/validations/settings";

type HomeSettings = SettingValue<"home_sections">;
type Category = { slug: string; name: string; nameBn: string | null };
type Err = (path: string) => string | undefined;

const SECTION_META: Record<HomeSectionType, { label: string; icon: LucideIcon }> = {
  valueProps: { label: "Trust Badges", icon: ShieldCheck },
  categories: { label: "Category Showcase", icon: LayoutGrid },
  promo: { label: "Promo Banner", icon: Megaphone },
  products: { label: "Product Grid", icon: ShoppingBag },
  testimonials: { label: "Customer Reviews", icon: MessageSquareQuote },
  community: { label: "Community Grid", icon: Images },
};

const summary = (s: HomeSection) => {
  switch (s.type) {
    case "valueProps":
      return `${s.items.filter((i) => i.active).length} active badges`;
    case "categories":
      return s.items.length ? `${s.items.length} chosen categories` : "First five categories";
    case "promo":
      return s.title.replace(/\n/g, " ");
    case "products":
      return `${s.title || "Untitled"} · ${s.source === "category" ? s.categorySlug || "no category" : s.source} · ${s.columns} per row`;
    case "testimonials":
      return `${s.items.filter((i) => i.active).length} active reviews`;
    case "community":
      return `${s.handle || "No handle"} · ${s.items.length} tiles`;
  }
};

/** Appearance → Homepage: ordered, toggleable homepage sections below the hero slider. */
export function HomepageEditor({
  value,
  categories,
  errors,
  onChange,
}: {
  value: HomeSettings;
  categories: Category[];
  errors: Record<string, string>;
  onChange: (value: HomeSettings) => void;
}) {
  const { sections } = value;
  const [open, setOpen] = useState<Set<string>>(() => new Set());
  const setSections = (next: HomeSection[]) => onChange({ sections: next });
  const update = (id: string, next: HomeSection) => setSections(sections.map((s) => (s.id === id ? next : s)));
  const move = (from: number, to: number) => {
    if (to < 0 || to >= sections.length) return;
    const next = [...sections];
    const [s] = next.splice(from, 1);
    next.splice(to, 0, s);
    setSections(next);
  };
  const toggle = (id: string) =>
    setOpen((o) => {
      const next = new Set(o);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // Open sections whose fields failed validation (adjusted during render when errors change).
  const [seenErrors, setSeenErrors] = useState(errors);
  if (errors !== seenErrors) {
    setSeenErrors(errors);
    const failing = Object.keys(errors)
      .map((k) => k.match(/^homeSections\.sections\.(\d+)\./)?.[1])
      .filter((i): i is string => i !== undefined)
      .map((i) => sections[Number(i)]?.id)
      .filter((id): id is string => !!id);
    if (failing.length) setOpen((o) => new Set([...o, ...failing]));
  }

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Homepage sections</h3>
          <p className="text-xs text-muted-foreground">
            Shown below the hero slider in this order. Switch a section off to hide it; nothing is lost.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          disabled={sections.length >= 20}
          onClick={() => {
            const section = newProductsSection({ eyebrow: "Collection", title: "New product grid", titleBn: "", tabs: false });
            setSections([...sections, section]);
            setOpen((o) => new Set(o).add(section.id));
          }}
        >
          <Plus /> Add product grid
        </Button>
      </div>

      <ul className="space-y-2">
        {sections.map((section, i) => {
          const { label, icon: Icon } = SECTION_META[section.type];
          const isOpen = open.has(section.id);
          const prefix = `homeSections.sections.${i}.`;
          const err: Err = (path) => errors[prefix + path];
          const hasError = Object.keys(errors).some((k) => k.startsWith(prefix));
          return (
            <li
              key={section.id}
              className={cn(
                "min-w-0 overflow-hidden rounded-lg border bg-background",
                isOpen && "shadow-sm ring-1 ring-primary/15",
                hasError && "border-destructive",
              )}
            >
              <div className="flex items-center gap-1 pr-2">
                <button
                  type="button"
                  onClick={() => toggle(section.id)}
                  aria-expanded={isOpen}
                  className="flex min-w-0 flex-1 items-center gap-3 py-3 pl-3 text-left"
                >
                  <span className={cn("grid size-8 shrink-0 place-items-center rounded-md bg-primary/10 text-primary", !section.enabled && "opacity-40")}>
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={cn("block truncate text-sm font-medium", !section.enabled && "text-muted-foreground")}>{label}</span>
                    <span className="block truncate text-xs text-muted-foreground">{summary(section)}</span>
                  </span>
                  <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                </button>
                <div className="shrink-0 border-l pl-2">
                  <Switch
                    checked={section.enabled}
                    onChange={(enabled) => update(section.id, { ...section, enabled })}
                    label={section.enabled ? "On" : "Off"}
                  />
                </div>
                <Button type="button" variant="ghost" size="icon-xs" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Move up">
                  <ArrowUp />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => move(i, i + 1)}
                  disabled={i === sections.length - 1}
                  aria-label="Move down"
                >
                  <ArrowDown />
                </Button>
                {section.type === "products" && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => setSections(sections.filter((s) => s.id !== section.id))}
                    aria-label="Delete product grid"
                  >
                    <Trash2 />
                  </Button>
                )}
              </div>
              {isOpen && (
                <div className="space-y-4 border-t bg-muted/20 p-4">
                  <SectionEditor section={section} categories={categories} err={err} onChange={(next) => update(section.id, next)} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SectionEditor({
  section,
  categories,
  err,
  onChange,
}: {
  section: HomeSection;
  categories: Category[];
  err: Err;
  onChange: (next: HomeSection) => void;
}) {
  switch (section.type) {
    case "valueProps":
      return <ValuePropsEditor section={section} err={err} onChange={onChange} />;
    case "categories":
      return <CategoriesEditor section={section} categories={categories} err={err} onChange={onChange} />;
    case "promo":
      return <PromoEditor section={section} err={err} onChange={onChange} />;
    case "products":
      return <ProductsEditor section={section} categories={categories} err={err} onChange={onChange} />;
    case "testimonials":
      return <TestimonialsEditor section={section} err={err} onChange={onChange} />;
    case "community":
      return <CommunityEditor section={section} err={err} onChange={onChange} />;
  }
}

type EditorProps<T extends HomeSectionType> = { section: HomeSectionOf<T>; err: Err; onChange: (next: HomeSectionOf<T>) => void };

function HeadingFields<T extends { eyebrow: string; title: string; titleBn: string }>({
  value,
  onChange,
  err,
}: {
  value: T;
  onChange: (patch: Partial<T>) => void;
  err: Err;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <TextInput label="Small label (eyebrow)" value={value.eyebrow} error={err("eyebrow")} onChange={(eyebrow) => onChange({ eyebrow } as Partial<T>)} />
      <TextInput label="Title" value={value.title} error={err("title")} onChange={(title) => onChange({ title } as Partial<T>)} />
      <TextInput label="Bengali subtitle" bengali value={value.titleBn} onChange={(titleBn) => onChange({ titleBn } as Partial<T>)} />
    </div>
  );
}

function ValuePropsEditor({ section, err, onChange }: EditorProps<"valueProps">) {
  return (
    <ListEditor
      items={section.items}
      max={6}
      addLabel="Add badge"
      create={() => ({ id: Math.random().toString(36).slice(2, 10), icon: "gem" as const, title: "", body: "", bn: "", active: true })}
      onChange={(items) => onChange({ ...section, items })}
      render={(item, update, i) => {
        const Icon = valuePropIconMap[item.icon];
        return (
          <>
            <div className="grid gap-2 sm:grid-cols-[140px_1fr]">
              <Field label="Icon">
                <div className="flex items-center gap-2">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full border text-primary">
                    <Icon className="size-4" />
                  </span>
                  <select
                    value={item.icon}
                    onChange={(e) => update({ icon: e.target.value as typeof item.icon })}
                    className="h-8 w-full rounded-md border bg-background px-2 text-sm capitalize"
                  >
                    {valuePropIcons.map((key) => (
                      <option key={key} value={key}>
                        {key}
                      </option>
                    ))}
                  </select>
                </div>
              </Field>
              <TextInput label="Title" value={item.title} error={err(`items.${i}.title`)} onChange={(title) => update({ title })} />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <TextInput label="Subtitle" value={item.body} onChange={(body) => update({ body })} />
              <TextInput label="Bengali line" bengali value={item.bn} onChange={(bn) => update({ bn })} />
            </div>
            <Toggle label="Show this badge" checked={item.active} onChange={(active) => update({ active })} />
          </>
        );
      }}
    />
  );
}

function CategoriesEditor({ section, categories, err, onChange }: EditorProps<"categories"> & { categories: Category[] }) {
  const set = (patch: Partial<typeof section>) => onChange({ ...section, ...patch });
  return (
    <>
      <HeadingFields value={section} onChange={set} err={err} />
      <div className="grid gap-3 md:grid-cols-2">
        <TextInput label="Link label" value={section.linkLabel} placeholder="Shop all" onChange={(linkLabel) => set({ linkLabel })} />
        <TextInput label="Link URL" value={section.linkUrl} placeholder="/products" error={err("linkUrl")} onChange={(linkUrl) => set({ linkUrl })} />
      </div>
      <Field label="Category tiles" hint="Up to five, in order — the first is the large tile. Leave empty to show the first five categories.">
        <ListEditor
          items={section.items}
          max={5}
          addLabel="Add category tile"
          create={() => ({ slug: categories.find((c) => !section.items.some((it) => it.slug === c.slug))?.slug ?? "", imageUrl: "" })}
          onChange={(items) => set({ items })}
          render={(item, update, i) => (
            <>
              <Field label="Category" error={err(`items.${i}.slug`)}>
                <select value={item.slug} onChange={(e) => update({ slug: e.target.value })} className="h-8 w-full rounded-md border bg-background px-2 text-sm">
                  <option value="">Choose…</option>
                  {categories.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                      {c.nameBn ? ` · ${c.nameBn}` : ""}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Tile image (optional)" hint="Leave empty for the built-in illustrated tile." error={err(`items.${i}.imageUrl`)}>
                <MediaField value={item.imageUrl} onChange={(imageUrl) => update({ imageUrl })} previewClassName="h-24 sm:w-24" />
              </Field>
            </>
          )}
        />
      </Field>
    </>
  );
}

function PromoEditor({ section, err, onChange }: EditorProps<"promo">) {
  const set = (patch: Partial<typeof section>) => onChange({ ...section, ...patch });
  return (
    <>
      <div className="grid gap-3 md:grid-cols-2">
        <TextInput label="Badge / tag" value={section.eyebrow} placeholder="ATELIER · MADE IN DHAKA" onChange={(eyebrow) => set({ eyebrow })} />
        <TextInput label="Bengali line" bengali value={section.titleBn} onChange={(titleBn) => set({ titleBn })} />
      </div>
      <TextArea label="Heading (line breaks are kept)" rows={2} value={section.title} error={err("title")} onChange={(title) => set({ title })} />
      <TextArea label="Description" rows={3} value={section.body} onChange={(body) => set({ body })} />
      <div className="grid gap-3 md:grid-cols-3">
        <TextInput label="Button label" value={section.ctaLabel} onChange={(ctaLabel) => set({ ctaLabel })} />
        <TextInput label="Button link" value={section.ctaUrl} placeholder="/products" error={err("ctaUrl")} onChange={(ctaUrl) => set({ ctaUrl })} />
        <TextInput label="Small note" value={section.note} placeholder="From ৳4,850 · Limited run" onChange={(note) => set({ note })} />
      </div>
      <div className="flex flex-wrap items-end gap-6">
        <Field label="Image in the arch (optional)" hint="Leave empty for the drawn garment." error={err("imageUrl")} className="min-w-64 flex-1">
          <MediaField value={section.imageUrl} onChange={(imageUrl) => set({ imageUrl })} previewClassName="h-28 sm:w-24" />
        </Field>
        {section.imageUrl && (
          <Segmented
            label="Fit"
            value={section.imageFit}
            options={[
              { value: "contain", label: "Cut-out (fit)" },
              { value: "cover", label: "Photo (fill)" },
            ]}
            onChange={(imageFit) => set({ imageFit })}
          />
        )}
      </div>
    </>
  );
}

function ProductsEditor({ section, categories, err, onChange }: EditorProps<"products"> & { categories: Category[] }) {
  const set = (patch: Partial<typeof section>) => onChange({ ...section, ...patch });
  return (
    <>
      <HeadingFields value={section} onChange={set} err={err} />
      <div className="flex flex-wrap items-end gap-6">
        <Segmented
          label="Products"
          value={section.source}
          options={[
            { value: "featured", label: "Featured / trending" },
            { value: "all", label: "All products" },
            { value: "category", label: "One category" },
          ]}
          onChange={(source) => set({ source })}
        />
        {section.source === "category" && (
          <Field label="Category" error={err("categorySlug")}>
            <select
              value={section.categorySlug}
              onChange={(e) => set({ categorySlug: e.target.value })}
              className="h-8 w-48 rounded-md border bg-background px-2 text-sm"
            >
              <option value="">Choose…</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
        )}
      </div>
      <div className="flex flex-wrap items-end gap-6">
        <Segmented
          label="Per row (desktop)"
          value={String(section.columns) as "4" | "5" | "6"}
          options={[
            { value: "4", label: "4" },
            { value: "5", label: "5" },
            { value: "6", label: "6" },
          ]}
          onChange={(v) => set({ columns: Number(v) as 4 | 5 | 6 })}
        />
        <Field label="Products shown" hint="Initially, and per page / per “load more”." error={err("limit")}>
          <Input
            type="number"
            min={2}
            max={48}
            value={section.limit}
            onChange={(e) => set({ limit: Number(e.target.value) })}
            className="w-28"
          />
        </Field>
        <div className="flex gap-1 pb-1">
          {[1, 2, 3].map((rows) => (
            <Button key={rows} type="button" variant="outline" size="xs" onClick={() => set({ limit: rows * section.columns })}>
              {rows} row{rows > 1 && "s"}
            </Button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-6">
        <Segmented
          label="More products"
          value={section.display}
          options={[
            { value: "viewAll", label: "View all link" },
            { value: "loadMore", label: "Load more" },
            { value: "pagination", label: "Pagination" },
            { value: "none", label: "Nothing" },
          ]}
          onChange={(display) => set({ display })}
        />
        <Switch checked={section.tabs} onChange={(tabs) => set({ tabs })} label="Category tabs" description="Filter tabs above the grid." />
      </div>
      {section.display === "viewAll" && (
        <div className="grid gap-3 md:grid-cols-2">
          <TextInput label="Link label" value={section.viewAllLabel} placeholder="View all" onChange={(viewAllLabel) => set({ viewAllLabel })} />
          <TextInput
            label="Link URL"
            value={section.viewAllUrl}
            placeholder={section.source === "category" && section.categorySlug ? `/categories/${section.categorySlug}` : "/products"}
            error={err("viewAllUrl")}
            onChange={(viewAllUrl) => set({ viewAllUrl })}
          />
        </div>
      )}
    </>
  );
}

function TestimonialsEditor({ section, err, onChange }: EditorProps<"testimonials">) {
  const set = (patch: Partial<typeof section>) => onChange({ ...section, ...patch });
  return (
    <>
      <HeadingFields value={section} onChange={set} err={err} />
      <Field label="Reviews">
        <ListEditor
          items={section.items}
          addLabel="Add review"
          create={() => ({ id: Math.random().toString(36).slice(2, 10), name: "", city: "", rating: 5, quote: "", product: "", verified: true, active: true })}
          onChange={(items) => set({ items })}
          render={(r, update, i) => (
            <>
              <div className="grid gap-2 sm:grid-cols-3">
                <TextInput label="Name" value={r.name} error={err(`items.${i}.name`)} onChange={(name) => update({ name })} />
                <TextInput label="City / tagline" value={r.city} onChange={(city) => update({ city })} />
                <TextInput label="Product" value={r.product} onChange={(product) => update({ product })} />
              </div>
              <TextArea label="Review" rows={3} value={r.quote} error={err(`items.${i}.quote`)} onChange={(quote) => update({ quote })} />
              <div className="flex flex-wrap items-center gap-5">
                <Field label="Rating">
                  <select
                    value={r.rating}
                    onChange={(e) => update({ rating: Number(e.target.value) })}
                    className="h-8 rounded-md border bg-background px-2 text-sm"
                  >
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>
                        {"★".repeat(n)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Toggle label="Verified buyer badge" checked={r.verified} onChange={(verified) => update({ verified })} />
                <Toggle label="Show" checked={r.active} onChange={(active) => update({ active })} />
              </div>
            </>
          )}
        />
      </Field>
    </>
  );
}

function CommunityEditor({ section, err, onChange }: EditorProps<"community">) {
  const set = (patch: Partial<typeof section>) => onChange({ ...section, ...patch });
  return (
    <>
      <div className="grid gap-3 md:grid-cols-2">
        <TextInput label="Handle" value={section.handle} placeholder="@ribat.bd" onChange={(handle) => set({ handle })} />
        <TextInput
          label="Profile link"
          value={section.profileUrl}
          placeholder="https://instagram.com/ribat.bd"
          error={err("profileUrl")}
          onChange={(profileUrl) => set({ profileUrl })}
        />
        <TextInput label="Title" value={section.title} onChange={(title) => set({ title })} />
        <TextInput label="Bengali subtitle" bengali value={section.titleBn} onChange={(titleBn) => set({ titleBn })} />
      </div>
      <Field label="Image tiles" hint="Six fill one row on desktop. Tiles without an image show the illustrated placeholder.">
        <ListEditor
          items={section.items}
          max={12}
          addLabel="Add tile"
          create={() => ({ id: Math.random().toString(36).slice(2, 10), imageUrl: "", link: "", caption: "", likes: 0 })}
          onChange={(items) => set({ items })}
          render={(post, update, i) => (
            <>
              <MediaField value={post.imageUrl} error={err(`items.${i}.imageUrl`)} onChange={(imageUrl) => update({ imageUrl })} previewClassName="h-24 sm:w-24" />
              <div className="grid gap-2 sm:grid-cols-[1fr_1fr_100px]">
                <TextInput label="Link (optional)" value={post.link} placeholder="Post URL — defaults to the profile" error={err(`items.${i}.link`)} onChange={(link) => update({ link })} />
                <TextInput label="Caption" value={post.caption} onChange={(caption) => update({ caption })} />
                <TextInput label="Likes" type="number" value={String(post.likes)} onChange={(v) => update({ likes: Math.max(0, Number(v) || 0) })} />
              </div>
            </>
          )}
        />
      </Field>
    </>
  );
}
