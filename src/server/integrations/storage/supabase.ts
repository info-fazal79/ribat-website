import "server-only";
import { randomUUID } from "node:crypto";
import { env } from "@/lib/env";

/**
 * Minimal Supabase Storage client over the REST API (no SDK needed).
 * Uses the service-role key, so it must only run on the server.
 */

export class StorageNotConfiguredError extends Error {}

function config() {
  // Pooler usernames look like `postgres.<project-ref>`.
  const ref = env.DATABASE_URL.match(/\/\/postgres\.([a-z0-9]+):/)?.[1];
  const url = env.SUPABASE_URL ?? (ref ? `https://${ref}.supabase.co` : undefined);
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new StorageNotConfiguredError("File uploads need SUPABASE_SERVICE_ROLE_KEY (and SUPABASE_URL) in the environment.");
  }
  // Legacy service_role keys are JWTs; new `sb_secret_…` keys go in `apikey` only.
  const headers: Record<string, string> = { apikey: key };
  if (key.startsWith("eyJ")) headers.Authorization = `Bearer ${key}`;
  return { url: url.replace(/\/$/, ""), headers, bucket: env.SUPABASE_STORAGE_BUCKET };
}

let bucketReady: Promise<void> | null = null;

/** Creates the public bucket on first use if it doesn't exist yet. */
function ensureBucket() {
  bucketReady ??= (async () => {
    const { url, headers, bucket } = config();
    const existing = await fetch(`${url}/storage/v1/bucket/${bucket}`, { headers });
    if (existing.ok) return;
    const created = await fetch(`${url}/storage/v1/bucket`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ id: bucket, name: bucket, public: true }),
    });
    // 409 = created concurrently by another request.
    if (!created.ok && created.status !== 409) {
      throw new Error(`Couldn't create storage bucket "${bucket}": ${await created.text()}`);
    }
  })().catch((e) => {
    bucketReady = null;
    throw e;
  });
  return bucketReady;
}

/** Uploads a file under `folder/` and returns its public URL. */
export async function uploadPublicFile(file: File, folder: string, extension: string) {
  const { url, headers, bucket } = config();
  await ensureBucket();

  const path = `${folder}/${Date.now()}-${randomUUID().slice(0, 8)}.${extension}`;
  const res = await fetch(`${url}/storage/v1/object/${bucket}/${path}`, {
    method: "POST",
    headers: { ...headers, "Content-Type": file.type || "application/octet-stream", "Cache-Control": "31536000" },
    body: file,
  });
  if (!res.ok) throw new Error(`Upload failed: ${await res.text()}`);
  return `${url}/storage/v1/object/public/${bucket}/${path}`;
}
