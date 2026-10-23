"use client";

import { Check } from "lucide-react";
import type { HeaderLayout } from "@/lib/validations/settings";
import { cn } from "@/lib/utils";

const PRESETS: Record<HeaderLayout, { title: string; description: string }> = {
  layout_1_centered: { title: "Centered Classic", description: "Centred logo, search & icons either side, navigation on a row below." },
  layout_2_inline_standard: { title: "Inline Standard", description: "Logo left, navigation centred, icons right — one clean row." },
  layout_3_categories_dropdown: {
    title: "Categories + Search",
    description: "Logo, wide search bar and icons; below, a “Browse Categories” dropdown beside the menu.",
  },
  layout_4_split_menu: { title: "Split Menu", description: "Centred logo with the menu split evenly to its left and right." },
  layout_5_compact_search: { title: "Compact Search", description: "Minimal brand, prominent centre search, slim menu row." },
};

/** Visual chooser for the storefront header preset. */
export function HeaderLayoutPicker({ value, onChange }: { value: HeaderLayout; onChange: (layout: HeaderLayout) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">Header layout</h3>
        <p className="text-xs text-muted-foreground">
          Every preset keeps the announcement bar, mega menus, search, cart drawer and mobile menu. Phones always get the compact
          mobile header.
        </p>
      </div>
      <div role="radiogroup" aria-label="Header layout" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {(Object.keys(PRESETS) as HeaderLayout[]).map((layout, i) => {
          const selected = value === layout;
          return (
            <button
              key={layout}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(layout)}
              className={cn(
                "group relative flex flex-col gap-3 rounded-xl border bg-background p-3 text-left transition hover:border-primary/50",
                selected && "border-primary ring-1 ring-primary",
              )}
            >
              <Wireframe layout={layout} />
              <span>
                <span className="flex items-center gap-2 text-sm font-medium">
                  <span className="font-mono text-[10px] text-muted-foreground">0{i + 1}</span>
                  {PRESETS[layout].title}
                </span>
                <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{PRESETS[layout].description}</span>
              </span>
              {selected && (
                <span className="absolute top-2 right-2 grid size-5 place-items-center rounded-full bg-primary text-primary-foreground">
                  <Check className="size-3" strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// --- Wireframes ----------------------------------------------------------------
// Tiny schematic of each header: L = logo, nav = link pills, ● = icons, search = input bar.

const Logo = ({ className }: { className?: string }) => <span className={cn("h-2.5 w-10 rounded-sm bg-foreground/80", className)} />;
const Nav = ({ n = 4, className }: { n?: number; className?: string }) => (
  <span className={cn("flex gap-1.5", className)}>
    {Array.from({ length: n }, (_, i) => (
      <span key={i} className="h-1 w-5 rounded-full bg-foreground/35" />
    ))}
  </span>
);
const Icons = ({ n = 3 }: { n?: number }) => (
  <span className="flex gap-1">
    {Array.from({ length: n }, (_, i) => (
      <span key={i} className="size-2 rounded-full bg-foreground/45" />
    ))}
  </span>
);
const SearchBar = ({ className }: { className?: string }) => (
  <span className={cn("flex h-3.5 items-center rounded-full border border-foreground/25 bg-background px-1.5", className)}>
    <span className="size-1.5 rounded-full border border-foreground/40" />
  </span>
);
const Row = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <span className={cn("flex h-7 items-center gap-2 px-2.5", className)}>{children}</span>
);

function Wireframe({ layout }: { layout: HeaderLayout }) {
  return (
    <span aria-hidden className="block overflow-hidden rounded-md border bg-muted/50">
      <span className="block h-1.5 bg-primary/70" /> {/* announcement bar */}
      {layout === "layout_1_centered" && (
        <>
          <Row className="justify-between">
            <span className="size-2 rounded-full bg-foreground/45" />
            <Logo />
            <Icons />
          </Row>
          <Row className="h-5 justify-center border-t">
            <Nav n={5} />
          </Row>
        </>
      )}
      {layout === "layout_2_inline_standard" && (
        <Row className="h-9 justify-between">
          <Logo />
          <Nav n={4} />
          <Icons n={4} />
        </Row>
      )}
      {layout === "layout_3_categories_dropdown" && (
        <>
          <Row className="justify-between">
            <Logo className="shrink-0" />
            <SearchBar className="flex-1" />
            <Icons />
          </Row>
          <Row className="h-5 gap-3 border-t">
            <span className="h-3 w-12 rounded-sm bg-primary/80" />
            <Nav n={4} />
          </Row>
        </>
      )}
      {layout === "layout_4_split_menu" && (
        <Row className="h-9 justify-between">
          <Nav n={2} />
          <Logo />
          <span className="flex items-center gap-2">
            <Nav n={2} />
            <Icons n={2} />
          </span>
        </Row>
      )}
      {layout === "layout_5_compact_search" && (
        <>
          <Row className="justify-between">
            <Logo className="w-7 shrink-0" />
            <SearchBar className="h-4 flex-1 border-primary/60" />
            <Icons />
          </Row>
          <Row className="h-4 justify-center border-t">
            <Nav n={5} className="scale-90" />
          </Row>
        </>
      )}
    </span>
  );
}
