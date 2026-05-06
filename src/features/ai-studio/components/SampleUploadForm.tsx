"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type SampleCategory =
  | "VERTICAL_DRAMA"
  | "EMOTION_STORY"
  | "LIFESTYLE_VLOG"
  | "SUSPENSE_THRILLER"
  | "OTHER";

const CATEGORY_OPTIONS: { value: SampleCategory; label: string }[] = [
  { value: "VERTICAL_DRAMA", label: "Vertical drama" },
  { value: "EMOTION_STORY", label: "Emotion story" },
  { value: "LIFESTYLE_VLOG", label: "Lifestyle vlog" },
  { value: "SUSPENSE_THRILLER", label: "Suspense thriller" },
  { value: "OTHER", label: "Other" },
];

const MP4_MAX_BYTES = 30 * 1024 * 1024;
const THUMB_MAX_BYTES = 500 * 1024;
const THUMB_MIME_TO_EXT: Record<string, "jpg" | "webp" | "png"> = {
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/png": "png",
};

interface UploadUrlResponse {
  uploadUrl: string;
  path: string;
  token: string;
  sampleId: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function buildPublicUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured");
  }
  return `${base.replace(/\/$/, "")}/storage/v1/object/public/studio-samples/${path}`;
}

async function requestUploadUrl(
  ext: "mp4" | "jpg" | "webp" | "png",
  sampleId?: string
): Promise<UploadUrlResponse> {
  const res = await fetch("/api/studio/admin/upload-url", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(sampleId ? { ext, sampleId } : { ext }),
  });
  const body = (await res.json()) as Partial<UploadUrlResponse> & { error?: string };
  if (!res.ok || !body.uploadUrl || !body.path || !body.sampleId) {
    throw new Error(body.error ?? "Failed to create signed upload URL");
  }
  return {
    uploadUrl: body.uploadUrl,
    path: body.path,
    token: body.token ?? "",
    sampleId: body.sampleId,
  };
}

