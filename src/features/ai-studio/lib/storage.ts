import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const STUDIO_SAMPLES_BUCKET = "studio-samples";
export const STUDIO_OUTPUTS_BUCKET = "studio-outputs";

const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

let client: SupabaseClient | null = null;

export function getClient(): SupabaseClient {
  if (client) return client;
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL or SUPABASE_SERVICE_KEY missing");
  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}

export function outputPathFor(args: { userId: string; requestId: string }): string {
  return `${args.userId}/${args.requestId}.mp4`;
}

export function samplePathFor(args: {
  sampleId: string;
  ext: "mp4" | "jpg" | "webp" | "png";
}): string {
  if (args.ext === "mp4") return `${args.sampleId}/sample.mp4`;
  return `${args.sampleId}/thumb.${args.ext}`;
}

export async function getSampleSignedUrl(path: string): Promise<string> {
  const { data, error } = await getClient()
    .storage.from(STUDIO_SAMPLES_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error || !data) throw new Error(`signed URL failed for ${path}: ${error?.message}`);
  return data.signedUrl;
}

export async function getOutputSignedUrl(path: string): Promise<string> {
  const { data, error } = await getClient()
    .storage.from(STUDIO_OUTPUTS_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error || !data) throw new Error(`signed URL failed for ${path}: ${error?.message}`);
  return data.signedUrl;
}

export function getSamplePublicUrl(path: string): string {
  const { data } = getClient().storage.from(STUDIO_SAMPLES_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function getSampleUploadUrl(args: {
  sampleId: string;
  ext: "mp4" | "jpg" | "webp" | "png";
}): Promise<{ uploadUrl: string; path: string; token: string }> {
  const path = samplePathFor({ sampleId: args.sampleId, ext: args.ext });
  const { data, error } = await getClient()
    .storage.from(STUDIO_SAMPLES_BUCKET)
    .createSignedUploadUrl(path);
  if (error || !data) throw new Error(`signed upload URL failed for ${path}: ${error?.message}`);
  return { uploadUrl: data.signedUrl, path, token: data.token };
}

export async function getOutputUploadUrl(args: {
  userId: string;
  requestId: string;
}): Promise<{ uploadUrl: string; path: string; token: string }> {
  const path = outputPathFor({ userId: args.userId, requestId: args.requestId });
  const { data, error } = await getClient()
    .storage.from(STUDIO_OUTPUTS_BUCKET)
    .createSignedUploadUrl(path);
  if (error || !data) throw new Error(`signed upload URL failed for ${path}: ${error?.message}`);
  return { uploadUrl: data.signedUrl, path, token: data.token };
}
