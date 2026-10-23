"use client";

import {
  CircleHelp,
  Copy,
  Eye,
  EyeOff,
  GripVertical,
  Images,
  LayoutGrid,
  MessageSquareQuote,
  Package,
  PanelBottom,
  PanelTop,
  Plus,
  Settings2,
  ShoppingCart,
  Table2,
  Timer,
  Trash2,
  Type,
  type LucideIcon,
} from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { blockCatalog } from "@/lib/landing/templates";
import type { LandingSection, LandingSectionType } from "@/lib/validations/landing-page";
import { cn } from "@/lib/utils";

export const blockIcons: Record<LandingSectionType, LucideIcon> = {
  hero: PanelTop,
  benefits: LayoutGrid,
  gallery: Images,
  offers: Package,
  comparison: Table2,
  countdown: Timer,
  reviews: MessageSquareQuote,
  faq: CircleHelp,
  checkout: ShoppingCart,
  stickyBar: PanelBottom,
  richText: Type,
};

/** One-line description of a block's content for layer rows and hover labels. */
export function blockSummary(section: LandingSection): string | undefined {
  switch (section.type) {
    case "hero":
      return section.props.headline;
    case "richText":
      return section.props.html.slice(0, 40);
    case "stickyBar":
      return section.props.buttonLabel;
    case "countdown":
      return section.props.label;
    default:
      return section.props.title;
  }
}

/** Drag-reorder state shared by the canvas and the layers list. `dropIndex` is an insertion index (0…n). */
export type DragState = {
  dragId: string | null;
  dropIndex: number | null;
  start: (id: string, e: React.DragEvent) => void;
  over: (index: number, e: React.DragEvent) => void;
  drop: () => void;
  end: () => void;
};

/** A section on the canvas: selection outline, floating toolbar, drop indicators. */
export function CanvasBlock({
  section,
  index,
  last,
  selected,
  hasError,
  drag,
  onSelect,
  onDuplicate,
  onToggleHidden,
  onDelete,
  canDuplicate,
  children,
}: {
  section: LandingSection;
  index: number;
  /** Last block: also shows the drop line below it. */
  last: boolean;
  selected: boolean;
  hasError: boolean;
  drag: DragState;
  onSelect: () => void;
  onDuplicate: () => void;
  onToggleHidden: () => void;
  onDelete: () => void;
  canDuplicate: boolean;
  /** Rendered block, or null when hidden. */
  children: React.ReactNode;
}) {
  const Icon = blockIcons[section.type];
  const label = blockCatalog[section.type].label;
  const dragging = drag.dragId === section.id;

  return (
    <div
      id={`canvas-block-${section.id}`}
      className={cn("group/block relative scroll-mt-4", dragging && "opacity-40")}
      onDragOver={(e) => drag.over(index, e)}
      onDrop={(e) => {
        e.preventDefault();
        drag.drop();
      }}
      // Select on any click inside; links must not navigate away from the builder.
      onClickCapture={(e) => {
        if ((e.target as HTMLElement).closest("a[href]")) e.preventDefault();
        onSelect();
      }}
    >
      {drag.dropIndex === index && <DropLine position="top" />}
      {last && drag.dropIndex === index + 1 && <DropLine position="bottom" />}

      {children ?? (
        <div className="flex items-center justify-center gap-2 border-y border-dashed bg-muted/70 py-3 text-xs text-muted-foreground">
          <EyeOff className="size-3.5" /> {label} — hidden on the live page
        </div>
      )}

      {/* Outline sits above the content so it's visible over full-bleed backgrounds. */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 z-20 transition-[box-shadow]",
          selected
            ? "shadow-[inset_0_0_0_2px_var(--color-primary)]"
            : hasError
              ? "shadow-[inset_0_0_0_2px_var(--color-destructive)]"
              : "group-hover/block:shadow-[inset_0_0_0_2px_color-mix(in_oklch,var(--color-primary)_45%,transparent)]",
        )}
      />

      {/* Block label (top-left) */}
      <span
        className={cn(
          "pointer-events-none absolute top-0 left-0 z-30 flex items-center gap-1.5 rounded-br-md bg-primary px-2 py-1 font-sans text-[11px] font-medium text-primary-foreground opacity-0 transition-opacity group-hover/block:opacity-100",
          selected && "opacity-100",
          hasError && !selected && "bg-destructive opacity-100",
        )}
      >
        <Icon className="size-3" /> {label}
      </span>

      {/* Floating toolbar (top-right) */}
      <div
        className={cn(
          "absolute top-2 right-2 z-30 flex items-center gap-0.5 rounded-lg border bg-background/95 p-0.5 font-sans text-foreground shadow-lg backdrop-blur transition-opacity",
          selected ? "opacity-100" : "opacity-0 group-hover/block:opacity-100 focus-within:opacity-100",
        )}
        onClickCapture={(e) => e.stopPropagation()}
      >
        <span
          draggable
          onDragStart={(e) => drag.start(section.id, e)}
          onDragEnd={drag.end}
          className="grid size-7 cursor-grab place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing"
          title="Drag to move"
          aria-label={`Drag to move ${label}`}
        >
          <GripVertical className="size-4" />
        </span>
        <ToolButton label="Edit settings" onClick={onSelect}>
          <Settings2 />
        </ToolButton>
        <ToolButton label={canDuplicate ? "Duplicate" : "Only one allowed per page"} onClick={onDuplicate} disabled={!canDuplicate}>
          <Copy />
        </ToolButton>
        <ToolButton label={section.hidden ? "Show on page" : "Hide from page"} onClick={onToggleHidden}>
          {section.hidden ? <EyeOff /> : <Eye />}
        </ToolButton>
        <ToolButton label="Delete" onClick={onDelete} destructive>
          <Trash2 />
        </ToolButton>
      </div>
    </div>
  );
}

