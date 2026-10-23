"use client";

import { useRef, useState } from "react";
import { ImageUp, Images, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { MediaModal } from "@/components/admin/media-modal";
import { Button } from "@/components/ui/button";
import { uploadMedia } from "@/lib/media/client";
import { MEDIA_ACCEPT } from "@/lib/media/types";
import { cn } from "@/lib/utils";

/**
 * Single-image field backed by the Media Library: direct upload (saved to the library)
 * or pick an existing image. Stores the image URL.
 */
export function MediaField({
  value,
  onChange,
  previewClassName,
  error,
  stacked = false,
}: {
  value: string;
  onChange: (url: string) => void;
  previewClassName?: string;
  error?: string;
  /** Always stack preview above the buttons (narrow side panels); default switches to a row from sm. */
  stacked?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [picking, setPicking] = useState(false);
  const [dragging, setDragging] = useState(false);

  async function upload(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const item = await uploadMedia(file);
      onChange(item.url);
      toast.success("Uploaded to the Media Library");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="min-w-0 space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={MEDIA_ACCEPT}
        className="hidden"
        onChange={(e) => {
          upload(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          upload(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          "flex flex-col gap-3 rounded-lg border p-3",
          !stacked && "sm:flex-row sm:items-center",
          !value && "border-2 border-dashed",
          dragging && "border-primary bg-primary/5",
          error && "border-destructive",
        )}
      >
        <div
          className={cn(
            "flex h-28 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-[repeating-conic-gradient(var(--muted)_0_25%,transparent_0_50%)] bg-[length:16px_16px]",
            !stacked && "sm:w-40",
            previewClassName,
          )}
        >
          {uploading ? (
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          ) : value ? (
            // eslint-disable-next-line @next/next/no-img-element -- media library asset
            <img src={value} alt="Selected" className="max-h-full max-w-full object-contain" />
          ) : (
            <ImageUp className="size-6 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-xs text-muted-foreground">
            {value ? <span className="block truncate" title={value}>{value.split("/").pop()}</span> : "Drop an image here, or:"}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
              <ImageUp />
              {value ? "Upload new" : "Upload"}
            </Button>
            <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => setPicking(true)}>
              <Images />
              Choose from Media Library
            </Button>
            {value && (
              <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => onChange("")}>
                <Trash2 />
                Remove
              </Button>
            )}
          </div>
        </div>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <MediaModal open={picking} onOpenChange={setPicking} onSelect={(items) => items[0] && onChange(items[0].url)} />
    </div>
  );
}
