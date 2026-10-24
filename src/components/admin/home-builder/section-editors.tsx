"use client";

import { useState } from "react";
import {
  ChevronDown,
  GalleryHorizontal,
  Images,
  LayoutGrid,
  Megaphone,
  MessageSquareQuote,
  ShieldCheck,
  ShoppingBag,
  Type,
  type LucideIcon,
} from "lucide-react";
import { ColorInput, Switch } from "@/components/admin/appearance/controls";
import { Field, ListEditor, TextArea, TextInput, Toggle } from "@/components/admin/landing-builder/fields";
import { MediaField } from "@/components/admin/media/media-field";
import { HERO_EFFECTS, HERO_SHAPES } from "@/components/storefront/home/hero-frame";
import { valuePropIconMap } from "@/components/storefront/home/home-icons";
import type { CardButtons } from "@/components/storefront/product-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { frameEffects, frameShapes } from "@/lib/validations/frames";
import { productSources, valuePropIcons, type HomeSection, type HomeSectionOf, type HomeSectionType } from "@/lib/validations/homepage";

/*
 * Settings panels for each homepage widget, laid out for the builder's narrow side panel:
 * one full-width field per row, grouped into collapsible sections.
 */

export type BuilderCategory = { slug: string; name: string; nameBn: string | null };
type Category = BuilderCategory;
type Err = (path: string) => string | undefined;
const newId = () => Math.random().toString(36).slice(2, 10);

/** Widget catalogue for the builder: label, icon and "Add section" description per type. */
export const SECTION_META: Record<HomeSectionType, { label: string; icon: LucideIcon; description: string }> = {
  products: { label: "Product Grid", icon: ShoppingBag, description: "Products in 3–6 columns with tabs, load more or pagination" },
  productCarousel: { label: "Product Slider", icon: GalleryHorizontal, description: "Swipeable row of products with optional autoplay" },
  categories: { label: "Category Showcase", icon: LayoutGrid, description: "Bento grid or cards of chosen categories" },
  promo: { label: "Promo Banner", icon: Megaphone, description: "Story banner with image, headline and button" },
  valueProps: { label: "Trust Badges", icon: ShieldCheck, description: "Free delivery, exchange, COD and other promises" },
  testimonials: { label: "Customer Reviews", icon: MessageSquareQuote, description: "Rated testimonials in a carousel" },
  community: { label: "Community Grid", icon: Images, description: "“Worn by our community” image tiles" },
  richText: { label: "Rich Text", icon: Type, description: "Heading, paragraphs and a button" },
};

const SOURCE_LABEL: Record<(typeof productSources)[number], string> = {
  featured: "featured",
  trending: "trending",
  all: "all products",
  category: "category",
};

/** One-line description of a section's content for the section tree. */
export function sectionSummary(s: HomeSection): string {
  switch (s.type) {
    case "valueProps":
      return `${s.items.filter((i) => i.active).length} active badges`;
    case "categories":
      return `${s.layout === "cards" ? "Cards" : "Bento"} · ${s.items.length ? `${s.items.length} chosen` : "first categories"}`;
    case "promo":
      return s.title.replace(/\n/g, " ");
    case "products":
    case "productCarousel": {
      const source = s.source === "category" ? s.categorySlug || "no category" : SOURCE_LABEL[s.source];
      const layout = s.type === "products" ? `${s.columns} per row` : `${s.perView} in view`;
      return `${s.title || "Untitled"} · ${source} · ${layout}`;
    }
    case "testimonials":
      return `${s.items.filter((i) => i.active).length} active reviews`;
    case "community":
      return `${s.handle || "No handle"} · ${s.items.length} tiles`;
    case "richText":
      return s.title || s.body.slice(0, 60) || "Empty";
  }
}

export function SectionEditor({
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
    case "productCarousel":
      return <ProductCarouselEditor section={section} categories={categories} err={err} onChange={onChange} />;
    case "testimonials":
      return <TestimonialsEditor section={section} err={err} onChange={onChange} />;
    case "community":
      return <CommunityEditor section={section} err={err} onChange={onChange} />;
    case "richText":
      return <RichTextEditor section={section} err={err} onChange={onChange} />;
  }
}

