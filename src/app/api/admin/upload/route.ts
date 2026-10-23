import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { StorageNotConfiguredError, uploadPublicFile } from "@/server/integrations/storage/supabase";

const MAX_BYTES = 2 * 1024 * 1024;

// Extension → accepted MIME types (ICO is reported inconsistently by browsers).
const allowed: Record<string, string[]> = {
  png: ["image/png"],
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
  webp: ["image/webp"],
  svg: ["image/svg+xml"],
  ico: ["image/x-icon", "image/vnd.microsoft.icon", ""],
};

const folders = new Set(["logo", "favicon"]);

/** Admin image upload → Supabase Storage. Returns `{ url }`. */
export async function POST(request: Request) {
  // Route handlers can't redirect like requireAdmin(), so check the session directly.
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const folder = String(form?.get("folder") ?? "");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Choose a file to upload" }, { status: 400 });
  }
  if (!folders.has(folder)) {
    return NextResponse.json({ error: "Unknown upload target" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File is too large — max 2 MB" }, { status: 400 });
  }
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!allowed[extension]?.includes(file.type)) {
    return NextResponse.json({ error: "Use a PNG, JPG, SVG, WEBP or ICO image" }, { status: 400 });
  }

  try {
    const url = await uploadPublicFile(file, folder, extension === "jpeg" ? "jpg" : extension);
    return NextResponse.json({ url });
  } catch (e) {
    if (e instanceof StorageNotConfiguredError) {
      return NextResponse.json({ error: e.message }, { status: 503 });
    }
    console.error("[upload]", e);
    return NextResponse.json({ error: "Upload failed — please try again" }, { status: 500 });
  }
}
