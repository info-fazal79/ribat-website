"use client";

import { useEffect, useRef, useState } from "react";
import { Copy, ExternalLink, Grid3x3, ImageUp, List, Loader2, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { MediaDropzone, MediaThumb, useMediaUploader } from "@/components/admin/media/media-shared";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import { deleteMedia, listMedia } from "@/lib/media/client";
import { MEDIA_ACCEPT, formatBytes, type MediaItem } from "@/lib/media/types";
import { cn } from "@/lib/utils";

/** WordPress-style Media Library: upload, search, grid/list views and a details dialog. */
export function MediaLibrary({ initialItems }: { initialItems: MediaItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [active, setActive] = useState<MediaItem | null>(null);
  const [pageDrag, setPageDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, progress, uploading } = useMediaUploader((added) => setItems((list) => [...added, ...list]));

  const q = query.trim();
  const lastQuery = useRef(q);
  // Debounced server-side filename search (the initial list comes from the server).
  useEffect(() => {
    if (q === lastQuery.current) return;
    lastQuery.current = q;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        setItems(await listMedia(q));
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Search failed");
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [q]);

  return (
    <div
      className="relative min-w-0 space-y-4"
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes("Files")) return;
        e.preventDefault();
        setPageDrag(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPageDrag(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setPageDrag(false);
        upload(Array.from(e.dataTransfer.files));
      }}
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={MEDIA_ACCEPT}
          className="hidden"
          onChange={(e) => {
            upload(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
        <Button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="animate-spin" /> : <ImageUp />}
          {progress ? `Uploading ${Math.min(progress.done + 1, progress.total)}/${progress.total}…` : "Upload Media"}
        </Button>
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by filename…" className="pl-8" aria-label="Search media" />
          {searching && <Loader2 className="absolute top-1/2 right-2.5 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
        </div>
        <span className="text-xs text-muted-foreground">
          {items.length} item{items.length === 1 ? "" : "s"}
        </span>
        <div className="ml-auto inline-flex rounded-lg border bg-background p-0.5" role="radiogroup" aria-label="View">
          {(
            [
              { value: "grid", icon: Grid3x3, label: "Grid view" },
              { value: "list", icon: List, label: "List view" },
            ] as const
          ).map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={view === value}
              aria-label={label}
              title={label}
              onClick={() => setView(value)}
              className={cn("rounded-md p-1.5 text-muted-foreground", view === value && "bg-muted text-foreground")}
            >
              <Icon className="size-4" />
            </button>
          ))}
        </div>
      </div>

      {items.length === 0 && !searching ? (
        q ? (
          <p className="rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground">No files match “{q}”.</p>
        ) : (
          <MediaDropzone onFiles={upload} progress={progress} className="bg-card py-20" />
        )
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8">
          {items.map((item) => (
            <MediaThumb key={item.id} item={item} onClick={() => setActive(item)} />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16" />
                <TableHead>File</TableHead>
                <TableHead className="hidden sm:table-cell">Dimensions</TableHead>
                <TableHead className="hidden sm:table-cell">Size</TableHead>
                <TableHead className="hidden md:table-cell">Uploaded</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id} className="cursor-pointer" onClick={() => setActive(item)}>
                  <TableCell>
                    {/* eslint-disable-next-line @next/next/no-img-element -- media library assets on any host */}
                    <img src={item.url} alt="" loading="lazy" className="size-10 rounded border object-cover" />
                  </TableCell>
                  <TableCell className="max-w-0">
                    <p className="truncate font-medium">{item.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{item.mimeType}</p>
                  </TableCell>
                  <TableCell className="hidden tabular-nums sm:table-cell">
                    {item.width && item.height ? `${item.width} × ${item.height}` : "—"}
                  </TableCell>
                  <TableCell className="hidden tabular-nums sm:table-cell">{formatBytes(item.size)}</TableCell>
                  <TableCell className="hidden md:table-cell">{formatDate(item.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {pageDrag && (
        <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center bg-primary/10 backdrop-blur-sm">
          <div className="rounded-2xl border-2 border-dashed border-primary bg-background px-10 py-8 text-center shadow-xl">
            <ImageUp className="mx-auto size-8 text-primary" />
            <p className="mt-2 font-medium">Drop to upload</p>
          </div>
        </div>
      )}

      <MediaDetails
        item={active}
        onClose={() => setActive(null)}
        onDeleted={(id) => {
          setItems((list) => list.filter((m) => m.id !== id));
          setActive(null);
        }}
      />
    </div>
  );
}

function MediaDetails({ item, onClose, onDeleted }: { item: MediaItem | null; onClose: () => void; onDeleted: (id: string) => void }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const publicUrl = item ? new URL(item.url, window.location.origin).href : "";

  return (
    <Dialog
      open={!!item}
      onOpenChange={(open) => {
        if (!open) {
          setConfirming(false);
          onClose();
        }
      }}
    >
      <DialogContent className="max-h-[90vh] gap-0 overflow-y-auto p-0 sm:max-w-5xl">
        {item && (
          <div className="grid md:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="flex min-h-64 items-center justify-center bg-[repeating-conic-gradient(var(--muted)_0_25%,transparent_0_50%)] bg-[length:18px_18px] p-4 md:min-h-[32rem]">
              {/* eslint-disable-next-line @next/next/no-img-element -- media library assets on any host */}
              <img src={item.url} alt={item.name} className="max-h-[70vh] max-w-full object-contain shadow-sm" />
            </div>
            <div className="space-y-5 border-t p-5 md:border-t-0 md:border-l">
              <div className="space-y-1 pr-6">
                <DialogTitle className="text-base break-all">{item.name}</DialogTitle>
                <DialogDescription>Uploaded {formatDate(item.createdAt)}</DialogDescription>
              </div>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                <dt className="text-muted-foreground">Type</dt>
                <dd>{item.mimeType}</dd>
                <dt className="text-muted-foreground">Dimensions</dt>
                <dd className="tabular-nums">{item.width && item.height ? `${item.width} × ${item.height} px` : "—"}</dd>
                <dt className="text-muted-foreground">File size</dt>
                <dd className="tabular-nums">{formatBytes(item.size)}</dd>
              </dl>
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">Public URL</p>
                <div className="flex gap-1.5">
                  <Input readOnly value={publicUrl} onFocus={(e) => e.target.select()} className="font-mono text-xs" aria-label="Public URL" />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Copy URL"
                    onClick={async () => {
                      await navigator.clipboard.writeText(publicUrl);
                      toast.success("URL copied");
                    }}
                  >
                    <Copy />
                  </Button>
                </div>
                <a href={item.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                  Open original <ExternalLink className="size-3" />
                </a>
              </div>
              <div className="border-t pt-4">
                {confirming ? (
                  <div className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                    <p className="text-sm">Delete permanently? It will also be removed from any product galleries.</p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={deleting}
                        onClick={async () => {
                          setDeleting(true);
                          try {
                            const { removedFromProducts } = await deleteMedia(item.id);
                            toast.success(
                              removedFromProducts
                                ? `Deleted — removed from ${removedFromProducts} product image slot${removedFromProducts === 1 ? "" : "s"}`
                                : "Deleted",
                            );
                            setConfirming(false);
                            onDeleted(item.id);
                          } catch (e) {
                            toast.error(e instanceof Error ? e.message : "Delete failed");
                          } finally {
                            setDeleting(false);
                          }
                        }}
                      >
                        {deleting && <Loader2 className="animate-spin" />}
                        Delete
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setConfirming(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button type="button" variant="ghost" className="text-destructive" onClick={() => setConfirming(true)}>
                    <Trash2 />
                    Delete permanently
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