type EditorProps<T extends HomeSectionType> = { section: HomeSectionOf<T>; err: Err; onChange: (next: HomeSectionOf<T>) => void };

// --- Layout primitives -------------------------------------------------------------------

/** Collapsible settings group (card) inside the builder panel. */
function Group({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="rounded-lg border bg-background">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 px-3.5 py-3 text-left text-sm font-semibold"
      >
        {title}
        <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="space-y-4 border-t px-3.5 py-4">{children}</div>}
    </section>
  );
}

/** Full-width option buttons that wrap instead of truncating. */
function Choice<T extends string | number>({
  label,
  hint,
  value,
  options,
  onChange,
}: {
  label: string;
  hint?: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <Field label={label} hint={hint}>
      <div className="flex flex-wrap gap-1 rounded-lg border bg-muted/40 p-1" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              "min-w-[4.5rem] flex-1 rounded-md px-2.5 py-1.5 text-xs font-medium whitespace-normal text-muted-foreground transition-colors",
              value === o.value ? "bg-background text-foreground shadow-sm" : "hover:text-foreground",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </Field>
  );
}

function SelectField({
  label,
  hint,
  error,
  value,
  onChange,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  value: string | number;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <Field label={label} hint={hint} error={error}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        className="h-9 w-full rounded-md border bg-background px-2.5 text-sm aria-invalid:border-destructive"
      >
        {children}
      </select>
    </Field>
  );
}

function NumberField({
  label,
  hint,
  error,
  value,
  min,
  max,
  step,
  disabled,
  onChange,
}: {
  label: string;
  hint?: string;
  error?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  disabled?: boolean;
  onChange: (v: number) => void;
}) {
  return (
    <Field label={label} hint={hint} error={error}>
      <Input type="number" min={min} max={max} step={step} disabled={disabled} value={value} aria-invalid={!!error} onChange={(e) => onChange(Number(e.target.value))} className="w-full" />
    </Field>
  );
}

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
    <>
      <TextInput
        label="Eyebrow (small label above the title)"
        value={value.eyebrow}
        placeholder="e.g. Trending Now"
        error={err("eyebrow")}
        onChange={(eyebrow) => onChange({ eyebrow } as Partial<T>)}
      />
      <TextInput label="Title" value={value.title} placeholder="e.g. This week's most loved" error={err("title")} onChange={(title) => onChange({ title } as Partial<T>)} />
      <TextInput
        label="Bengali subtitle"
        bengali
        value={value.titleBn}
        placeholder="এই সপ্তাহের জনপ্রিয় পণ্য"
        onChange={(titleBn) => onChange({ titleBn } as Partial<T>)}
      />
    </>
  );
}

function LinkFields({
  label,
  url,
  onLabel,
  onUrl,
  err,
  labelPath,
  urlPath,
  labelPlaceholder = "View all",
  urlPlaceholder = "/products",
}: {
  label: string;
  url: string;
  onLabel: (v: string) => void;
  onUrl: (v: string) => void;
  err: Err;
  labelPath: string;
  urlPath: string;
  labelPlaceholder?: string;
  urlPlaceholder?: string;
}) {
  return (
    <>
      <TextInput label="Link text" value={label} placeholder={labelPlaceholder} error={err(labelPath)} onChange={onLabel} />
      <TextInput label="Link URL" value={url} placeholder={urlPlaceholder} hint="A /path on this site or a full https:// URL." error={err(urlPath)} onChange={onUrl} />
    </>
  );
}

/** Product data source: featured / trending / all / one category. */
function SourcePicker({
  section,
  categories,
  err,
  onChange,
}: {
  section: HomeSectionOf<"products"> | HomeSectionOf<"productCarousel">;
  categories: Category[];
  err: Err;
  onChange: (patch: { source?: (typeof productSources)[number]; categorySlug?: string }) => void;
}) {
  return (
    <>
      <Choice
        label="Show products"
        hint="Trending = best sellers of the last 60 days first."
        value={section.source}
        options={[
          { value: "featured", label: "Featured" },
          { value: "trending", label: "Trending" },
          { value: "all", label: "All" },
          { value: "category", label: "Category" },
        ]}
        onChange={(source) => onChange({ source })}
      />
      {section.source === "category" && (
        <SelectField label="Category" error={err("categorySlug")} value={section.categorySlug} onChange={(categorySlug) => onChange({ categorySlug })}>
          <option value="">Choose a category…</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
              {c.nameBn ? ` · ${c.nameBn}` : ""}
            </option>
          ))}
        </SelectField>
      )}
    </>
  );
}

