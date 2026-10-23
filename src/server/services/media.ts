import "server-only";
import type { MediaItem } from "@/lib/media/types";
import { db } from "@/server/db";
import { StorageNotConfiguredError, uploadPublicFile } from "@/server/integrations/storage/supabase";

const select = { id: true, name: true, url: true, size: true, mimeType: true, width: true, height: true, createdAt: true } as const;

const extensions: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "image/avif": "avif",
};

export const isAllowedMediaType = (mime: string) => mime in extensions;

const toItem = (m: { createdAt: Date } & Omit<MediaItem, "createdAt">): MediaItem => ({ ...m, createdAt: m.createdAt.toISOString() });

export async function listMedia({ q, take = 200 }: { q?: string; take?: number } = {}): Promise<MediaItem[]> {
  const rows = await db.media.findMany({
    where: q ? { name: { contains: q, mode: "insensitive" } } : undefined,
    orderBy: { createdAt: "desc" },
    take,
    select,
  });
  return rows.map(toItem);
}

/** Stores an upload in Supabase Storage, or in the database when Storage isn't configured. */
export async function createMedia(file: File, dims: { width: number | null; height: number | null }): Promise<MediaItem> {
  const ext = extensions[file.type];
  const meta = { name: file.name.slice(0, 200), size: file.size, mimeType: file.type, ...dims };
  try {
    const url = await uploadPublicFile(file, "media", ext);
    return toItem(await db.media.create({ data: { ...meta, url }, select }));
  } catch (e) {
    if (!(e instanceof StorageNotConfiguredError)) throw e;
  }
  // DB fallback: create first to get the id, then point the URL at the /media route.
  const data = new Uint8Array(await file.arrayBuffer());
  return db.$transaction(async (tx) => {
    const row = await tx.media.create({ data: { ...meta, url: "", data }, select: { id: true } });
    return toItem(await tx.media.update({ where: { id: row.id }, data: { url: `/media/${row.id}.${ext}` }, select }));
  });
}

/** Deletes a media item and removes it from any product galleries. Returns how many product images were removed. */
export async function deleteMedia(id: string) {
  const media = await db.media.findUnique({ where: { id }, select: { url: true } });
  if (!media) return null;
  const [removed] = await db.$transaction([
    db.productImage.deleteMany({ where: { url: media.url } }),
    db.media.delete({ where: { id } }),
  ]);
  return { removedFromProducts: removed.count };
}

/** Raw bytes for the /media route (DB-stored uploads only). */
export async function getMediaFile(id: string) {
  return db.media.findUnique({ where: { id }, select: { data: true, mimeType: true } });
}