async function putFile(uploadUrl: string, file: File): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "content-type": file.type || "application/octet-stream",
      "x-upsert": "true",
    },
    body: file,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Upload failed (${res.status}): ${text || res.statusText}`);
  }
}

export function SampleUploadForm() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<SampleCategory>("VERTICAL_DRAMA");
  const [hook, setHook] = useState("");
  const [durationSec, setDurationSec] = useState<number>(90);
  const [mp4File, setMp4File] = useState<File | null>(null);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validation = useMemo(() => {
    const titleTrimmed = title.trim();
    if (titleTrimmed.length < 1 || titleTrimmed.length > 120) {
      return { ok: false, msg: "Title is required (1–120 characters)." };
    }
    if (!mp4File) return { ok: false, msg: "Select an MP4 reference reel." };
    if (!mp4File.type.startsWith("video/")) {
      return { ok: false, msg: "Reference reel must be a video file." };
    }
    if (mp4File.size > MP4_MAX_BYTES) {
      return { ok: false, msg: "Reference reel exceeds 30 MB." };
    }
    if (!thumbFile) return { ok: false, msg: "Select a thumbnail image." };
    if (!THUMB_MIME_TO_EXT[thumbFile.type]) {
      return { ok: false, msg: "Thumbnail must be JPEG, WebP, or PNG." };
    }
    if (thumbFile.size > THUMB_MAX_BYTES) {
      return { ok: false, msg: "Thumbnail exceeds 500 KB." };
    }
    if (!Number.isInteger(durationSec) || durationSec < 1 || durationSec > 600) {
      return { ok: false, msg: "Duration must be a whole number between 1 and 600 seconds." };
    }
    return { ok: true as const, msg: null };
  }, [title, mp4File, thumbFile, durationSec]);

  const canSubmit = validation.ok && !isSubmitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!validation.ok) {
      setError(validation.msg);
      return;
    }
    if (!mp4File || !thumbFile) return;

    const thumbExt = THUMB_MIME_TO_EXT[thumbFile.type];
    if (!thumbExt) {
      setError("Thumbnail must be JPEG, WebP, or PNG.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Signed URL for the mp4 — establishes the sampleId prefix.
      const mp4Upload = await requestUploadUrl("mp4");
      await putFile(mp4Upload.uploadUrl, mp4File);

      // 2. Signed URL for the thumbnail under the same sampleId.
      const thumbUpload = await requestUploadUrl(thumbExt, mp4Upload.sampleId);
      await putFile(thumbUpload.uploadUrl, thumbFile);

      // 3. Create the Sample row with full public URLs.
      const previewUrl = buildPublicUrl(mp4Upload.path);
      const thumbnailUrl = buildPublicUrl(thumbUpload.path);

      const createRes = await fetch("/api/studio/samples", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          category,
          hook: hook.trim() || undefined,
          previewUrl,
          thumbnailUrl,
          durationSec,
        }),
      });
      const createBody = (await createRes.json()) as {
        sample?: { id: string };
        error?: string;
      };
      if (!createRes.ok || !createBody.sample?.id) {
        throw new Error(createBody.error ?? "Failed to create sample");
      }

      router.push(`/admin/studio/samples/${createBody.sample.id}/edit`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setError(message);
      setIsSubmitting(false);
    }
  }

  const inputClass =
    "mt-2 w-full rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none";

  return (
    <form
      onSubmit={handleSubmit}
      aria-busy={isSubmitting}
      className="space-y-10 border-t border-zinc-800 pt-10"
    >
      <section className="grid gap-6 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label
            htmlFor="sample-title"
            className="block text-xs uppercase tracking-[0.18em] text-zinc-500"
          >
            Title
          </label>
          <input
            id="sample-title"
            type="text"
            required
            maxLength={120}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
            placeholder="Late-night neon driver"
          />
        </div>

        <div>
          <label
            htmlFor="sample-category"
            className="block text-xs uppercase tracking-[0.18em] text-zinc-500"
          >
            Category
          </label>
          <select
            id="sample-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as SampleCategory)}
            className={inputClass}
          >
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="sample-duration"
            className="block text-xs uppercase tracking-[0.18em] text-zinc-500"
          >
            Duration (seconds)
          </label>
          <input
            id="sample-duration"
            type="number"
            min={1}
            max={600}
            step={1}
            required
            value={durationSec}
            onChange={(e) => setDurationSec(Number.parseInt(e.target.value, 10) || 0)}
            className={inputClass}
          />
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor="sample-hook"
            className="block text-xs uppercase tracking-[0.18em] text-zinc-500"
          >
            Hook <span className="normal-case tracking-normal text-zinc-600">(optional)</span>
          </label>
          <input
            id="sample-hook"
            type="text"
            maxLength={200}
            value={hook}
            onChange={(e) => setHook(e.target.value)}
            className={inputClass}
            placeholder="Cold open with a single line of dialogue."
          />
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor="sample-description"
            className="block text-xs uppercase tracking-[0.18em] text-zinc-500"
          >
            Description{" "}
            <span className="normal-case tracking-normal text-zinc-600">(optional)</span>
          </label>
          <textarea
            id="sample-description"
            rows={4}
            maxLength={2000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputClass}
            placeholder="What this reference establishes — pacing, palette, voice."
          />
        </div>
      </section>

      <section className="grid gap-8 sm:grid-cols-2">
        <div>
          <label
            htmlFor="sample-mp4"
            className="block text-xs uppercase tracking-[0.18em] text-zinc-500"
          >
            Reference reel · MP4
          </label>
          <p className="mt-1 text-xs text-zinc-500">Up to 30 MB. Vertical orientation preferred.</p>
          <input
            id="sample-mp4"
            type="file"
            accept="video/mp4,video/*"
            required
            onChange={(e) => setMp4File(e.target.files?.[0] ?? null)}
            className="mt-3 block w-full text-sm text-zinc-300 file:mr-4 file:rounded-full file:border-0 file:bg-zinc-100 file:px-4 file:py-2 file:text-xs file:font-medium file:uppercase file:tracking-widest file:text-zinc-950 hover:file:bg-zinc-200"
          />
          {mp4File ? (
            <p className="mt-2 text-xs text-zinc-400">
              {mp4File.name} · {formatSize(mp4File.size)}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="sample-thumb"
            className="block text-xs uppercase tracking-[0.18em] text-zinc-500"
          >
            Thumbnail · JPEG / WebP / PNG
          </label>
          <p className="mt-1 text-xs text-zinc-500">Up to 500 KB. 9:16 framing recommended.</p>
          <input
            id="sample-thumb"
            type="file"
            accept="image/jpeg,image/webp,image/png"
            required
            onChange={(e) => setThumbFile(e.target.files?.[0] ?? null)}
            className="mt-3 block w-full text-sm text-zinc-300 file:mr-4 file:rounded-full file:border-0 file:bg-zinc-100 file:px-4 file:py-2 file:text-xs file:font-medium file:uppercase file:tracking-widest file:text-zinc-950 hover:file:bg-zinc-200"
          />
          {thumbFile ? (
            <p className="mt-2 text-xs text-zinc-400">
              {thumbFile.name} · {formatSize(thumbFile.size)}
            </p>
          ) : null}
        </div>
      </section>

      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200"
        >
          {error}
        </p>
      ) : null}

      <div className="flex items-center justify-between border-t border-zinc-800 pt-6">
        <p className="text-xs text-zinc-500">
          Files upload directly to storage. The sample row is created last.
        </p>
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-full bg-zinc-100 px-6 py-2 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
        >
          {isSubmitting ? "Uploading…" : "Create sample"}
        </button>
      </div>
    </form>
  );
}