/** Product card buttons on narrow cards (phones, and 5–6 column grids). */
function MobileSettings({ value, onChange }: { value: CardButtons; onChange: (v: CardButtons) => void }) {
  return (
    <Group title="Mobile Settings">
      <Choice
        label="Mobile button style"
        hint="Used when a card is too narrow for both labelled buttons; wider cards always show Quick Add and Buy Now."
        value={value}
        options={[
          { value: "compact", label: "Compact (cart icon + Buy Now)" },
          { value: "stacked", label: "Stacked (2 rows)" },
          { value: "single", label: "Buy Now only" },
        ]}
        onChange={onChange}
      />
    </Group>
  );
}

// --- Widget editors ------------------------------------------------------------------------

function ValuePropsEditor({ section, err, onChange }: EditorProps<"valueProps">) {
  return (
    <Group title="Badges" defaultOpen>
      <ListEditor
        items={section.items}
        max={6}
        addLabel="Add badge"
        create={() => ({ id: newId(), icon: "gem" as const, iconUrl: "", title: "", body: "", bn: "", active: true })}
        onChange={(items) => onChange({ ...section, items })}
        render={(item, update, i) => {
          const Icon = valuePropIconMap[item.icon];
          return (
            <div className="space-y-3">
              <Field label="Icon">
                <div className="flex items-center gap-2">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full border text-primary">
                    <Icon className="size-4" />
                  </span>
                  <select
                    value={item.icon}
                    onChange={(e) => update({ icon: e.target.value as typeof item.icon })}
                    className="h-9 w-full rounded-md border bg-background px-2.5 text-sm capitalize"
                  >
                    {valuePropIcons.map((key) => (
                      <option key={key} value={key}>
                        {key}
                      </option>
                    ))}
                  </select>
                </div>
              </Field>
              <TextInput label="Title" value={item.title} placeholder="Free Delivery" error={err(`items.${i}.title`)} onChange={(title) => update({ title })} />
              <TextInput label="Subtitle" value={item.body} placeholder="On orders over ৳3,000, nationwide" onChange={(body) => update({ body })} />
              <TextInput label="Bengali line" bengali value={item.bn} placeholder="সারা দেশে ফ্রি ডেলিভারি" onChange={(bn) => update({ bn })} />
              <Field label="Custom icon image (optional)" hint="An SVG or PNG from the Media Library replaces the icon above." error={err(`items.${i}.iconUrl`)}>
                <MediaField stacked value={item.iconUrl} onChange={(iconUrl) => update({ iconUrl })} previewClassName="h-20" />
              </Field>
              <Toggle label="Show this badge" checked={item.active} onChange={(active) => update({ active })} />
            </div>
          );
        }}
      />
    </Group>
  );
}

