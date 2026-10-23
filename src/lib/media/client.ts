"use client";

import { MEDIA_MAX_BYTES, type MediaItem } from "@/lib/media/types";

/** Resizes large PNG/JPG/WEBP photos in the browser (re-encoded as WEBP) so uploads stay small. */
export async function shrinkImage(file: File, max: number): Promise<File> {
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

function imageSize(file: File) {
  return new Promise<{ width: number; height: number } | null>((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve(img.naturalWidth ? { width: img.naturalWidth, height: img.naturalHeight } : null);
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve(null);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

/** Uploads one image to the Media Library (resized to ≤2400px first). */
export async function uploadMedia(original: File): Promise<MediaItem> {
  if (!original.type.startsWith("image/")) throw new Error(`${original.name}: only images can be uploaded`);
  const file = await shrinkImage(original, 2400);
  if (file.size > MEDIA_MAX_BYTES) throw new Error(`${original.name}: too large (max 4 MB)`);
  const size = await imageSize(file);
  const body = new FormData();
  body.set("file", file);
  if (size) {
    body.set("width", String(size.width));
    body.set("height", String(size.height));
  }
  const res = await fetch("/api/admin/media", { method: "POST", body });
  const data = (await res.json().catch(() => ({}))) as { item?: MediaItem; error?: string };
  if (!res.ok || !data.item) throw new Error(data.error ?? `${original.name}: upload failed`);
  return data.item;
}

export async function listMedia(q = ""): Promise<MediaItem[]> {
  const res = await fetch(`/api/admin/media?q=${encodeURIComponent(q)}`);
  if (!res.ok) throw new Error("Couldn't load the media library");
  return ((await res.json()) as { items: MediaItem[] }).items;
}

export async function deleteMedia(id: string): Promise<{ removedFromProducts: number }> {
  const res = await fetch(`/api/admin/media?id=${encodeURIComponent(id)}`, { method: "DELETE" });
  const data = (await res.json().catch(() => ({}))) as { removedFromProducts?: number; error?: string };
  if (!res.ok) throw new Error(data.error ?? "Delete failed");
  return { removedFromProducts: data.removedFromProducts ?? 0 };
}
