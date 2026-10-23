"use client";

import { useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { MediaDropzone, MediaThumb, useMediaUploader } from "@/components/admin/media/media-shared";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { listMedia } from "@/lib/media/client";
import type { MediaItem } from "@/lib/media/types";

/**
 * Reusable media picker: "Upload Files" + "Media Library" tabs.
 * `multiple` lets the user pick several images (in click order).
 */
export function MediaModal({
  open,
  onOpenChange,
  onSelect,
  multiple = false,
  title = "Select image",
  confirmLabel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (items: MediaItem[]) => void;
  multiple?: boolean;
  title?: string;
  confirmLabel?: string;
}) {
  const [tab, setTab] = useState<"upload" | "library">("library");
  const [items, setItems] = useState<MediaItem[] | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const q = query.trim();
  // Load (and re-search) the library while the modal is open.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const timer = setTimeout(
      async () => {
        setLoading(true);
        try {
          const list = await listMedia(q);
          if (!cancelled) setItems(list);
        } catch (e) {
          if (!cancelled) toast.error(e instanceof Error ? e.message : "Couldn't load media");
        } finally {
          if (!cancelled) setLoading(false);
        }
      },
      q ? 300 : 0,
    );
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [open, q]);

  const { upload, progress } = useMediaUploader((added) => {
    setItems((list) => [...added, ...(list ?? [])]);
    // Pre-select what was just uploaded and show it in the library.
    setSelected((s) => (multiple ? [...s, ...added.map((m) => m.id)] : [added[0].id]));
    setTab("library");
  });

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : multiple ? [...s, id] : [id]));

  function close(next: boolean) {
    onOpenChange(next);
    if (!next) {
      setSelected([]);
      setQuery("");
    }
  }

  function confirm() {
    const byId = new Map((items ?? []).map((m) => [m.id, m]));
    onSelect(selected.map((id) => byId.get(id)).filter((m): m is MediaItem => !!m));
    close(false);
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-5xl">
        <div className="space-y-1 border-b px-5 py-4 pr-12">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{multiple ? "Choose one or more images." : "Choose an image."}</DialogDescription>
        </div>
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="min-h-0 flex-1 gap-0">
          <div className="border-b px-5 py-2">
            <TabsList>
              <TabsTrigger value="upload">Upload Files</TabsTrigger>
              <TabsTrigger value="library">Media Library</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="upload" className="p-5">
            <MediaDropzone onFiles={upload} progress={progress} className="py-24" />
          </TabsContent>
          <TabsContent value="library" className="flex min-h-0 flex-col">
            <div className="flex items-center gap-2 px-5 pt-4">
              <div className="relative min-w-0 flex-1 sm:max-w-xs">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by filename…" className="pl-8" aria-label="Search media" />
              </div>
              {loading && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
            </div>
            <div className="min-h-64 flex-1 overflow-y-auto p-5">
              {items === null ? (
                <p className="py-16 text-center text-sm text-muted-foreground">Loading…</p>
              ) : items.length === 0 ? (
                <div className="py-16 text-center text-sm text-muted-foreground">
                  {q ? `No files match “${q}”.` : "The library is empty."}{" "}
                  <button type="button" className="text-primary underline" onClick={() => setTab("upload")}>
                    Upload files
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                  {items.map((item) => (
                    <MediaThumb key={item.id} item={item} selected={selected.includes(item.id)} onClick={() => toggle(item.id)} />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        <div className="flex items-center justify-between gap-3 border-t bg-muted/30 px-5 py-3">
          <span className="text-xs text-muted-foreground">
            {selected.length ? `${selected.length} selected` : multiple ? "Click images to select them" : "Click an image to select it"}
          </span>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => close(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={!selected.length} onClick={confirm}>
              {confirmLabel ?? (multiple ? "Add to gallery" : "Use image")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
