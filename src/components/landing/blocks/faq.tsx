"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { SectionTitle } from "@/components/landing/blocks/content-blocks";
import type { LandingSection } from "@/lib/validations/landing-page";
import { cn } from "@/lib/utils";

type FaqProps = Extract<LandingSection, { type: "faq" }>["props"];

export function FaqBlock({ props }: { props: FaqProps }) {
  const [open, setOpen] = useState<number | null>(0);
  if (props.items.length === 0) return null;

  return (
    <section className="bg-secondary/50 px-5 py-14 @3xl:py-20">
      <div className="mx-auto max-w-2xl">
        {props.title && <SectionTitle>{props.title}</SectionTitle>}
        <div className="space-y-3">
          {props.items.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={i} className={cn("rounded-2xl border bg-card shadow-sm transition", isOpen && "border-primary/40")}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 p-5 text-left font-bengali font-semibold"
                >
                  {item.question}
                  <Plus
                    className={cn(
                      "size-5 shrink-0 text-primary transition-transform duration-300",
                      isOpen && "rotate-45",
                    )}
                  />
                </button>
                {/* grid-rows 0fr→1fr animates height without measuring */}
                <div
                  className={cn(
                    "grid transition-[grid-template-rows] duration-300 ease-out",
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                  )}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 font-bengali leading-relaxed text-muted-foreground">{item.answer}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