function CategoriesEditor({ section, categories, err, onChange }: EditorProps<"categories"> & { categories: Category[] }) {
  const set = (patch: Partial<typeof section>) => onChange({ ...section, ...patch });
  const max = section.layout === "bento" ? 5 : 8;
  return (
    <>
      <Group title="Text & Headings" defaultOpen>
        <HeadingFields value={section} onChange={set} err={err} />
      </Group>
      <Group title="Layout & Display">
        <Choice
          label="Layout"
          value={section.layout}
          options={[
            { value: "bento", label: "Bento grid (5)" },
            { value: "cards", label: "Cards (up to 8)" },
          ]}
          onChange={(layout) => set({ layout })}
        />
      </Group>
      <Group title="Content & Filters">
        <p className="text-xs text-muted-foreground">
          {section.layout === "bento"
            ? "Up to five tiles, in order — the first is the large tile."
            : "Up to eight cards, in order."}{" "}
          Leave empty to show the first categories automatically.
        </p>
        <ListEditor
          items={section.items}
          max={max}
          addLabel="Add category tile"
          create={() => ({ slug: categories.find((c) => !section.items.some((it) => it.slug === c.slug))?.slug ?? "", imageUrl: "" })}
          onChange={(items) => set({ items })}
          render={(item, update, i) => (
            <div className="space-y-3">
              <SelectField label="Category" error={err(`items.${i}.slug`)} value={item.slug} onChange={(slug) => update({ slug })}>
                <option value="">Choose a category…</option>
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                    {c.nameBn ? ` · ${c.nameBn}` : ""}
                  </option>
                ))}
              </SelectField>
              <Field label="Tile image (optional)" hint="Empty = the category's own image, else the illustrated tile." error={err(`items.${i}.imageUrl`)}>
                <MediaField stacked value={item.imageUrl} onChange={(imageUrl) => update({ imageUrl })} />
              </Field>
            </div>
          )}
        />
      </Group>
      <Group title="Button & Links">
        <LinkFields
          label={section.linkLabel}
          url={section.linkUrl}
          onLabel={(linkLabel) => set({ linkLabel })}
          onUrl={(linkUrl) => set({ linkUrl })}
          err={err}
          labelPath="linkLabel"
          urlPath="linkUrl"
          labelPlaceholder="Shop all"
        />
      </Group>
    </>
  );
}

