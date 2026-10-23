"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Eye,
  EyeOff,
  GripVertical,
  Loader2,
  Maximize2,
  Minimize2,
  Monitor,
  PanelLeftClose,
  PanelLeftOpen,
  Pin,
  PinOff,
  Plus,
  Smartphone,
  Tablet,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { saveHomeSections } from "@/app/(admin)/admin/appearance/builder/actions";
import { Switch } from "@/components/admin/appearance/controls";
import { isMessage, type FromPreview, type ToPreview } from "@/components/admin/home-builder/protocol";
import { SECTION_META, SectionEditor, sectionSummary, type BuilderCategory } from "@/components/admin/home-builder/section-editors";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { newHomeSection, type HomeSection, type HomeSectionType } from "@/lib/validations/homepage";
import { cn } from "@/lib/utils";

/** Device viewports. Desktop fills the canvas height; tablet/phone use a fixed screen size. */
const DEVICES = {
  desktop: { label: "Desktop", width: 1440, height: null, bezel: 0, icon: Monitor },
  tablet: { label: "Tablet", width: 768, height: 1024, bezel: 14, icon: Tablet },
  mobile: { label: "Mobile", width: 375, height: 812, bezel: 12, icon: Smartphone },
} as const;
type Device = keyof typeof DEVICES;

const PANEL = { min: 360, max: 520, default: 420 } as const;
const PREVIEW_URL = "/admin/home-preview";