function ToolButton({
  label,
  onClick,
  disabled,
  destructive,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "grid size-7 place-items-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4",
        destructive && "hover:bg-destructive/10 hover:text-destructive",
      )}
    >
      {children}
    </button>
  );
}

function DropLine({ position }: { position: "top" | "bottom" }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-x-0 z-40 h-1 rounded-full bg-primary shadow-[0_0_0_3px_white]", position === "top" ? "-top-0.5" : "-bottom-0.5")}
    />
  );
}

/** Hover strip between blocks with a "+" that opens the Add Block drawer at that position. */
export function InsertSlot({ onClick }: { onClick: () => void }) {
  return (
    <div className="group/slot relative z-30 h-0">
      {/* Taller invisible hit area so the button is easy to reach between sections (under the button). */}
      <div className="absolute inset-x-0 -top-3 h-6" />
      <button
        type="button"
        onClick={onClick}
        aria-label="Insert block here"
        className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full bg-primary px-2.5 py-1 font-sans text-[11px] font-medium text-primary-foreground opacity-0 shadow-lg transition group-hover/slot:opacity-100 focus-visible:opacity-100 hover:scale-105"
      >
        <Plus className="size-3.5" /> Add block
      </button>
    </div>
  );
}

/** Drawer listing every block type; single-instance blocks are disabled once on the page. */
export function AddBlockDrawer({
  open,
  onOpenChange,
  position,
  total,
  existing,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Insertion index, shown as a 1-based position. */
  position: number;
  total: number;
  existing: LandingSectionType[];
  onAdd: (type: LandingSectionType) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle>Add block</SheetTitle>
          <SheetDescription>
            {position >= total ? "Adds to the end of the page." : `Inserts at position ${position + 1} of ${total + 1}.`}
          </SheetDescription>
        </SheetHeader>
        <div className="grid grid-cols-2 gap-2 overflow-y-auto p-4">
          {(Object.keys(blockCatalog) as LandingSectionType[]).map((type, i) => {
            const Icon = blockIcons[type];
            const { label, description, single } = blockCatalog[type];
            const taken = single && existing.includes(type);
            return (
              <button
                key={type}
                type="button"
                disabled={taken}
                onClick={() => onAdd(type)}
                className="group flex flex-col items-start gap-2 rounded-xl border bg-card p-3 text-left transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md disabled:pointer-events-none disabled:opacity-45"
              >
                <span className="flex w-full items-center justify-between">
                  <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="size-4" />
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                </span>
                <span className="text-sm font-medium">{label}</span>
                <span className="text-xs leading-snug text-muted-foreground">{taken ? "Already on this page" : description}</span>
              </button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
