"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Loader2, Search, X } from "lucide-react";
import { ProductArt } from "@/components/storefront/art";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatBDT } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { SearchResult } from "@/server/services/catalog";

const SUGGESTIONS = ["Panjabi", "Thobe", "Abaya", "Silk", "Attar"];

/**
 * Header search: icon trigger (or a search-bar–styled trigger for the search-led header layouts)
 * + overlay with debounced live results.
 */
export function SearchModal({ className, variant = "icon" }: { className?: string; variant?: "icon" | "bar" }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);

  const q = query.trim();

  // Debounced fetch; aborts in-flight requests when the query changes.
  useEffect(() => {
    if (q.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: controller.signal });
        const data = (await res.json()) as { results: SearchResult[] };
        setResults(data.results);
        setActive(0);
      } catch (e) {
        if ((e as Error).name !== "AbortError") setResults([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q]);

  const shown = q.length < 2 ? [] : results;
  const busy = loading && q.length >= 2;

  function go(slug: string) {
    setOpen(false);
    router.push(`/products/${slug}`);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <DialogTrigger asChild>
        {variant === "bar" ? (
          <button
            type="button"
            className={cn(
              "flex h-11 w-full items-center gap-3 rounded-full border bg-muted/40 pr-1.5 pl-4 text-left text-sm text-muted-foreground transition hover:border-foreground/30 hover:bg-background",
              className,
            )}
          >
            <Search className="size-4 shrink-0" />
            <span className="flex-1 truncate">
              Search panjabi, thobe, abaya… <span className="font-bengali">/ পণ্য খুঁজুন</span>
            </span>
            <span className="hidden h-8 items-center rounded-full bg-primary px-4 text-xs font-medium tracking-wider text-primary-foreground uppercase sm:flex">
              Search
            </span>
          </button>
        ) : (
          <Button variant="ghost" size="icon" aria-label="Search" className={className}>
            <Search />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          inputRef.current?.focus();
        }}
        className="top-0 max-w-none translate-y-0 gap-0 rounded-none border-x-0 border-t-0 p-0 sm:top-[12vh] sm:max-w-2xl sm:rounded-xl sm:border"
      >
        <DialogTitle className="sr-only">Search products</DialogTitle>
        <div className="flex items-center gap-3 border-b px-5">
          <Search className="size-5 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(a + 1, shown.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              } else if (e.key === "Enter" && shown[active]) {
                e.preventDefault();
                go(shown[active].slug);
              }
            }}
            placeholder="Search panjabi, abaya, attar…"
            aria-label="Search products"
            className="h-16 min-w-0 flex-1 bg-transparent font-heading text-xl outline-none placeholder:text-muted-foreground/60"
          />
          {busy && <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />}
          <Button variant="ghost" size="icon" aria-label="Close search" onClick={() => setOpen(false)}>
            <X />
          </Button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto">
          {q.length < 2 ? (
            <div className="space-y-3 p-5">
              <p className="text-[11px] tracking-[0.2em] text-muted-foreground uppercase">Popular searches</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setQuery(s)}
                    className="rounded-full border px-4 py-1.5 text-sm transition-colors hover:border-primary hover:text-primary"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : shown.length === 0 ? (
            !busy && <p className="p-8 text-center text-sm text-muted-foreground">No products match “{q}”.</p>
          ) : (
            <ul className="divide-y" role="listbox" aria-label="Search results">
              {shown.map((r, i) => (
                <li key={r.slug} role="option" aria-selected={i === active}>
                  <Link
                    href={`/products/${r.slug}`}
                    onClick={() => setOpen(false)}
                    onMouseEnter={() => setActive(i)}
                    className={cn("flex items-center gap-4 px-5 py-3 transition-colors", i === active && "bg-muted/60")}
                  >
                    <div className="size-16 shrink-0 overflow-hidden bg-muted">
                      {r.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element -- product images on arbitrary hosts
                        <img src={r.imageUrl} alt="" className="size-full object-cover" />
                      ) : (
                        <ProductArt kind={r.art} color={r.color} className="size-full" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      {r.category && (
                        <p className="text-[10px] tracking-[0.2em] text-muted-foreground uppercase">{r.category}</p>
                      )}
                      <p className="truncate font-heading text-lg leading-tight">{r.name}</p>
                      {r.nameBn && <p className="truncate font-bengali text-xs text-muted-foreground">{r.nameBn}</p>}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold tabular-nums">{formatBDT(r.price)}</p>
                      {r.compareAtPrice && r.compareAtPrice > r.price && (
                        <p className="text-xs text-muted-foreground tabular-nums line-through">{formatBDT(r.compareAtPrice)}</p>
                      )}
                    </div>
                    <ArrowRight className="hidden size-4 shrink-0 text-muted-foreground sm:block" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
