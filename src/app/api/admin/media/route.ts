import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { MEDIA_MAX_BYTES } from "@/lib/media/types";
import { auth } from "@/server/auth";
import { catalogTag } from "@/server/services/catalog";
import { createMedia, deleteMedia, isAllowedMediaType, listMedia } from "@/server/services/media";

// Route handlers can't redirect like requireStaff(), so check the session directly.
async function staff() {
  const role = (await auth())?.user?.role;
  return role === "ADMIN" || role === "STAFF";
}
const unauthorised = () => NextResponse.json({ error: "Not authorised" }, { status: 401 });

/** GET /api/admin/media?q= — newest first. */
export async function GET(request: Request) {
  if (!(await staff())) return unauthorised();
  const q = (new URL(request.url).searchParams.get("q") ?? "").trim().slice(0, 100);
  return NextResponse.json({ items: await listMedia({ q: q || undefined }) });
}

/** POST multipart { file, width?, height? } — one image per request. */
export async function POST(request: Request) {
  if (!(await staff())) return unauthorised();
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: "Choose a file to upload" }, { status: 400 });
  if (!isAllowedMediaType(file.type)) {
    return NextResponse.json({ error: `${file.name}: use PNG, JPG, WEBP, GIF, AVIF or SVG` }, { status: 400 });
  }
  if (file.size > MEDIA_MAX_BYTES) return NextResponse.json({ error: `${file.name}: too large (max 4 MB)` }, { status: 400 });

  const dim = (key: string) => {
    const n = Number(form?.get(key));
    return Number.isInteger(n) && n > 0 && n < 100_000 ? n : null;
  };
  try {
    const item = await createMedia(file, { width: dim("width"), height: dim("height") });
    return NextResponse.json({ item });
  } catch (e) {
    console.error("[media upload]", e);
    return NextResponse.json({ error: `${file.name}: upload failed — please try again` }, { status: 500 });
  }
}

/** DELETE /api/admin/media?id= — also removes the image from product galleries. */
export async function DELETE(request: Request) {
  if (!(await staff())) return unauthorised();
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const result = await deleteMedia(id);
  if (!result) return NextResponse.json({ error: "Media not found" }, { status: 404 });
  // updateTag() is Server-Action-only; expire immediately so storefront pages drop the deleted photo.
  if (result.removedFromProducts > 0) revalidateTag(catalogTag, { expire: 0 });
  return NextResponse.json(result);
}
