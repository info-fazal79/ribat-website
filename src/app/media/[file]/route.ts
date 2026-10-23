import { getMediaFile } from "@/server/services/media";

/** Serves Media Library files stored in the database: /media/<id>.<ext>. Immutable — new uploads get new ids. */
export async function GET(_request: Request, { params }: RouteContext<"/media/[file]">) {
  const { file } = await params;
  const id = file.replace(/\.[a-z0-9]+$/i, "");
  const media = await getMediaFile(id);
  if (!media?.data) return new Response("Not found", { status: 404 });
  return new Response(media.data, {
    headers: {
      "Content-Type": media.mimeType,
      "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
      // SVGs can carry scripts; never let them run in our origin.
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
