"use client";

import {
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
import { Segmented, Switch } from "@/components/admin/appearance/controls";
import { Field, ListEditor, TextArea, TextInput, Toggle } from "@/components/admin/landing-builder/fields";
import { MediaField } from "@/components/admin/media/media-field";
import { valuePropIconMap } from "@/components/storefront/home/home-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { productSources, valuePropIcons, type HomeSection, type HomeSectionOf, type HomeSectionType } from "@/lib/validations/homepage";

export type BuilderCategory = { slug: string; name: string; nameBn: string | null };
type Category = BuilderCategory;
type Err = (path: string) => string | undefined;

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
    case "testimonials":
      return <TestimonialsEditor section={section} err={err} onChange={onChange} />;
    case "community":
      return <CommunityEditor section={section} err={err} onChange={onChange} />;
    case "productCarousel":
      return <ProductCarouselEditor section={section} categories={categories} err={err} onChange={onChange} />;
    case "richText":
      return <RichTextEditor section={section} err={err} onChange={onChange} />;
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
      create={() => ({ id: Math.random().toString(36).slice(2, 10), icon: "gem" as const, iconUrl: "", title: "", body: "", bn: "", active: true })}
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
            <Field label="Custom icon image (optional)" hint="An SVG or PNG from the Media Library replaces the icon above." error={err(`items.${i}.iconUrl`)}>
              <MediaField value={item.iconUrl} onChange={(iconUrl) => update({ iconUrl })} previewClassName="h-16 sm:w-16" />
            </Field>
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
      <Segmented
        label="Layout"
        value={section.layout}
        options={[
          { value: "bento", label: "Bento grid (5)" },
          { value: "cards", label: "Cards (up to 8)" },
        ]}
        onChange={(layout) => set({ layout })}
      />
      <Field
        label="Category tiles"
        hint={
          section.layout === "bento"
            ? "Up to five, in order — the first is the large tile. Empty = the first five categories."
            : "Up to eight, in order. Empty = the first eight categories."
        }
      >
        <ListEditor
          items={section.items}
          max={section.layout === "bento" ? 5 : 8}
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
              <Field label="Tile image (optional)" hint="Empty = the category's own image, else the illustrated tile." error={err(`items.${i}.imageUrl`)}>
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
        <Segmented
          label="Image side"
          value={section.imagePosition}
          options={[
            { value: "right", label: "Right" },
            { value: "left", label: "Left" },
          ]}
          onChange={(imagePosition) => set({ imagePosition })}
        />
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
        <SourcePicker section={section} categories={categories} err={err} onChange={set} />
      </div>
      <div className="flex flex-wrap items-end gap-6">
        <Segmented
          label="Per row (desktop)"
          value={String(section.columns) as "3" | "4" | "5" | "6"}
          options={[
            { value: "3", label: "3" },
            { value: "4", label: "4" },
            { value: "5", label: "5" },
            { value: "6", label: "6" },
          ]}
          onChange={(v) => set({ columns: Number(v) as 3 | 4 | 5 | 6 })}
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
      <Segmented
        label="Products"
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
        <Field label="Category" error={err("categorySlug")}>
          <select
            value={section.categorySlug}
            onChange={(e) => onChange({ categorySlug: e.target.value })}
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
    </>
  );
}

function ProductCarouselEditor({ section, categories, err, onChange }: EditorProps<"productCarousel"> & { categories: Category[] }) {
  const set = (patch: Partial<typeof section>) => onChange({ ...section, ...patch });
  return (
    <>
      <HeadingFields value={section} onChange={set} err={err} />
      <div className="flex flex-wrap items-end gap-6">
        <SourcePicker section={section} categories={categories} err={err} onChange={set} />
      </div>
      <div className="flex flex-wrap items-end gap-6">
        <Segmented
          label="Cards in view (desktop)"
          value={String(section.perView) as "2" | "3" | "4" | "5" | "6"}
          options={(["2", "3", "4", "5", "6"] as const).map((v) => ({ value: v, label: v }))}
          onChange={(v) => set({ perView: Number(v) })}
        />
        <Field label="Products in slider" error={err("limit")}>
          <Input type="number" min={3} max={24} value={section.limit} onChange={(e) => set({ limit: Number(e.target.value) })} className="w-24" />
        </Field>
      </div>
      <div className="flex flex-wrap items-end gap-6">
        <Switch checked={section.autoplay} onChange={(autoplay) => set({ autoplay })} label="Autoplay" description="Pauses on hover and touch." />
        <Field label="Seconds per step" error={err("interval")}>
          <Input
            type="number"
            min={2}
            max={15}
            step={0.5}
            disabled={!section.autoplay}
            value={section.interval}
            onChange={(e) => set({ interval: Number(e.target.value) })}
            className="w-24"
          />
        </Field>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <TextInput label="Link label" value={section.viewAllLabel} placeholder="View all" onChange={(viewAllLabel) => set({ viewAllLabel })} />
        <TextInput label="Link URL" value={section.viewAllUrl} placeholder="/products" error={err("viewAllUrl")} onChange={(viewAllUrl) => set({ viewAllUrl })} />
      </div>
    </>
  );
}

function RichTextEditor({ section, err, onChange }: EditorProps<"richText">) {
  const set = (patch: Partial<typeof section>) => onChange({ ...section, ...patch });
  return (
    <>
      <div className="grid gap-3 md:grid-cols-2">
        <TextInput label="Small label (eyebrow)" value={section.eyebrow} onChange={(eyebrow) => set({ eyebrow })} />
        <TextInput label="Heading" value={section.title} error={err("title")} onChange={(title) => set({ title })} />
      </div>
      <TextArea label="Text (blank line = new paragraph)" rows={5} value={section.body} error={err("body")} onChange={(body) => set({ body })} />
      <div className="grid gap-3 md:grid-cols-2">
        <TextInput label="Button label" value={section.buttonLabel} onChange={(buttonLabel) => set({ buttonLabel })} />
        <TextInput label="Button link" value={section.buttonUrl} placeholder="/products" error={err("buttonUrl")} onChange={(buttonUrl) => set({ buttonUrl })} />
      </div>
      <div className="flex flex-wrap items-end gap-6">
        <Segmented
          label="Alignment"
          value={section.align}
          options={[
            { value: "center", label: "Centre" },
            { value: "left", label: "Left" },
          ]}
          onChange={(align) => set({ align })}
        />
        <Segmented
          label="Background"
          value={section.background}
          options={[
            { value: "cream", label: "Cream" },
            { value: "plain", label: "Plain" },
            { value: "emerald", label: "Emerald" },
          ]}
          onChange={(background) => set({ background })}
        />
      </div>
    </>
  );
}
