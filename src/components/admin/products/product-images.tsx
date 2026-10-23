"use client";

import { useState } from "react";
import { GripVertical, ImagePlus, Star, Trash2, X } from "lucide-react";
import { MediaModal } from "@/components/admin/media-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const MAX_IMAGES = 20;

/**
 * Featured image + gallery for the product form. `images[0]` is the featured image,
 * the rest are gallery images in display order.
 */
export function ProductImages({ images, onChange, error }: { images: string[]; onChange: (images: string[]) => void; error?: string }) {
  const [picker, setPicker] = useState<"featured" | "gallery" | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const featured = images[0] ?? null;
  const gallery = images.slice(1);

  const setFeatured = (url: string) => onChange([url, ...images.filter((u) => u !== url)]);
  const removeFeatured = () => onChange(images.slice(1));
  const setGallery = (next: string[]) => onChange(featured ? [featured, ...next.filter((u) => u !== featured)] : next);
  const moveGallery = (from: number, to: number) => {
    if (from === to || to < 0 || to >= gallery.length) return;
    const next = [...gallery];
    const [url] = next.splice(from, 1);
    next.splice(to, 0, url);
    setGallery(next);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="font-sans text-base">Featured image</CardTitle>
          <CardDescription>The main photo on product cards and the product page.</CardDescription>
        </CardHeader>
        <CardContent>
          {featured ? (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <button
                type="button"
                onClick={() => setPicker("featured")}
                className="relative aspect-[3/4] w-full max-w-48 overflow-hidden rounded-lg border bg-muted"
                aria-label="Replace featured image"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- media library asset */}
                <img src={featured} alt="Featured" className="size-full object-cover" />
              </button>
              <div className="flex flex-wrap gap-2 sm:flex-col">
                <Button type="button" variant="outline" onClick={() => setPicker("featured")}>
                  <ImagePlus />
                  Replace image
                </Button>
                <Button type="button" variant="ghost" className="text-destructive" onClick={removeFeatured}>
                  <Trash2 />
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setPicker("featured")}
              className="flex aspect-[3/4] w-full max-w-48 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed text-muted-foreground transition hover:border-primary hover:text-primary"
            >
              <ImagePlus className="size-6" />
              <span className="text-sm font-medium">Set Featured Image</span>
            </button>
          )}
          {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-sans text-base">Product gallery</CardTitle>
          <CardDescription>
            Extra angles and details. Drag to reorder · ★ makes an image the featured one.
            {!featured && " With no featured image set, the first image you add becomes the featured image."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {gallery.map((url, i) => (
              <li
                key={url}
                draggable
                onDragStart={(e) => {
                  setDragIndex(i);
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/plain", url);
                }}
                onDragOver={(e) => {
                  if (dragIndex === null) return;
                  e.preventDefault();
                  if (dragIndex !== i) {
                    moveGallery(dragIndex, i);
                    setDragIndex(i);
                  }
                }}
                onDrop={(e) => e.preventDefault()}
                onDragEnd={() => setDragIndex(null)}
                className={cn(
                  "group relative aspect-[3/4] cursor-grab overflow-hidden rounded-lg border bg-muted active:cursor-grabbing",
                  dragIndex === i && "opacity-40",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- media library asset */}
                <img src={url} alt={`Gallery image ${i + 1}`} className="pointer-events-none size-full object-cover" />
                <span className="absolute top-1 left-1 grid size-6 place-items-center rounded-full bg-background/90 text-muted-foreground opacity-0 transition group-hover:opacity-100">
                  <GripVertical className="size-3.5" />
                </span>
                <div className="absolute top-1 right-1 flex gap-1 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
                  <button
                    type="button"
                    onClick={() => setFeatured(url)}
                    className="grid size-6 place-items-center rounded-full bg-background/90 hover:text-gold"
                    aria-label="Make featured image"
                    title="Make featured"
                  >
                    <Star className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setGallery(gallery.filter((u) => u !== url))}
                    className="grid size-6 place-items-center rounded-full bg-background/90 hover:text-destructive"
                    aria-label="Remove image"
                    title="Remove"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              </li>
            ))}
            {images.length < MAX_IMAGES && (
              <li>
                <button
                  type="button"
                  onClick={() => setPicker("gallery")}
                  className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed text-muted-foreground transition hover:border-primary hover:text-primary"
                >
                  <ImagePlus className="size-6" />
                  <span className="text-xs">Add images</span>
                </button>
              </li>
            )}
          </ul>
        </CardContent>
      </Card>

      <MediaModal
        open={picker !== null}
        onOpenChange={(open) => !open && setPicker(null)}
        multiple={picker === "gallery"}
        title={picker === "gallery" ? "Add gallery images" : "Set featured image"}
        confirmLabel={picker === "gallery" ? "Add to gallery" : "Set featured image"}
        onSelect={(items) => {
          const urls = items.map((m) => m.url);
          if (picker === "featured") setFeatured(urls[0]);
          else setGallery([...gallery, ...urls.filter((u) => u !== featured && !gallery.includes(u))].slice(0, MAX_IMAGES - 1));
        }}
      />
    </>
  );
}