/** Shopify/Elementor-style homepage editor: section tree + settings on the left, live preview right. */
export function HomeBuilder({ initial, categories }: { initial: HomeSection[]; categories: BuilderCategory[] }) {
  const router = useRouter();
  const [sections, setSections] = useState(initial);
  const [saved, setSaved] = useState(() => JSON.stringify(initial));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [device, setDevice] = useState<Device>("desktop");
  const [fullscreen, setFullscreen] = useState(false);
  const [mobileView, setMobileView] = useState<"controls" | "preview">("controls");
  const [adding, setAdding] = useState(false);
  const [pending, startTransition] = useTransition();
  const dirty = JSON.stringify(sections) !== saved;
  const selectedIndex = sections.findIndex((s) => s.id === selectedId);
  const selected = selectedIndex >= 0 ? sections[selectedIndex] : null;

  // Panel: open/closed, docked/floating, resizable (desktop only).
  const [panelOpen, setPanelOpen] = useState(true);
  const [floating, setFloating] = useState(false);
  const [panelWidth, setPanelWidth] = useState<number>(PANEL.default);
  const [resizing, setResizing] = useState(false);
  const panelRef = useRef<HTMLElement>(null);

  // --- Preview iframe messaging (draft changes stream to the preview as you type) ---------
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const post = useCallback((msg: ToPreview) => iframeRef.current?.contentWindow?.postMessage(msg, window.location.origin), []);
  // Full screen is a clean inspection view: no selection outline.
  const previewSelected = fullscreen ? null : selectedId;
  const latest = useRef({ sections, selectedId: previewSelected });
  useEffect(() => {
    latest.current = { sections, selectedId: previewSelected };
    post({ type: "ribat:sections", sections, selectedId: previewSelected });
  }, [sections, previewSelected, post]);
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== iframeRef.current?.contentWindow) return;
      if (!isMessage<FromPreview>(e.data, ["ribat:ready", "ribat:select"])) return;
      if (e.data.type === "ribat:ready") post({ type: "ribat:sections", ...latest.current });
      else {
        setSelectedId(e.data.id);
        setPanelOpen(true);
        setMobileView("controls");
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [post]);

  // Warn before leaving with unsaved changes; Ctrl/Cmd+S saves; Escape leaves full screen.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        document.getElementById("home-builder-save")?.click();
      } else if (e.key === "Escape") setFullscreen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // --- Section operations ---------------------------------------------------------------
  const update = (id: string, next: HomeSection) => setSections((all) => all.map((s) => (s.id === id ? next : s)));
  const move = (from: number, to: number) => {
    if (to < 0 || to >= sections.length || from === to) return;
    const next = [...sections];
    const [s] = next.splice(from, 1);
    next.splice(to, 0, s);
    setSections(next);
  };
  const select = (id: string) => {
    setSelectedId(id);
    post({ type: "ribat:scroll-to", id });
  };
  const remove = (section: HomeSection) => {
    const before = sections;
    setSections(sections.filter((s) => s.id !== section.id));
    if (selectedId === section.id) setSelectedId(null);
    toast(`${SECTION_META[section.type].label} removed`, { action: { label: "Undo", onClick: () => setSections(before) } });
  };
  const add = (type: HomeSectionType) => {
    const section = newHomeSection(type);
    const at = selectedIndex >= 0 ? selectedIndex + 1 : sections.length;
    const next = [...sections];
    next.splice(at, 0, section);
    setSections(next);
    setAdding(false);
    // Let the preview render it before scrolling there.
    window.setTimeout(() => select(section.id), 150);
  };

  // Drag & drop in the section tree; dropIndex is an insertion index (0…n).
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const endDrag = () => {
    setDragId(null);
    setDropIndex(null);
  };
  const drop = () => {
    const from = sections.findIndex((s) => s.id === dragId);
    if (from >= 0 && dropIndex !== null) move(from, dropIndex > from ? dropIndex - 1 : dropIndex);
    endDrag();
  };

  function save() {
    startTransition(async () => {
      const result = await saveHomeSections({ sections });
      if (result.ok) {
        setErrors({});
        setSaved(JSON.stringify(sections));
        toast.success("Changes saved — live on the storefront");
        router.refresh();
      } else {
        setErrors(result.fieldErrors);
        const m = Object.keys(result.fieldErrors)[0]?.match(/^sections\.(\d+)\./);
        if (m && sections[Number(m[1])]) {
          setSelectedId(sections[Number(m[1])].id);
          setPanelOpen(true);
        }
        toast.error(result.message);
      }
    });
  }
  function discard() {
    setSections(JSON.parse(saved) as HomeSection[]);
    setErrors({});
    toast("Changes discarded — back to the last saved version");
  }

  // Panel resize: drag the right edge (the iframe ignores the pointer meanwhile).
  const onResizeStart = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setResizing(true);
  };
  const onResizeMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!resizing || !panelRef.current) return;
    const left = panelRef.current.getBoundingClientRect().left;
    setPanelWidth(Math.round(Math.min(PANEL.max, Math.max(PANEL.min, e.clientX - left))));
  };
  const onResizeEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    setResizing(false);
  };

  const sectionHasError = (i: number) => Object.keys(errors).some((k) => k.startsWith(`sections.${i}.`));

  return (
    <div className={cn("flex h-screen min-h-0 flex-col", resizing && "cursor-col-resize select-none")}>
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-background px-3 py-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/appearance?tab=builder" aria-label="Back to Appearance">
              <ArrowLeft />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:inline-flex"
            onClick={() => setPanelOpen((o) => !o)}
            aria-label={panelOpen ? "Hide settings panel" : "Show settings panel"}
            title={panelOpen ? "Hide settings panel" : "Show settings panel"}
          >
            {panelOpen ? <PanelLeftClose /> : <PanelLeftOpen />}
          </Button>
          <div className="min-w-0">
            <p className="truncate font-medium">Homepage Builder</p>
            <p className="text-[11px] text-muted-foreground">
              {sections.filter((s) => s.enabled).length} of {sections.length} sections visible
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-muted p-0.5 lg:hidden" role="radiogroup" aria-label="View">
          {(["controls", "preview"] as const).map((v) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={mobileView === v}
              onClick={() => setMobileView(v)}
              className={cn("rounded-md px-3 py-1 text-xs font-medium text-muted-foreground", mobileView === v && "bg-background text-foreground shadow-sm")}
            >
              {v === "controls" ? "Sections" : "Preview"}
            </button>
          ))}
        </div>
        <div className="hidden items-center gap-0.5 rounded-lg bg-muted p-0.5 lg:flex" role="radiogroup" aria-label="Device">
          <DeviceButtons device={device} onChange={setDevice} />
        </div>
        <div className="flex items-center gap-2">
          {dirty && <span className="hidden text-xs text-amber-700 xl:inline">Unsaved changes</span>}
          <Button variant="ghost" size="sm" onClick={() => setFullscreen(true)} className="hidden lg:inline-flex">
            <Maximize2 /> Full screen
          </Button>
          <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex">
            <Link href="/" target="_blank">
              <ExternalLink /> View store
            </Link>
          </Button>
          <Button variant="outline" size="sm" disabled={!dirty || pending} onClick={discard}>
            Discard
          </Button>
          <Button id="home-builder-save" size="sm" onClick={save} disabled={!dirty || pending}>
            {pending && <Loader2 className="animate-spin" />}
            Save changes
          </Button>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1">
        {/* Settings panel: docked or floating over the canvas; resizable on desktop. */}
        <aside
          ref={panelRef}
          style={{ "--panel-w": `${panelWidth}px` } as React.CSSProperties}
          className={cn(
            "min-h-0 w-full flex-col bg-background lg:w-[var(--panel-w)]",
            mobileView === "controls" ? "flex" : "hidden",
            panelOpen ? "lg:flex" : "lg:hidden",
            floating
              ? "lg:absolute lg:top-3 lg:bottom-3 lg:left-3 lg:z-30 lg:overflow-hidden lg:rounded-xl lg:border lg:shadow-2xl"
              : "lg:relative lg:shrink-0 lg:border-r",
          )}
        >
          <div className="flex items-center gap-1 border-b px-3 py-2">
            {selected ? (
              <>
                <Button variant="ghost" size="icon-sm" onClick={() => setSelectedId(null)} aria-label="Back to sections">
                  <ChevronLeft />
                </Button>
                <SectionIcon type={selected.type} />
                <p className="min-w-0 flex-1 truncate pl-1 text-sm font-semibold">{SECTION_META[selected.type].label}</p>
              </>
            ) : (
              <p className="flex-1 px-1 text-sm font-semibold">Sections</p>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              className="hidden lg:inline-flex"
              onClick={() => setFloating((f) => !f)}
              aria-label={floating ? "Dock panel to the side" : "Float panel over the preview"}
              title={floating ? "Dock to side" : "Float panel"}
            >
              {floating ? <PinOff /> : <Pin />}
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="hidden lg:inline-flex"
              onClick={() => setPanelOpen(false)}
              aria-label="Collapse settings panel"
              title="Collapse panel"
            >
              <ChevronLeft />
            </Button>
          </div>

          {selected ? (
            <>
              <div className="flex items-center justify-between gap-3 border-b bg-muted/30 px-4 py-2.5">
                <p className="min-w-0 text-xs text-muted-foreground">{SECTION_META[selected.type].description}</p>
                <Switch
                  checked={selected.enabled}
                  onChange={(enabled) => update(selected.id, { ...selected, enabled })}
                  label={selected.enabled ? "Visible" : "Hidden"}
                />
              </div>
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
                <SectionEditor
                  key={selected.id}
                  section={selected}
                  categories={categories}
                  err={(path) => errors[`sections.${selectedIndex}.${path}`]}
                  onChange={(next) => update(selected.id, next)}
                />
              </div>
              <div className="flex justify-between gap-2 border-t px-3 py-2">
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => remove(selected)}>
                  <Trash2 /> Remove section
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSelectedId(null)}>
                  <ChevronLeft /> All sections
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto p-3">
                <p className="px-1 pb-1 text-[11px] font-semibold tracking-[0.15em] text-muted-foreground uppercase">Hero slider</p>
                <Link
                  href="/admin/appearance?tab=hero"
                  className="flex items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground hover:border-primary hover:text-foreground"
                >
                  Always first — edit in Appearance → Hero Slider
                </Link>
                <p className="px-1 pt-3 pb-1 text-[11px] font-semibold tracking-[0.15em] text-muted-foreground uppercase">Homepage sections</p>
                {sections.length === 0 && <p className="px-1 py-6 text-center text-sm text-muted-foreground">No sections — add one below.</p>}
                <ul onDragOver={(e) => dragId && e.preventDefault()} onDrop={drop}>
                  {sections.map((section, i) => (
                    <li
                      key={section.id}
                      onDragOver={(e) => {
                        if (!dragId) return;
                        e.preventDefault();
                        const rect = e.currentTarget.getBoundingClientRect();
                        setDropIndex(e.clientY < rect.top + rect.height / 2 ? i : i + 1);
                      }}
                      className={cn("relative py-0.5", dragId === section.id && "opacity-40")}
                    >
                      {dropIndex === i && <span className="absolute inset-x-0 -top-px h-0.5 rounded bg-primary" />}
                      {dropIndex === i + 1 && i === sections.length - 1 && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded bg-primary" />}
                      <div
                        className={cn(
                          "flex items-center gap-1 rounded-lg border bg-card p-1.5 transition hover:border-primary/50",
                          !section.enabled && "opacity-55",
                          sectionHasError(i) && "border-destructive",
                        )}
                      >
                        <span
                          draggable
                          onDragStart={(e) => {
                            setDragId(section.id);
                            e.dataTransfer.effectAllowed = "move";
                            e.dataTransfer.setData("text/plain", section.id);
                          }}
                          onDragEnd={endDrag}
                          className="grid size-7 shrink-0 cursor-grab place-items-center text-muted-foreground active:cursor-grabbing"
                          aria-label="Drag to reorder"
                          title="Drag to reorder"
                        >
                          <GripVertical className="size-4" />
                        </span>
                        <button type="button" onClick={() => select(section.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                          <SectionIcon type={section.type} />
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium">{SECTION_META[section.type].label}</span>
                            <span className="block truncate text-xs text-muted-foreground" title={sectionSummary(section)}>
                              {sectionSummary(section)}
                            </span>
                          </span>
                        </button>
                        <Button variant="ghost" size="icon-xs" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Move up">
                          <ArrowUp />
                        </Button>
                        <Button variant="ghost" size="icon-xs" onClick={() => move(i, i + 1)} disabled={i === sections.length - 1} aria-label="Move down">
                          <ArrowDown />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => update(section.id, { ...section, enabled: !section.enabled })}
                          aria-label={section.enabled ? "Hide section" : "Show section"}
                          title={section.enabled ? "Visible — click to hide" : "Hidden — click to show"}
                        >
                          {section.enabled ? <Eye /> : <EyeOff />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => remove(section)}
                          aria-label="Remove section"
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="border-t p-3">
                <Button className="w-full" onClick={() => setAdding(true)} disabled={sections.length >= 30}>
                  <Plus /> Add section
                </Button>
              </div>
            </>
          )}

          {/* Resize handle (desktop) */}
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize settings panel"
            aria-valuemin={PANEL.min}
            aria-valuemax={PANEL.max}
            aria-valuenow={panelWidth}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") setPanelWidth((w) => Math.max(PANEL.min, w - 20));
              if (e.key === "ArrowRight") setPanelWidth((w) => Math.min(PANEL.max, w + 20));
            }}
            onPointerDown={onResizeStart}
            onPointerMove={onResizeMove}
            onPointerUp={onResizeEnd}
            onPointerCancel={onResizeEnd}
            onDoubleClick={() => setPanelWidth(PANEL.default)}
            title="Drag to resize · double-click to reset"
            className={cn(
              "absolute inset-y-0 -right-1 z-10 hidden w-2 cursor-col-resize lg:block",
              "after:absolute after:inset-y-0 after:left-1/2 after:w-px after:-translate-x-1/2 after:bg-transparent after:transition-colors hover:after:bg-primary focus-visible:outline-none focus-visible:after:bg-primary",
              resizing && "after:bg-primary",
            )}
          />
        </aside>

        {/* Re-open tab when the panel is collapsed */}
        {!panelOpen && (
          <button
            type="button"
            onClick={() => setPanelOpen(true)}
            className="absolute top-1/2 left-0 z-20 hidden -translate-y-1/2 items-center gap-1 rounded-r-lg border border-l-0 bg-background py-3 pr-1.5 pl-1 text-xs font-medium shadow-md hover:bg-muted lg:flex"
            aria-label="Show settings panel"
          >
            <ChevronRight className="size-4" />
            <span className="[writing-mode:vertical-rl]">Sections</span>
          </button>
        )}

        {/* Live preview canvas. Full screen re-positions the same element so the iframe never reloads. */}
        <section
          className={cn(
            "min-w-0 flex-1 flex-col lg:flex",
            mobileView === "preview" ? "flex" : "hidden",
            fullscreen ? cn("fixed inset-0 z-[60] flex", device === "desktop" ? "bg-background" : "bg-neutral-900") : "bg-muted/60",
          )}
        >
          {fullscreen && (
            <div className="absolute top-3 right-3 z-10 flex items-center gap-2 rounded-xl border bg-background/95 p-1 shadow-xl backdrop-blur">
              <div className="flex items-center gap-0.5 rounded-lg bg-muted p-0.5" role="radiogroup" aria-label="Device">
                <DeviceButtons device={device} onChange={setDevice} />
              </div>
              <Button size="sm" variant="secondary" onClick={() => setFullscreen(false)}>
                <Minimize2 /> Exit <kbd className="ml-1 hidden rounded border px-1 font-mono text-[10px] sm:inline">Esc</kbd>
              </Button>
            </div>
          )}
          {!fullscreen && (
            <div className="flex shrink-0 items-center justify-center gap-2 border-b bg-background/80 px-3 py-1.5 lg:hidden">
              <div className="flex items-center gap-0.5 rounded-lg bg-muted p-0.5" role="radiogroup" aria-label="Device">
                <DeviceButtons device={device} onChange={setDevice} />
              </div>
              <Button variant="ghost" size="icon-sm" onClick={() => setFullscreen(true)} aria-label="Full screen preview">
                <Maximize2 />
              </Button>
            </div>
          )}
          <DeviceFrame device={device} edgeToEdge={fullscreen && device === "desktop"} blockPointer={resizing}>
            <iframe ref={iframeRef} src={PREVIEW_URL} title="Homepage preview" className="block size-full border-0 bg-background" />
          </DeviceFrame>
        </section>
      </div>

      <Sheet open={adding} onOpenChange={setAdding}>
        <SheetContent side="left" className="w-full gap-0 sm:max-w-md">
          <SheetHeader className="border-b">
            <SheetTitle>Add section</SheetTitle>
            <SheetDescription>
              {selected ? `Inserted after “${SECTION_META[selected.type].label}”.` : "Added to the end of the homepage."}
            </SheetDescription>
          </SheetHeader>
          <div className="grid grid-cols-2 gap-2 overflow-y-auto p-4">
            {(Object.keys(SECTION_META) as HomeSectionType[]).map((type) => {
              const { label, description, icon: Icon } = SECTION_META[type];
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => add(type)}
                  className="group flex flex-col items-start gap-2 rounded-xl border bg-card p-3 text-left transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
                >
                  <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="size-4" />
                  </span>
                  <span className="text-sm font-medium">{label}</span>
                  <span className="text-xs leading-snug text-muted-foreground">{description}</span>
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function DeviceButtons({ device, onChange }: { device: Device; onChange: (d: Device) => void }) {
  return (
    <>
      {(Object.keys(DEVICES) as Device[]).map((d) => {
        const { label, width, icon: Icon } = DEVICES[d];
        return (
          <button
            key={d}
            type="button"
            role="radio"
            aria-checked={device === d}
            onClick={() => onChange(d)}
            title={`${label} · ${width}px`}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-muted-foreground transition",
              device === d ? "bg-background text-foreground shadow-sm" : "hover:text-foreground",
            )}
          >
            <Icon className="size-3.5" />
            <span className="hidden sm:inline">{label}</span>
            <span className="hidden font-mono text-[10px] opacity-60 xl:inline">{width}</span>
          </button>
        );
      })}
    </>
  );
}

function SectionIcon({ type }: { type: HomeSectionType }) {
  const Icon = SECTION_META[type].icon;
  return (
    <span className="grid size-7 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
      <Icon className="size-3.5" />
    </span>
  );
}

/**
 * Shows the iframe at the device's real viewport width (so storefront breakpoints apply), scaled
 * to fit the canvas. Tablet and phone get a fixed screen height and a device bezel; desktop fills
 * the canvas height. `edgeToEdge` = unscaled, full-bleed desktop (full screen mode). The element
 * tree never changes shape, so the iframe isn't reloaded when switching devices or modes.
 */
function DeviceFrame({
  device,
  edgeToEdge,
  blockPointer,
  children,
}: {
  device: Device;
  edgeToEdge: boolean;
  blockPointer: boolean;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setBox({ w: entry.contentRect.width, h: entry.contentRect.height }));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const spec = DEVICES[device];
  const gutter = edgeToEdge ? 0 : 24;
  const availW = Math.max(1, box.w - gutter * 2);
  const availH = Math.max(1, box.h - gutter * 2);
  const bezel = edgeToEdge ? 0 : spec.bezel;
  const screenW = edgeToEdge ? box.w : spec.width;
  const outerW = screenW + bezel * 2;
  const scale = edgeToEdge ? 1 : spec.height ? Math.min(1, availW / outerW, availH / (spec.height + bezel * 2)) : Math.min(1, availW / outerW);
  const screenH = edgeToEdge ? box.h : spec.height ?? availH / scale;
  const label = `${spec.width}${spec.height ? ` × ${spec.height}` : ""} · ${Math.round(scale * 100)}%`;

  return (
    <div ref={ref} className="relative min-h-0 flex-1 overflow-hidden" style={{ visibility: box.w ? "visible" : "hidden" }}>
      <div
        className={cn(
          "absolute left-1/2 transition-[width,height] duration-300",
          device === "desktop" && !edgeToEdge && "overflow-hidden rounded-md shadow-xl ring-1 ring-black/10",
          device === "tablet" && !edgeToEdge && "rounded-[2rem] bg-neutral-900 shadow-2xl ring-1 ring-black/40",
          device === "mobile" && !edgeToEdge && "rounded-[2.75rem] bg-neutral-900 shadow-2xl ring-1 ring-black/40",
        )}
        style={{
          top: gutter,
          width: outerW,
          height: screenH + bezel * 2,
          padding: bezel,
          transform: `translateX(-50%) scale(${scale})`,
          transformOrigin: "top center",
        }}
      >
        {device === "mobile" && !edgeToEdge && (
          <span aria-hidden className="absolute top-[5px] left-1/2 z-10 h-[3px] w-16 -translate-x-1/2 rounded-full bg-neutral-700" />
        )}
        <div
          className={cn(
            "size-full overflow-hidden bg-background",
            device === "tablet" && !edgeToEdge && "rounded-[1.25rem]",
            device === "mobile" && !edgeToEdge && "rounded-[2rem]",
            blockPointer && "pointer-events-none",
          )}
        >
          {children}
        </div>
      </div>
      {!edgeToEdge && (
        <span className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-background/90 px-2.5 py-0.5 font-mono text-[10px] text-muted-foreground shadow-sm">
          {label}
        </span>
      )}
    </div>
  );
}
