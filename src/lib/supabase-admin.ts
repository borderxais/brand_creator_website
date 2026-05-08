import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const AI_VIDEO_TASK_BUCKET = "ai-video-tasks";

declare global {
  var _supabaseAdmin: SupabaseClient | undefined;
}

export class SupabaseConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SupabaseConfigError";
  }
}

export function getSupabaseAdmin(): SupabaseClient {
  if (globalThis._supabaseAdmin) return globalThis._supabaseAdmin;
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !serviceKey) {
    throw new SupabaseConfigError("Supabase admin client not configured");
  }
  const client = createClient(url, serviceKey, { auth: { persistSession: false } });
  if (process.env.NODE_ENV !== "production") {
    globalThis._supabaseAdmin = client;
  }
  return client;
}

export async function uploadToBucket(path: string, file: File, contentType: string): Promise<void> {
  const client = getSupabaseAdmin();
  const { error } = await client.storage.from(AI_VIDEO_TASK_BUCKET).upload(path, file, {
    contentType,
    upsert: false,
  });
  if (error) {
    throw new Error(`Supabase upload failed for ${path}: ${error.message}`);
  }
}

export async function deleteFromBucket(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  const client = getSupabaseAdmin();
  const { error } = await client.storage.from(AI_VIDEO_TASK_BUCKET).remove(paths);
  if (error) {
    console.error("[supabase-admin] cleanup delete failed", { paths, message: error.message });
  }
}

export async function createSignedUrl(path: string, expiresInSec = 3600): Promise<string | null> {
  const client = getSupabaseAdmin();
  const { data, error } = await client.storage
    .from(AI_VIDEO_TASK_BUCKET)
    .createSignedUrl(path, expiresInSec);
  if (error || !data?.signedUrl) {
    console.error("[supabase-admin] signed URL failed", { path, message: error?.message });
    return null;
  }
  return data.signedUrl;
}