function PromoEditor({ section, err, onChange }: EditorProps<"promo">) {
  const set = (patch: Partial<typeof section>) => onChange({ ...section, ...patch });
  const bg = section.background;
  const setBg = (patch: Partial<typeof bg>) => set({ background: { ...bg, ...patch } });
  const setFrame = (patch: Partial<typeof section.frame>) => set({ frame: { ...section.frame, ...patch } });
  return (
    <>
      <Group title="Content & Typography" defaultOpen>
        <TextInput label="Eyebrow / atelier badge" value={section.eyebrow} placeholder="ATELIER · MADE IN DHAKA" onChange={(eyebrow) => set({ eyebrow })} />
        <TextArea label="Heading (line breaks are kept)" rows={2} value={section.title} placeholder={"The Raw Silk\nCollection"} error={err("title")} onChange={(title) => set({ title })} />
        <TextInput label="Bengali subtitle" bengali value={section.titleBn} placeholder="রাজশাহীর সিল্ক, ঢাকার কারিগরের হাতে।" onChange={(titleBn) => set({ titleBn })} />
        <TextArea label="Description" rows={4} value={section.body} onChange={(body) => set({ body })} />
        <Choice
          label="Text colour"
          hint="Use dark text on light backgrounds."
          value={section.text}
          options={[
            { value: "light", label: "Light text" },
            { value: "dark", label: "Dark text" },
          ]}
          onChange={(text) => set({ text })}
        />
        <ColorInput label="Accent (badge, button, outline, pattern)" value={section.accent} error={err("accent")} onChange={(accent) => set({ accent })} />
      </Group>
      <Group title="Background & Atmosphere">
        <Choice
          label="Background type"
          value={bg.type}
          options={[
            { value: "solid", label: "Solid" },
            { value: "gradient", label: "Gradient" },
            { value: "image", label: "Image" },
            { value: "video", label: "Video" },
          ]}
          // Photos and video usually need some darkening for the text to stay readable.
          onChange={(type) => setBg({ type, ...((type === "image" || type === "video") && bg.overlay === 0 ? { overlay: 40 } : {}) })}
        />
        {bg.type === "gradient" ? (
          <>
            <ColorInput label="Start colour" value={bg.color} error={err("background.color")} onChange={(color) => setBg({ color })} />
            <ColorInput label="End colour" value={bg.color2} error={err("background.color2")} onChange={(color2) => setBg({ color2 })} />
            <Choice
              label="Gradient style"
              value={bg.gradient}
              options={[
                { value: "linear", label: "Linear" },
                { value: "radial", label: "Radial glow" },
              ]}
              onChange={(gradient) => setBg({ gradient })}
            />
            {bg.gradient === "linear" && (
              <Field label={`Angle — ${bg.angle}°`} hint="0° = bottom → top, 90° = left → right, 135° = diagonal.">
                <input type="range" min={0} max={360} step={15} value={bg.angle} onChange={(e) => setBg({ angle: Number(e.target.value) })} className="w-full accent-primary" />
              </Field>
            )}
          </>
        ) : (
          <ColorInput
            label={bg.type === "solid" ? "Colour" : "Fallback colour (while loading)"}
            value={bg.color}
            error={err("background.color")}
            onChange={(color) => setBg({ color })}
          />
        )}
        {bg.type === "image" && (
          <>
            <Field label="Background image" hint="Wide landscape photo, at least 1600px." error={err("background.imageUrl")}>
              <MediaField stacked value={bg.imageUrl} onChange={(imageUrl) => setBg({ imageUrl })} previewClassName="h-28" />
            </Field>
            <Choice
              label="Image size"
              value={bg.size}
              options={[
                { value: "cover", label: "Cover" },
                { value: "contain", label: "Contain" },
              ]}
              onChange={(size) => setBg({ size })}
            />
            <SelectField label="Image position" value={bg.position} onChange={(v) => setBg({ position: v as typeof bg.position })}>
              <option value="center">Center</option>
              <option value="top">Top</option>
              <option value="bottom">Bottom</option>
              <option value="left">Left</option>
              <option value="right">Right</option>
            </SelectField>
          </>
        )}
        {bg.type === "video" && (
          <>
            <TextInput
              label="Video URL (MP4 / WebM)"
              value={bg.videoUrl}
              placeholder="https://…/banner.mp4"
              hint="Plays muted, looping and inline. Keep it short and under ~8 MB."
              error={err("background.videoUrl")}
              onChange={(videoUrl) => setBg({ videoUrl })}
            />
            <Field label="Poster image (optional)" hint="Shown while the video loads." error={err("background.posterUrl")}>
              <MediaField stacked value={bg.posterUrl} onChange={(posterUrl) => setBg({ posterUrl })} previewClassName="h-24" />
            </Field>
          </>
        )}
        <Switch checked={bg.pattern} onChange={(pattern) => setBg({ pattern })} label="Islamic geometric pattern" description="Drawn in the accent colour over the background." />
        <ColorInput label="Overlay colour" value={bg.overlayColor} error={err("background.overlayColor")} onChange={(overlayColor) => setBg({ overlayColor })} />
        <div className="flex flex-wrap gap-1.5">
          {OVERLAY_PRESETS.map((p) => (
            <Button key={p.color} type="button" variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => setBg({ overlayColor: p.color })}>
              <span className="size-3 rounded-full border" style={{ background: p.color }} />
              {p.label}
            </Button>
          ))}
        </div>
        <Field label={`Overlay opacity — ${bg.overlay}%`} hint="Raise it to keep text readable over bright images or video.">
          <input type="range" min={0} max={100} step={5} value={bg.overlay} onChange={(e) => setBg({ overlay: Number(e.target.value) })} className="w-full accent-primary" />
        </Field>
      </Group>
      <Group title="Featured Media & Frame">
        <Field label="Featured image (optional)" hint="Leave empty for the drawn garment." error={err("imageUrl")}>
          <MediaField stacked value={section.imageUrl} onChange={(imageUrl) => set({ imageUrl })} previewClassName="h-36" />
        </Field>
        {section.imageUrl && (
          <Choice
            label="Image fit"
            value={section.imageFit}
            options={[
              { value: "contain", label: "Cut-out (fit)" },
              { value: "cover", label: "Photo (fill)" },
            ]}
            onChange={(imageFit) => set({ imageFit })}
          />
        )}
        <Field label="Frame shape">
          <div role="radiogroup" aria-label="Frame shape" className="grid grid-cols-4 gap-1.5">
            {frameShapes.map((shape) => {
              const selected = section.frame.shape === shape;
              const meta = HERO_SHAPES[shape];
              return (
                <button
                  key={shape}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setFrame({ shape })}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-md border bg-background px-1 py-2 text-[10px] leading-tight text-muted-foreground transition-colors hover:text-foreground",
                    selected && "border-primary text-foreground ring-1 ring-primary",
                  )}
                >
                  <svg viewBox="0 0 1 1" preserveAspectRatio="none" className="h-9 w-[1.6rem] overflow-visible" aria-hidden>
                    <path
                      d={meta.path}
                      fill={selected ? "color-mix(in oklch, currentColor 15%, transparent)" : "none"}
                      stroke="currentColor"
                      strokeWidth={1.5}
                      strokeDasharray={shape === "natural" ? "3 2" : undefined}
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                  <span className="text-center">{meta.label}</span>
                </button>
              );
            })}
          </div>
        </Field>
        <SelectField
          label="Animation effect"
          hint="Same effects as the Hero Slider; off for visitors who prefer reduced motion."
          value={section.frame.effect}
          onChange={(v) => setFrame({ effect: v as (typeof frameEffects)[number] })}
        >
          {/* Cinematic zoom plays on slide change, which a static banner never has. */}
          {frameEffects.filter((e) => e !== "cinematic_zoom").map((effect) => (
            <option key={effect} value={effect}>
              {HERO_EFFECTS[effect]}
            </option>
          ))}
        </SelectField>
        <Choice
          label="Image side"
          value={section.imagePosition}
          options={[
            { value: "right", label: "Right" },
            { value: "left", label: "Left" },
          ]}
          onChange={(imagePosition) => set({ imagePosition })}
        />
        <Choice
          label="Frame alignment in its column"
          value={section.frame.align}
          options={[
            { value: "start", label: "Left" },
            { value: "center", label: "Centered" },
            { value: "end", label: "Right" },
          ]}
          onChange={(align) => setFrame({ align })}
        />
        <Choice
          label="Outline"
          value={section.frame.border}
          options={[
            { value: "accent", label: "Accent (gold)" },
            { value: "white", label: "White" },
            { value: "none", label: "None" },
          ]}
          onChange={(border) => setFrame({ border })}
        />
        <Choice
          label="Shadow / glow"
          value={section.frame.shadow}
          options={[
            { value: "none", label: "None" },
            { value: "soft", label: "Soft" },
            { value: "elevated", label: "Elevated" },
            { value: "glow", label: "Accent glow" },
          ]}
          onChange={(shadow) => setFrame({ shadow })}
        />
      </Group>
      <Group title="Button & Call to Action">
        <LinkFields
          label={section.ctaLabel}
          url={section.ctaUrl}
          onLabel={(ctaLabel) => set({ ctaLabel })}
          onUrl={(ctaUrl) => set({ ctaUrl })}
          err={err}
          labelPath="ctaLabel"
          urlPath="ctaUrl"
          labelPlaceholder="Discover the collection"
        />
        <Choice
          label="Button style"
          value={section.ctaStyle}
          options={[
            { value: "solid", label: "Solid" },
            { value: "outline", label: "Outline" },
            { value: "link", label: "Text link" },
          ]}
          onChange={(ctaStyle) => set({ ctaStyle })}
        />
        <TextInput label="Small note beside the button" value={section.note} placeholder="From ৳4,850 · Limited run of 200" onChange={(note) => set({ note })} />
      </Group>
    </>
  );
}

