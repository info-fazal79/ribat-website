"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronsDownUp, ChevronsUpDown, Eye, GripVertical, Plus, Trash2 } from "lucide-react";
import { ColorInput, Segmented, Switch } from "@/components/admin/appearance/controls";
import { Field, TextArea, TextInput } from "@/components/admin/landing-builder/fields";
import { MediaField } from "@/components/admin/media/media-field";
import { HeroSlideView } from "@/components/storefront/home/hero-slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { newHeroSlide, type HeroSlideSetting, type SettingValue } from "@/lib/validations/settings";

type HeroSettings = SettingValue<"hero_slides">;
type Slide = HeroSlideSetting;

const MAX_SLIDES = 10;
const BG_LABEL = { solid: "Solid", gradient: "Gradient", image: "Image", video: "Video" } as const;

/** Hero Slider manager: global autoplay settings, sortable slide cards and a scaled live preview. */
export function HeroEditor({
  value,
  onChange,
  errors,
}: {
  value: HeroSettings;
  onChange: (value: HeroSettings) => void;
  errors: Record<string, string>;
}) {
  const { slides } = value;
  const [open, setOpen] = useState<Set<string>>(() => new Set());
  const [previewId, setPreviewId] = useState<string | null>(slides[0]?.id ?? null);
  const [dragId, setDragId] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const set = (patch: Partial<HeroSettings>) => onChange({ ...value, ...patch });
  const setSlides = (next: Slide[]) => set({ slides: next });
  const update = (id: string, patch: Partial<Slide>) => setSlides(slides.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const move = (from: number, to: number) => {
    if (to < 0 || to >= slides.length || from === to) return;
    const next = [...slides];
    const [s] = next.splice(from, 1);
    next.splice(to, 0, s);
    setSlides(next);
  };
  const toggle = (id: string) =>
    setOpen((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // Open slides whose fields failed validation (state adjusted during render when errors change).
  const [seenErrors, setSeenErrors] = useState(errors);
  if (errors !== seenErrors) {
    setSeenErrors(errors);
    const failing = Object.keys(errors)
      .map((k) => k.match(/^hero\.slides\.(\d+)\./)?.[1])
      .filter((i): i is string => i !== undefined)
      .map((i) => slides[Number(i)]?.id)
      .filter((id): id is string => !!id);
    if (failing.length) setOpen((s) => new Set([...s, ...failing]));
  }

  const preview = slides.find((s) => s.id === previewId) ?? slides[0];
  const activeCount = slides.filter((s) => s.active).length;

  return (
    <div className="min-w-0 space-y-6">
      {/* Live preview */}
      <div ref={previewRef} className="min-w-0 overflow-hidden rounded-xl border bg-background">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/40 px-4 py-2">
          <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Eye className="size-3.5" />
            Live preview
          </p>
          <div className="flex flex-wrap gap-1">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setPreviewId(s.id)}
                className={cn(
                  "rounded-md px-2 py-0.5 text-xs tabular-nums text-muted-foreground",
                  preview?.id === s.id && "bg-background font-medium text-foreground shadow-sm",
                  !s.active && "line-through opacity-60",
                )}
                title={s.active ? s.title : `${s.title} (inactive)`}
              >
                {String(i + 1).padStart(2, "0")}
              </button>
            ))}
          </div>
        </div>
        {preview ? (
          <ScaledPreview>
            <HeroSlideView slide={preview} active className="relative h-full w-full overflow-hidden" />
          </ScaledPreview>
        ) : (
          <p className="p-10 text-center text-sm text-muted-foreground">No slides — the storefront shows the built-in default slides.</p>
        )}
      </div>

      {/* Global settings */}
      <div className="grid gap-5 rounded-lg border p-4 sm:grid-cols-3">
        <Switch checked={value.autoplay} onChange={(autoplay) => set({ autoplay })} label="Autoplay" description="Advance slides automatically." />
        <Field label="Interval (seconds per slide)">
          <Input
            type="number"
            min={2}
            max={30}
            step={0.5}
            value={value.interval}
            disabled={!value.autoplay}
            aria-invalid={!!errors["hero.interval"]}
            onChange={(e) => set({ interval: Number(e.target.value) })}
          />
        </Field>
        <Switch
          checked={value.pauseOnHover}
          onChange={(pauseOnHover) => set({ pauseOnHover })}
          label="Pause on hover"
          description="Stop autoplay while the cursor is over the slider."
        />
      </div>

      {/* Slides */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold">Slides</h3>
            <p className="text-xs text-muted-foreground">
              {slides.length} / {MAX_SLIDES} · {activeCount} active · drag the handle to reorder
              {activeCount === 0 && " — with no active slides the built-in defaults are shown"}
            </p>
          </div>
          <div className="flex flex-wrap gap-1">
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(new Set(slides.map((s) => s.id)))}>
              <ChevronsUpDown />
              Expand all
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(new Set())}>
              <ChevronsDownUp />
              Collapse all
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={slides.length >= MAX_SLIDES}
              onClick={() => {
                const slide = newHeroSlide();
                setSlides([...slides, slide]);
                setOpen((s) => new Set(s).add(slide.id));
                setPreviewId(slide.id);
              }}
            >
              <Plus />
              Add New Slide
            </Button>
          </div>
        </div>

        <ul className="space-y-2">
          {slides.map((slide, index) => {
            const isOpen = open.has(slide.id);
            const err = (path: string) => errors[`hero.slides.${index}.${path}`];
            const hasError = Object.keys(errors).some((k) => k.startsWith(`hero.slides.${index}.`));
            return (
              <li
                key={slide.id}
                onDragOver={(e) => {
                  if (!dragId) return;
                  e.preventDefault();
                  const from = slides.findIndex((s) => s.id === dragId);
                  if (from !== index) move(from, index);
                }}
                onDrop={(e) => e.preventDefault()}
                className={cn(
                  "min-w-0 overflow-hidden rounded-lg border bg-background",
                  isOpen && "shadow-sm ring-1 ring-primary/15",
                  dragId === slide.id && "opacity-50",
                  hasError && "border-destructive",
                )}
              >
                <div className="flex items-center gap-1 pr-2">
                  <span
                    draggable
                    onDragStart={(e) => {
                      setDragId(slide.id);
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("text/plain", slide.id);
                    }}
                    onDragEnd={() => setDragId(null)}
                    className="flex cursor-grab items-center self-stretch px-2 text-muted-foreground hover:text-foreground active:cursor-grabbing"
                    aria-label={`Drag to reorder slide ${index + 1}`}
                    title="Drag to reorder"
                  >
                    <GripVertical className="size-4" />
                  </span>
                  <SlideSwatch slide={slide} />
                  <button
                    type="button"
                    onClick={() => {
                      toggle(slide.id);
                      setPreviewId(slide.id);
                    }}
                    aria-expanded={isOpen}
                    className="flex min-w-0 flex-1 items-center gap-3 py-3 pl-2 text-left"
                  >
                    <span className="min-w-0 flex-1">
                      <span className={cn("block truncate text-sm font-medium", !slide.active && "text-muted-foreground")}>{slide.title}</span>
                      <span className="block truncate text-xs text-muted-foreground">{slide.eyebrow || "No badge"}</span>
                    </span>
                    <span className="hidden shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground sm:inline">
                      {BG_LABEL[slide.background.type]}
                    </span>
                    <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                  </button>
                  <div className="shrink-0 border-l pl-2">
                    <Switch checked={slide.active} onChange={(active) => update(slide.id, { active })} label={slide.active ? "Active" : "Hidden"} />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Delete slide ${index + 1}`}
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => setSlides(slides.filter((s) => s.id !== slide.id))}
                  >
                    <Trash2 />
                  </Button>
                </div>

                {isOpen && <SlideSettings slide={slide} err={err} onChange={(patch) => update(slide.id, patch)} />}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

/** Renders the hero at desktop size (1440×700) and scales it to the container width. */
function ScaledPreview({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / 1440));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} className="relative w-full overflow-hidden" style={{ height: 700 * scale }}>
      {/* Links inside the preview must not navigate away from the editor. */}
      <div
        className="absolute top-0 left-0 origin-top-left"
        style={{ width: 1440, height: 700, transform: `scale(${scale})` }}
        onClickCapture={(e) => e.preventDefault()}
      >
        {children}
      </div>
    </div>
  );
}

function SlideSwatch({ slide }: { slide: Slide }) {
  const bg = slide.background;
  const media = bg.type === "image" ? bg.imageUrl : "";
  return (
    <span
      className="relative hidden h-9 w-14 shrink-0 overflow-hidden rounded border sm:block"
      style={{ background: bg.type === "gradient" ? `linear-gradient(135deg, ${bg.color}, ${bg.color2})` : bg.color }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- media library asset */}
      {media && <img src={media} alt="" className="size-full object-cover" />}
    </span>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 border-t px-4 py-4 first:border-t-0">
      <h4 className="text-[11px] font-semibold tracking-[0.15em] text-muted-foreground uppercase">{title}</h4>
      {children}
    </section>
  );
}

function SlideSettings({
  slide,
  err,
  onChange,
}: {
  slide: Slide;
  err: (path: string) => string | undefined;
  onChange: (patch: Partial<Slide>) => void;
}) {
  const bg = slide.background;
  const setBg = (patch: Partial<Slide["background"]>) => onChange({ background: { ...bg, ...patch } });
  const setVisual = (patch: Partial<Slide["visual"]>) => onChange({ visual: { ...slide.visual, ...patch } });

  return (
    <div className="border-t bg-muted/20">
      <Section title="Background">
        <Segmented
          label="Type"
          value={bg.type}
          options={[
            { value: "solid", label: "Solid Color" },
            { value: "gradient", label: "Gradient" },
            { value: "image", label: "Image" },
            { value: "video", label: "Video" },
          ]}
          onChange={(type) => setBg({ type })}
        />
        {bg.type === "solid" && (
          <div className="max-w-xs">
            <ColorInput label="Colour" value={bg.color} error={err("background.color")} onChange={(color) => setBg({ color })} />
          </div>
        )}
        {bg.type === "gradient" && (
          <div className="grid gap-4 sm:grid-cols-3">
            <ColorInput label="Colour 1" value={bg.color} error={err("background.color")} onChange={(color) => setBg({ color })} />
            <ColorInput label="Colour 2" value={bg.color2} error={err("background.color2")} onChange={(color2) => setBg({ color2 })} />
            <Field label="Direction">
              <select
                value={bg.direction}
                onChange={(e) => setBg({ direction: e.target.value as Slide["background"]["direction"] })}
                className="h-8 w-full rounded-md border bg-background px-2 text-sm"
              >
                <option value="radial">Radial glow (right)</option>
                <option value="to bottom">Top → bottom</option>
                <option value="to right">Left → right</option>
                <option value="to bottom right">Diagonal ↘</option>
                <option value="to top right">Diagonal ↗</option>
              </select>
            </Field>
          </div>
        )}
        {(bg.type === "image" || bg.type === "video") && (
          <div className="space-y-4">
            {bg.type === "image" ? (
              <Field label="Background image" hint="Wide landscape photo, at least 1920px." error={err("background.imageUrl")}>
                <MediaField value={bg.imageUrl} onChange={(imageUrl) => setBg({ imageUrl })} previewClassName="sm:w-48" />
              </Field>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <TextInput
                  label="Background video URL (MP4)"
                  value={bg.videoUrl}
                  placeholder="https://…/hero.mp4"
                  hint="Muted, looping, autoplays. Keep it short and under ~8 MB."
                  error={err("background.videoUrl")}
                  onChange={(videoUrl) => setBg({ videoUrl })}
                />
                <Field label="Poster image (optional)" hint="Shown while the video loads.">
                  <MediaField value={bg.imageUrl} onChange={(imageUrl) => setBg({ imageUrl })} previewClassName="sm:w-32" />
                </Field>
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={`Overlay darkness — ${bg.overlay}%`} hint="Keeps text readable over busy photos.">
                <input
                  type="range"
                  min={0}
                  max={90}
                  step={5}
                  value={bg.overlay}
                  onChange={(e) => setBg({ overlay: Number(e.target.value) })}
                  className="w-full accent-primary"
                />
              </Field>
              <ColorInput label="Fallback colour (while loading)" value={bg.color} onChange={(color) => setBg({ color })} />
            </div>
          </div>
        )}
        <Switch checked={bg.pattern} onChange={(pattern) => setBg({ pattern })} label="Islamic geometric pattern overlay" />
      </Section>

      <Section title="Text & colours">
        <div className="flex flex-wrap items-end gap-6">
          <Segmented
            label="Text colour"
            value={slide.text}
            options={[
              { value: "light", label: "Light (on dark)" },
              { value: "dark", label: "Dark (on light)" },
            ]}
            onChange={(text) => onChange({ text })}
          />
          <div className="w-56">
            <ColorInput label="Accent (badge & arch)" value={slide.accent} error={err("accent")} onChange={(accent) => onChange({ accent })} />
          </div>
        </div>
      </Section>

      <Section title="Content">
        <div className="grid gap-3 md:grid-cols-2">
          <TextInput label="Tag / badge" value={slide.eyebrow} placeholder="THE EID EDIT · 2026" onChange={(eyebrow) => onChange({ eyebrow })} />
          <TextInput
            label="Main headline"
            value={slide.title}
            placeholder="Quiet luxury for sacred moments."
            error={err("title")}
            onChange={(title) => onChange({ title })}
          />
          <TextInput
            label="Bengali subtitle"
            value={slide.titleBn}
            placeholder="পবিত্র মুহূর্তের জন্য নিঃশব্দ আভিজাত্য"
            bengali
            onChange={(titleBn) => onChange({ titleBn })}
          />
          <TextArea label="Description" value={slide.body} rows={2} onChange={(body) => onChange({ body })} />
        </div>
      </Section>

      <Section title="Buttons">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3 rounded-lg border bg-background p-3">
            <p className="text-sm font-medium">Primary button</p>
            <TextInput label="Label" value={slide.primary.label} placeholder="SHOP PANJABI" error={err("primary.label")} onChange={(label) => onChange({ primary: { ...slide.primary, label } })} />
            <TextInput label="Link" value={slide.primary.url} placeholder="/categories/panjabi" error={err("primary.url")} onChange={(url) => onChange({ primary: { ...slide.primary, url } })} />
          </div>
          <div className="space-y-3 rounded-lg border bg-background p-3">
            <Switch
              checked={slide.secondary.enabled}
              onChange={(enabled) => onChange({ secondary: { ...slide.secondary, enabled } })}
              label="Secondary button"
            />
            {slide.secondary.enabled && (
              <>
                <TextInput label="Label" value={slide.secondary.label} placeholder="EXPLORE THE EDIT" onChange={(label) => onChange({ secondary: { ...slide.secondary, label } })} />
                <TextInput label="Link" value={slide.secondary.url} placeholder="/products" error={err("secondary.url")} onChange={(url) => onChange({ secondary: { ...slide.secondary, url } })} />
              </>
            )}
          </div>
        </div>
      </Section>

      <Section title="Right-side visual">
        <div className="flex flex-wrap items-end gap-6">
          <Segmented
            label="Show"
            value={slide.visual.type}
            options={[
              { value: "illustration", label: "Garment illustration" },
              { value: "image", label: "Photo" },
              { value: "none", label: "Nothing" },
            ]}
            onChange={(type) => setVisual({ type })}
          />
          {slide.visual.type === "illustration" && (
            <Segmented
              label="Garment"
              value={slide.visual.art}
              options={[
                { value: "panjabi", label: "Panjabi" },
                { value: "thobe", label: "Thobe" },
                { value: "abaya", label: "Abaya" },
                { value: "casual", label: "Casual" },
                { value: "fragrance", label: "Attar" },
              ]}
              onChange={(art) => setVisual({ art })}
            />
          )}
          {slide.visual.type === "image" && (
            <Segmented
              label="Fit"
              value={slide.visual.fit}
              options={[
                { value: "cover", label: "Fill arch (model photo)" },
                { value: "contain", label: "Fit (cut-out PNG)" },
              ]}
              onChange={(fit) => setVisual({ fit })}
            />
          )}
        </div>
        {slide.visual.type === "image" && (
          <Field label="Model / product photo" hint="Portrait photo, or a transparent cut-out PNG. Hidden on mobile." error={err("visual.imageUrl")}>
            <MediaField value={slide.visual.imageUrl} onChange={(imageUrl) => setVisual({ imageUrl })} previewClassName="h-36 sm:w-28" />
          </Field>
        )}
      </Section>
    </div>
  );
}
