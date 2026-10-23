"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ChevronLeft,
  ExternalLink,
  Eye,
  EyeOff,
  GripVertical,
  Loader2,
  Maximize2,
  Minimize2,
  Monitor,
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

const DEVICES = {
  desktop: { label: "Desktop", width: 1440, icon: Monitor },
  tablet: { label: "Tablet", width: 768, icon: Tablet },
  mobile: { label: "Mobile", width: 375, icon: Smartphone },
} as const;
type Device = keyof typeof DEVICES;

const PREVIEW_URL = "/admin/home-preview";

/** Shopify-style theme editor for the homepage: section tree + settings on the left, live preview right. */
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

  // --- Preview iframe messaging ---------------------------------------------------
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const post = useCallback((msg: ToPreview) => iframeRef.current?.contentWindow?.postMessage(msg, window.location.origin), []);
  const latest = useRef({ sections, selectedId });
  useEffect(() => {
    latest.current = { sections, selectedId };
    post({ type: "ribat:sections", sections, selectedId });
  }, [sections, selectedId, post]);
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== iframeRef.current?.contentWindow) return;
      if (!isMessage<FromPreview>(e.data, ["ribat:ready", "ribat:select"])) return;
      if (e.data.type === "ribat:ready") post({ type: "ribat:sections", ...latest.current });
      else {
        setSelectedId(e.data.id);
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

  // --- Section operations ---------------------------------------------------------
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
    // Insert after the selected section, else at the end.
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
        toast.success("Homepage saved — live on the storefront");
        router.refresh();
      } else {
        setErrors(result.fieldErrors);
        const m = Object.keys(result.fieldErrors)[0]?.match(/^sections\.(\d+)\./);
        if (m && sections[Number(m[1])]) setSelectedId(sections[Number(m[1])].id);
        toast.error(result.message);
      }
    });
  }

  const sectionHasError = (i: number) => Object.keys(errors).some((k) => k.startsWith(`sections.${i}.`));

  return (
    <div className="flex h-screen min-h-0 flex-col">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-background px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/appearance" aria-label="Back to Appearance">
              <ArrowLeft />
            </Link>
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
        <div className="flex items-center gap-2">
          {dirty && <span className="hidden text-xs text-amber-700 sm:inline">Unsaved changes</span>}
          <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex">
            <Link href="/" target="_blank">
              <ExternalLink /> View store
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!dirty || pending}
            onClick={() => {
              setSections(JSON.parse(saved) as HomeSection[]);
              setErrors({});
            }}
          >
            Discard
          </Button>
          <Button id="home-builder-save" size="sm" onClick={save} disabled={!dirty || pending}>
            {pending && <Loader2 className="animate-spin" />}
            Save
          </Button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Left: section tree or the selected section's settings */}
        <aside
          className={cn(
            "min-h-0 w-full shrink-0 flex-col border-r bg-background lg:flex lg:w-[380px]",
            mobileView === "controls" ? "flex" : "hidden",
          )}
        >
          {selected ? (
            <>
              <div className="flex items-center gap-2 border-b px-3 py-2.5">
                <Button variant="ghost" size="icon-sm" onClick={() => setSelectedId(null)} aria-label="Back to sections">
                  <ChevronLeft />
                </Button>
                <SectionIcon type={selected.type} />
                <p className="min-w-0 flex-1 truncate text-sm font-semibold">{SECTION_META[selected.type].label}</p>
                <Switch checked={selected.enabled} onChange={(enabled) => update(selected.id, { ...selected, enabled })} label={selected.enabled ? "Visible" : "Hidden"} />
              </div>
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
                <SectionEditor
                  section={selected}
                  categories={categories}
                  err={(path) => errors[`sections.${selectedIndex}.${path}`]}
                  onChange={(next) => update(selected.id, next)}
                />
              </div>
              <div className="flex justify-between border-t px-3 py-2">
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => remove(selected)}>
                  <Trash2 /> Remove section
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSelectedId(null)}>
                  Done
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
                <p className="px-1 pt-3 pb-1 text-[11px] font-semibold tracking-[0.15em] text-muted-foreground uppercase">Sections</p>
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
                            <span className="block truncate text-xs text-muted-foreground">{sectionSummary(section)}</span>
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
        </aside>

        {/* Right: live preview (stays mounted; full screen just re-positions it) */}
        <section
          className={cn(
            "min-w-0 flex-1 flex-col bg-muted/60 lg:flex",
            mobileView === "preview" ? "flex" : "hidden",
            fullscreen && "fixed inset-0 z-50 flex bg-neutral-900",
          )}
        >
          <div className={cn("flex shrink-0 items-center justify-center gap-2 border-b px-3 py-2", fullscreen ? "border-white/10 bg-neutral-900" : "bg-background/80")}>
            <div className="flex items-center gap-0.5 rounded-lg bg-muted p-0.5" role="radiogroup" aria-label="Device">
              {(Object.keys(DEVICES) as Device[]).map((d) => {
                const { label, width, icon: Icon } = DEVICES[d];
                return (
                  <button
                    key={d}
                    type="button"
                    role="radio"
                    aria-checked={device === d}
                    onClick={() => setDevice(d)}
                    title={`${label} · ${width}px`}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-muted-foreground transition",
                      device === d && "bg-background text-foreground shadow-sm",
                    )}
                  >
                    <Icon className="size-3.5" />
                    <span className="hidden sm:inline">{label}</span>
                    <span className="hidden font-mono text-[10px] opacity-60 xl:inline">{width}</span>
                  </button>
                );
              })}
            </div>
            <Button
              variant={fullscreen ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setFullscreen((f) => !f)}
              aria-label={fullscreen ? "Exit full screen" : "Full screen preview"}
            >
              {fullscreen ? <Minimize2 /> : <Maximize2 />}
              <span className="hidden sm:inline">{fullscreen ? "Exit full screen" : "Full screen"}</span>
            </Button>
          </div>
          <ScaledFrame width={DEVICES[device].width} device={device}>
            <iframe ref={iframeRef} src={PREVIEW_URL} title="Homepage preview" className="block size-full border-0 bg-background" />
          </ScaledFrame>
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

function SectionIcon({ type }: { type: HomeSectionType }) {
  const Icon = SECTION_META[type].icon;
  return (
    <span className="grid size-7 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
      <Icon className="size-3.5" />
    </span>
  );
}

/**
 * Renders the iframe at the device's real width (so storefront breakpoints apply) and scales it
 * down to fit the panel; the frame stays tall enough to fill the panel after scaling.
 */
function ScaledFrame({ width, device, children }: { width: number; device: Device; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setBox({ w: entry.contentRect.width, h: entry.contentRect.height }));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const GUTTER = 16;
  const scale = box.w ? Math.min(1, (box.w - GUTTER * 2) / width) : 1;
  return (
    <div ref={ref} className="relative min-h-0 flex-1 overflow-hidden">
      {box.w > 0 && (
        // Centred from the middle, then scaled about its top centre (a frame wider than the panel
        // can't be centred with auto margins).
        <div
          className={cn(
            "absolute left-1/2 overflow-hidden bg-background shadow-xl ring-1 ring-black/10",
            device !== "desktop" && "rounded-[1.75rem] ring-[6px] ring-neutral-800",
          )}
          style={{
            top: GUTTER,
            width,
            height: (box.h - GUTTER * 2) / scale,
            transform: `translateX(-50%) scale(${scale})`,
            transformOrigin: "top center",
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