const OVERLAY_PRESETS = [
  { label: "Emerald", color: "#0b1a16" },
  { label: "Black", color: "#000000" },
  { label: "Navy", color: "#0f1b2d" },
];

function ProductsEditor({ section, categories, err, onChange }: EditorProps<"products"> & { categories: Category[] }) {
  const set = (patch: Partial<typeof section>) => onChange({ ...section, ...patch });
  return (
    <>
      <Group title="Text & Headings" defaultOpen>
        <HeadingFields value={section} onChange={set} err={err} />
      </Group>
      <Group title="Content & Filters">
        <SourcePicker section={section} categories={categories} err={err} onChange={set} />
        <Switch checked={section.tabs} onChange={(tabs) => set({ tabs })} label="Category tabs" description="Filter tabs above the grid." />
      </Group>
      <Group title="Layout & Display">
        <Choice
          label="Products per row (desktop)"
          value={String(section.columns) as "3" | "4" | "5" | "6"}
          options={(["3", "4", "5", "6"] as const).map((v) => ({ value: v, label: v }))}
          onChange={(v) => set({ columns: Number(v) as 3 | 4 | 5 | 6 })}
        />
        <NumberField
          label="Products shown"
          hint="Initially, and per page / per “load more”."
          error={err("limit")}
          value={section.limit}
          min={2}
          max={48}
          onChange={(limit) => set({ limit })}
        />
        <div className="flex flex-wrap gap-1.5">
          {[1, 2, 3].map((rows) => (
            <Button key={rows} type="button" variant="outline" size="sm" className="flex-1" onClick={() => set({ limit: rows * section.columns })}>
              {rows} row{rows > 1 && "s"} ({rows * section.columns})
            </Button>
          ))}
        </div>
      </Group>
      <MobileSettings value={section.mobileButtons} onChange={(mobileButtons) => set({ mobileButtons })} />
      <Group title="Button & Links">
        <Choice
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
        {section.display === "viewAll" && (
          <LinkFields
            label={section.viewAllLabel}
            url={section.viewAllUrl}
            onLabel={(viewAllLabel) => set({ viewAllLabel })}
            onUrl={(viewAllUrl) => set({ viewAllUrl })}
            err={err}
            labelPath="viewAllLabel"
            urlPath="viewAllUrl"
            urlPlaceholder={section.source === "category" && section.categorySlug ? `/categories/${section.categorySlug}` : "/products"}
          />
        )}
      </Group>
    </>
  );
}

