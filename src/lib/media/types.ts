/** Client-safe Media Library types and helpers. */
export type MediaItem = {
  id: string;
  name: string;
  url: string;
  size: number;
  mimeType: string;
  width: number | null;
  height: number | null;
  createdAt: string;
};

export const MEDIA_MAX_BYTES = 4 * 1024 * 1024; // Vercel caps request bodies at 4.5 MB

export const MEDIA_ACCEPT = "image/png,image/jpeg,image/webp,image/gif,image/svg+xml,image/avif";

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
