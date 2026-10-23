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

// Without Supabase Storage keys, images are embedded in the Setting row as a data URL.
// Base64 adds ~35%, and logo + favicon are saved in one request (Vercel caps bodies at 4.5 MB).
const MAX_EMBED_BYTES = 1024 * 1024;

const canonicalMime: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  svg: "image/svg+xml",
  ico: "image/x-icon",
};

async function dataUrlFallback(file: File, extension: string) {
  if (file.size > MAX_EMBED_BYTES) {
    return NextResponse.json(
      { error: "Image is too large — max 1 MB (or configure Supabase Storage for up to 2 MB)" },
      { status: 400 },
    );
  }
  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
  return NextResponse.json({ url: `data:${canonicalMime[extension]};base64,${base64}` });
}

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
    if (e instanceof StorageNotConfiguredError) return dataUrlFallback(file, extension);
    console.error("[upload]", e);
    return NextResponse.json({ error: "Upload failed — please try again" }, { status: 500 });
  }
}