function ProductCarouselEditor({ section, categories, err, onChange }: EditorProps<"productCarousel"> & { categories: Category[] }) {
  const set = (patch: Partial<typeof section>) => onChange({ ...section, ...patch });
  return (
    <>
      <Group title="Text & Headings" defaultOpen>
        <HeadingFields value={section} onChange={set} err={err} />
      </Group>
      <Group title="Content & Filters">
        <SourcePicker section={section} categories={categories} err={err} onChange={set} />
        <NumberField label="Products in the slider" error={err("limit")} value={section.limit} min={3} max={24} onChange={(limit) => set({ limit })} />
      </Group>
      <Group title="Layout & Display">
        <Choice
          label="Cards in view (desktop)"
          hint="Phones show about 1½ cards, tablets about 2½."
          value={String(section.perView) as "2" | "3" | "4" | "5" | "6"}
          options={(["2", "3", "4", "5", "6"] as const).map((v) => ({ value: v, label: v }))}
          onChange={(v) => set({ perView: Number(v) })}
        />
        <Switch checked={section.autoplay} onChange={(autoplay) => set({ autoplay })} label="Autoplay" description="Pauses on hover and touch." />
        <NumberField
          label="Seconds per step"
          error={err("interval")}
          value={section.interval}
          min={2}
          max={15}
          step={0.5}
          disabled={!section.autoplay}
          onChange={(interval) => set({ interval })}
        />
      </Group>
      <MobileSettings value={section.mobileButtons} onChange={(mobileButtons) => set({ mobileButtons })} />
      <Group title="Button & Links">
        <LinkFields
          label={section.viewAllLabel}
          url={section.viewAllUrl}
          onLabel={(viewAllLabel) => set({ viewAllLabel })}
          onUrl={(viewAllUrl) => set({ viewAllUrl })}
          err={err}
          labelPath="viewAllLabel"
          urlPath="viewAllUrl"
        />
      </Group>
    </>
  );
}

function TestimonialsEditor({ section, err, onChange }: EditorProps<"testimonials">) {
  const set = (patch: Partial<typeof section>) => onChange({ ...section, ...patch });
  return (
    <>
      <Group title="Text & Headings" defaultOpen>
        <HeadingFields value={section} onChange={set} err={err} />
      </Group>
      <Group title="Content & Filters">
        <ListEditor
          items={section.items}
          addLabel="Add review"
          create={() => ({ id: newId(), name: "", city: "", rating: 5, quote: "", product: "", verified: true, active: true })}
          onChange={(items) => set({ items })}
          render={(r, update, i) => (
            <div className="space-y-3">
              <TextInput label="Customer name" value={r.name} error={err(`items.${i}.name`)} onChange={(name) => update({ name })} />
              <TextInput label="City / tagline" value={r.city} placeholder="Dhaka" onChange={(city) => update({ city })} />
              <TextInput label="Product" value={r.product} placeholder="Product they bought" onChange={(product) => update({ product })} />
              <TextArea label="Review" rows={4} value={r.quote} error={err(`items.${i}.quote`)} onChange={(quote) => update({ quote })} />
              <SelectField label="Rating" value={r.rating} onChange={(v) => update({ rating: Number(v) })}>
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {"★".repeat(n)} ({n})
                  </option>
                ))}
              </SelectField>
              <Toggle label="Verified buyer badge" checked={r.verified} onChange={(verified) => update({ verified })} />
              <Toggle label="Show this review" checked={r.active} onChange={(active) => update({ active })} />
            </div>
          )}
        />
      </Group>
    </>
  );
}

