"use client";

import { useRef, useState } from "react";
import { ImageUp, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ACCEPT = ".png,.jpg,.jpeg,.svg,.webp,.ico,image/png,image/jpeg,image/svg+xml,image/webp,image/x-icon";

/** Resizes large PNG/JPG/WEBP photos in the browser so embedded (base64) images stay small. */
async function shrink(file: File, max: number): Promise<File> {
  if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 300 * 1024) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.85));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".webp", { type: "image/webp" });
  } catch {
    return file;
  }
}

/** Click / drag & drop image uploader backed by /api/admin/upload. */
export function ImageUpload({
  value,
  onChange,
  folder,
  maxDimension,
  error,
  previewClassName,
}: {
  value: string;
  onChange: (url: string) => void;
  folder: "logo" | "favicon" | "promo";
  /** Downscale raster images to this many px on the longest side (re-encoded as WEBP) before upload. */
  maxDimension?: number;
  error?: string;
  previewClassName?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [size, setSize] = useState<{ url: string; w: number; h: number } | null>(null);

  async function upload(file: File) {
    setUploading(true);
    try {
      const body = new FormData();
      body.set("file", maxDimension ? await shrink(file, maxDimension) : file);
      body.set("folder", folder);
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "Upload failed");
      onChange(data.url);
      toast.success("Image uploaded — save to publish it");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const pick = () => inputRef.current?.click();
  const dims = size?.url === value ? size : null;

  return (
    <div className="min-w-0 space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
        }}
      />

      {value ? (
        <div className={cn("flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center", error && "border-destructive")}>
          <div
            className={cn(
              "flex h-28 shrink-0 items-center justify-center rounded-md border bg-[repeating-conic-gradient(var(--muted)_0_25%,transparent_0_50%)] bg-[length:16px_16px] p-2 sm:w-44",
              previewClassName,
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- uploaded asset on Supabase Storage */}
            <img
              src={value}
              alt="Uploaded preview"
              className="max-h-full max-w-full object-contain"
              onLoad={(e) => setSize({ url: value, w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
            />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <p className="truncate text-xs text-muted-foreground" title={value.startsWith("data:") ? undefined : value}>
              {value.startsWith("data:")
                ? `Embedded image · ${Math.max(1, Math.round((value.length * 0.75) / 1024))} KB`
                : value.split("/").pop()}
            </p>
            {dims && dims.w > 0 && (
              <p className="text-xs font-medium tabular-nums">
                {dims.w} × {dims.h} px
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={pick}>
                {uploading ? <Loader2 className="animate-spin" /> : <RefreshCw />}
                Replace
              </Button>
              <Button type="button" variant="ghost" size="sm" disabled={uploading} onClick={() => onChange("")} className="text-destructive">
                <Trash2 />
                Remove
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={pick}
          disabled={uploading}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) upload(file);
          }}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors hover:bg-muted/50",
            dragging && "border-primary bg-primary/5",
            error && "border-destructive",
          )}
        >
          {uploading ? <Loader2 className="size-6 animate-spin text-muted-foreground" /> : <ImageUp className="size-6 text-muted-foreground" />}
          <span className="text-sm">
            {uploading ? (
              "Uploading…"
            ) : (
              <>
                <span className="font-medium text-primary">Click to upload</span> or drag & drop
              </>
            )}
          </span>
          <span className="text-xs text-muted-foreground">PNG, JPG, SVG, WEBP or ICO · max 1 MB</span>
        </button>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
