"use client";

import { useRef, useState } from "react";
import { Check, ImageUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { uploadMedia } from "@/lib/media/client";
import { MEDIA_ACCEPT, formatBytes, type MediaItem } from "@/lib/media/types";
import { cn } from "@/lib/utils";

/** Uploads files one by one (each request stays under the body limit) and reports progress. */
export function useMediaUploader(onUploaded: (items: MediaItem[]) => void) {
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  async function upload(files: File[]) {
    const images = files.filter((f) => f.type.startsWith("image/"));
    if (images.length < files.length) toast.error("Only image files can be uploaded.");
    if (!images.length) return;
    setProgress({ done: 0, total: images.length });
    const uploaded: MediaItem[] = [];
    for (const [i, file] of images.entries()) {
      try {
        uploaded.push(await uploadMedia(file));
      } catch (e) {
        toast.error(e instanceof Error ? e.message : `${file.name}: upload failed`);
      }
      setProgress({ done: i + 1, total: images.length });
    }
    setProgress(null);
    if (uploaded.length) {
      toast.success(`${uploaded.length} file${uploaded.length === 1 ? "" : "s"} uploaded`);
      onUploaded(uploaded);
    }
  }

  return { upload, progress, uploading: progress !== null };
}

export function MediaDropzone({
  onFiles,
  progress,
  className,
}: {
  onFiles: (files: File[]) => void;
  progress: { done: number; total: number } | null;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  return (
    <button
      type="button"
      disabled={!!progress}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        onFiles(Array.from(e.dataTransfer.files));
      }}
      className={cn(
        "flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-12 text-center transition-colors hover:bg-muted/50",
        dragging && "border-primary bg-primary/5",
        className,
      )}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={MEDIA_ACCEPT}
        className="hidden"
        onChange={(e) => {
          onFiles(Array.from(e.target.files ?? []));
          e.target.value = "";
        }}
      />
      {progress ? <Loader2 className="size-7 animate-spin text-muted-foreground" /> : <ImageUp className="size-7 text-muted-foreground" />}
      <span className="text-sm">
        {progress ? (
          `Uploading ${Math.min(progress.done + 1, progress.total)} of ${progress.total}…`
        ) : (
          <>
            <span className="font-medium text-primary">Click to upload</span> or drag & drop images
          </>
        )}
      </span>
      <span className="text-xs text-muted-foreground">PNG, JPG, WEBP, GIF, AVIF or SVG · large photos are resized to 2400px</span>
    </button>
  );
}

export function MediaThumb({
  item,
  selected,
  onClick,
  className,
}: {
  item: MediaItem;
  selected?: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      title={item.name}
      className={cn(
        "group relative flex min-w-0 flex-col overflow-hidden rounded-lg border bg-background text-left transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        selected && "ring-2 ring-primary",
        className,
      )}
    >
      <div className="aspect-square w-full bg-[repeating-conic-gradient(var(--muted)_0_25%,transparent_0_50%)] bg-[length:14px_14px]">
        {/* eslint-disable-next-line @next/next/no-img-element -- media library assets on any host */}
        <img src={item.url} alt={item.name} loading="lazy" className="size-full object-contain" />
      </div>
      <div className="space-y-0.5 border-t px-2 py-1.5">
        <p className="truncate text-xs font-medium">{item.name}</p>
        <p className="text-[11px] text-muted-foreground tabular-nums">
          {item.width && item.height ? `${item.width} × ${item.height} · ` : ""}
          {formatBytes(item.size)}
        </p>
      </div>
      {selected && (
        <span className="absolute top-1.5 right-1.5 grid size-6 place-items-center rounded-full bg-primary text-primary-foreground shadow">
          <Check className="size-3.5" />
        </span>
      )}
    </button>
  );
}