function CommunityEditor({ section, err, onChange }: EditorProps<"community">) {
  const set = (patch: Partial<typeof section>) => onChange({ ...section, ...patch });
  return (
    <>
      <Group title="Text & Headings" defaultOpen>
        <TextInput label="Social handle" value={section.handle} placeholder="@ribat.bd" onChange={(handle) => set({ handle })} />
        <TextInput label="Title" value={section.title} placeholder="Worn by our community" onChange={(title) => set({ title })} />
        <TextInput label="Bengali subtitle" bengali value={section.titleBn} onChange={(titleBn) => set({ titleBn })} />
      </Group>
      <Group title="Content & Filters">
        <p className="text-xs text-muted-foreground">Six tiles fill one row on desktop. Tiles without an image show the illustrated placeholder.</p>
        <ListEditor
          items={section.items}
          max={12}
          addLabel="Add tile"
          create={() => ({ id: newId(), imageUrl: "", link: "", caption: "", likes: 0 })}
          onChange={(items) => set({ items })}
          render={(post, update, i) => (
            <div className="space-y-3">
              <Field label="Image" error={err(`items.${i}.imageUrl`)}>
                <MediaField stacked value={post.imageUrl} onChange={(imageUrl) => update({ imageUrl })} />
              </Field>
              <TextInput label="Link (optional)" value={post.link} placeholder="Post URL — defaults to the profile" error={err(`items.${i}.link`)} onChange={(link) => update({ link })} />
              <TextInput label="Caption" value={post.caption} onChange={(caption) => update({ caption })} />
              <NumberField label="Likes" value={post.likes} min={0} max={10_000_000} onChange={(v) => update({ likes: Math.max(0, v || 0) })} />
            </div>
          )}
        />
      </Group>
      <Group title="Button & Links">
        <TextInput
          label="Profile link"
          value={section.profileUrl}
          placeholder="https://instagram.com/ribat.bd"
          hint="Used by the “Follow” link and tiles without their own link."
          error={err("profileUrl")}
          onChange={(profileUrl) => set({ profileUrl })}
        />
      </Group>
    </>
  );
}

function RichTextEditor({ section, err, onChange }: EditorProps<"richText">) {
  const set = (patch: Partial<typeof section>) => onChange({ ...section, ...patch });
  return (
    <>
      <Group title="Text & Headings" defaultOpen>
        <TextInput label="Eyebrow (small label)" value={section.eyebrow} placeholder="Our story" onChange={(eyebrow) => set({ eyebrow })} />
        <TextInput label="Heading" value={section.title} error={err("title")} onChange={(title) => set({ title })} />
        <TextArea label="Text (blank line = new paragraph)" rows={6} value={section.body} error={err("body")} onChange={(body) => set({ body })} />
      </Group>
      <Group title="Layout & Display">
        <Choice
          label="Alignment"
          value={section.align}
          options={[
            { value: "center", label: "Centre" },
            { value: "left", label: "Left" },
          ]}
          onChange={(align) => set({ align })}
        />
        <Choice
          label="Background"
          value={section.background}
          options={[
            { value: "cream", label: "Cream" },
            { value: "plain", label: "Plain" },
            { value: "emerald", label: "Emerald" },
          ]}
          onChange={(background) => set({ background })}
        />
      </Group>
      <Group title="Button & Links">
        <LinkFields
          label={section.buttonLabel}
          url={section.buttonUrl}
          onLabel={(buttonLabel) => set({ buttonLabel })}
          onUrl={(buttonUrl) => set({ buttonUrl })}
          err={err}
          labelPath="buttonLabel"
          urlPath="buttonUrl"
          labelPlaceholder="Shop the collection"
        />
      </Group>
    </>
  );
}
