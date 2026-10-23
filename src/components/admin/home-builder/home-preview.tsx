"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { EyeOff } from "lucide-react";
import { z } from "zod";
import { isMessage, type FromPreview, type ToPreview } from "@/components/admin/home-builder/protocol";
import { HeroSlider } from "@/components/storefront/home/hero-slider";
import { HomeSections, type HomeCatalog } from "@/components/storefront/home/home-sections";
import type { HeroProduct } from "@/lib/hero";
import { homeSection, type HomeSection } from "@/lib/validations/homepage";
import type { SettingValue } from "@/lib/validations/settings";
import { cn } from "@/lib/utils";

const sectionsSchema = z.array(homeSection);
const noopSubscribe = () => () => {};

/** The storefront homepage, re-rendered live from the builder's draft (inside its iframe). */
export function HomePreview({
  initial,
  catalog,
  hero,
  heroProducts,
}: {
  initial: HomeSection[];
  catalog: HomeCatalog;
  hero: SettingValue<"hero_slides">;
  heroProducts: HeroProduct[];
}) {
  const [sections, setSections] = useState(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Inside the builder's iframe? (false on the server, so hydration matches.)
  const embedded = useSyncExternalStore(
    noopSubscribe,
    () => window.parent !== window,
    () => false,
  );

  useEffect(() => {
    if (window.parent === window) return;
    const post = (msg: FromPreview) => window.parent.postMessage(msg, window.location.origin);
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || !isMessage<ToPreview>(e.data, ["ribat:sections", "ribat:scroll-to"])) return;
      if (e.data.type === "ribat:sections") {
        const parsed = sectionsSchema.safeParse(e.data.sections);
        if (parsed.success) setSections(parsed.data);
        setSelectedId(e.data.selectedId);
      } else {
        document.getElementById(`preview-${e.data.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };
    window.addEventListener("message", onMessage);
    post({ type: "ribat:ready" });
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const select = (id: string) => window.parent.postMessage({ type: "ribat:select", id } satisfies FromPreview, window.location.origin);

  return (
    <main className="flex-1">
      <HeroSlider settings={hero} products={heroProducts} />
      <HomeSections
        sections={sections}
        catalog={catalog}
        wrap={(section, node) => (
          <div
            id={`preview-${section.id}`}
            className="group/section relative scroll-mt-2"
            // Clicking selects the section in the builder; links must not navigate the preview away.
            onClickCapture={(e) => {
              if (!embedded) return;
              if ((e.target as HTMLElement).closest("a[href]")) e.preventDefault();
              select(section.id);
            }}
          >
            {node ?? (
              <div className="flex items-center justify-center gap-2 border-y border-dashed bg-muted/60 py-4 text-xs text-muted-foreground">
                <EyeOff className="size-3.5" /> Hidden section — not shown on the store
              </div>
            )}
            {embedded && (
              <div
                aria-hidden
                className={cn(
                  "pointer-events-none absolute inset-0 z-30 transition-shadow",
                  section.id === selectedId
                    ? "shadow-[inset_0_0_0_3px_#b8862f]"
                    : "group-hover/section:shadow-[inset_0_0_0_2px_rgba(184,134,47,0.55)]",
                )}
              />
            )}
          </div>
        )}
      />
    </main>
  );
}
