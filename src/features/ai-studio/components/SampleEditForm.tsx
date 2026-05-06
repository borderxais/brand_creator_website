"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Sample } from "@prisma/client";

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

interface SampleEditFormProps {
  sample: Sample;
}

interface FormState {
  title: string;
  description: string;
  category: SampleCategory;
  hook: string;
  durationSec: number;
  thumbnailUrl: string;
}

interface MetadataPatch {
  title?: string;
  description?: string | null;
  category?: SampleCategory;
  hook?: string | null;
  durationSec?: number;
  thumbnailUrl?: string | null;
}

function buildInitialState(sample: Sample): FormState {
  return {
    title: sample.title,
    description: sample.description ?? "",
    category: sample.category as SampleCategory,
    hook: sample.hook ?? "",
    durationSec: sample.durationSec,
    thumbnailUrl: sample.thumbnailUrl ?? "",
  };
}

function diffMetadata(initial: FormState, current: FormState): MetadataPatch {
  const patch: MetadataPatch = {};

  const titleTrimmed = current.title.trim();
  if (titleTrimmed !== initial.title.trim()) {
    patch.title = titleTrimmed;
  }

  const descTrimmed = current.description.trim();
  const initialDesc = initial.description.trim();
  if (descTrimmed !== initialDesc) {
    patch.description = descTrimmed.length === 0 ? null : descTrimmed;
  }

  if (current.category !== initial.category) {
    patch.category = current.category;
  }

  const hookTrimmed = current.hook.trim();
  const initialHook = initial.hook.trim();
  if (hookTrimmed !== initialHook) {
    patch.hook = hookTrimmed.length === 0 ? null : hookTrimmed;
  }

  if (current.durationSec !== initial.durationSec) {
    patch.durationSec = current.durationSec;
  }

  const thumbTrimmed = current.thumbnailUrl.trim();
  const initialThumb = initial.thumbnailUrl.trim();
  if (thumbTrimmed !== initialThumb) {
    patch.thumbnailUrl = thumbTrimmed.length === 0 ? null : thumbTrimmed;
  }

  return patch;
}

async function patchSample(id: string, body: MetadataPatch | { isActive: boolean }): Promise<void> {
  const res = await fetch(`/api/studio/samples/${id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as {
    error?: string;
    sample?: unknown;
  };
  if (!res.ok || !json.sample) {
    throw new Error(json.error ?? "Failed to update sample");
  }
}

const inputClass =
  "mt-2 w-full rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none";

export function SampleEditForm({ sample }: SampleEditFormProps) {
  const router = useRouter();
  const initialState = useMemo(() => buildInitialState(sample), [sample]);

  const [title, setTitle] = useState(initialState.title);
  const [description, setDescription] = useState(initialState.description);
  const [category, setCategory] = useState<SampleCategory>(initialState.category);
  const [hook, setHook] = useState(initialState.hook);
  const [durationSec, setDurationSec] = useState<number>(initialState.durationSec);
  const [thumbnailUrl, setThumbnailUrl] = useState(initialState.thumbnailUrl);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [metadataMsg, setMetadataMsg] = useState<string | null>(null);
  const [metadataError, setMetadataError] = useState<string | null>(null);

  const [archiveBusy, setArchiveBusy] = useState(false);
  const [archiveMsg, setArchiveMsg] = useState<string | null>(null);
  const [archiveError, setArchiveError] = useState<string | null>(null);

  const current: FormState = {
    title,
    description,
    category,
    hook,
    durationSec,
    thumbnailUrl,
  };

  const patch = diffMetadata(initialState, current);
  const hasChanges = Object.keys(patch).length > 0;

  const validation = useMemo(() => {
    const titleTrimmed = title.trim();
    if (titleTrimmed.length < 1 || titleTrimmed.length > 120) {
      return { ok: false, msg: "Title is required (1–120 characters)." };
    }
    if (!Number.isInteger(durationSec) || durationSec < 1 || durationSec > 600) {
      return { ok: false, msg: "Duration must be a whole number between 1 and 600 seconds." };
    }
    const thumbTrimmed = thumbnailUrl.trim();
    if (thumbTrimmed.length > 0) {
      try {
        new URL(thumbTrimmed);
      } catch {
        return { ok: false, msg: "Thumbnail URL must be a valid absolute URL." };
      }
    }
    return { ok: true as const, msg: null };
  }, [title, durationSec, thumbnailUrl]);

  const canSubmit = validation.ok && hasChanges && !isSubmitting;

  async function handleMetadataSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setMetadataError(null);
    setMetadataMsg(null);

    if (!validation.ok) {
      setMetadataError(validation.msg);
      return;
    }
    if (!hasChanges) return;

    setIsSubmitting(true);
    try {
      await patchSample(sample.id, patch);
      setMetadataMsg("Saved.");
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Save failed";
      setMetadataError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleArchiveToggle(): Promise<void> {
    setArchiveError(null);
    setArchiveMsg(null);

    if (sample.isActive) {
      const confirmed = window.confirm(
        "Archive this sample? It will be hidden from the creator gallery."
      );
      if (!confirmed) return;
    }

    setArchiveBusy(true);
    try {
      await patchSample(sample.id, { isActive: !sample.isActive });
      setArchiveMsg(sample.isActive ? "Sample archived." : "Sample restored.");
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Archive toggle failed";
      setArchiveError(message);
    } finally {
      setArchiveBusy(false);
    }
  }

  return (
    <div className="space-y-12">
      <form
        onSubmit={handleMetadataSubmit}
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
              maxLength={280}
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

          <div className="sm:col-span-2">
            <label
              htmlFor="sample-thumb-url"
              className="block text-xs uppercase tracking-[0.18em] text-zinc-500"
            >
              Thumbnail URL{" "}
              <span className="normal-case tracking-normal text-zinc-600">(optional)</span>
            </label>
            <input
              id="sample-thumb-url"
              type="url"
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              className={inputClass}
              placeholder="https://…"
            />
          </div>
        </section>

        <section className="space-y-3">
          <p className="block text-xs uppercase tracking-[0.18em] text-zinc-500">
            Preview reel (read-only)
          </p>
          <p className="break-all text-sm text-zinc-400">{sample.previewUrl}</p>
          <p className="text-xs text-zinc-500">
            To replace the preview video, archive this sample and upload a new one.
          </p>
        </section>

        {metadataError ? (
          <p
            role="alert"
            className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200"
          >
            {metadataError}
          </p>
        ) : null}
        {metadataMsg ? (
          <p
            role="status"
            className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200"
          >
            {metadataMsg}
          </p>
        ) : null}

        <div className="flex items-center justify-between border-t border-zinc-800 pt-6">
          <p className="text-xs text-zinc-500">
            {hasChanges ? "Unsaved changes." : "No changes to save."}
          </p>
          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-full bg-zinc-100 px-6 py-2 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
          >
            {isSubmitting ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>

      <section aria-label="Archive controls" className="space-y-4 border-t border-zinc-800 pt-10">
        <div className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            {sample.isActive ? "Archive" : "Restore"}
          </span>
          <p className="text-sm text-zinc-400">
            {sample.isActive
              ? "Archived samples stay in history but disappear from the creator gallery."
              : "Restoring puts this sample back into the creator gallery."}
          </p>
        </div>

        {archiveError ? (
          <p
            role="alert"
            className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200"
          >
            {archiveError}
          </p>
        ) : null}
        {archiveMsg ? (
          <p
            role="status"
            className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200"
          >
            {archiveMsg}
          </p>
        ) : null}

        <div>
          <button
            type="button"
            onClick={handleArchiveToggle}
            disabled={archiveBusy}
            className={
              sample.isActive
                ? "rounded-full border border-rose-500/50 bg-rose-500/10 px-6 py-2 text-sm font-medium text-rose-200 transition hover:border-rose-400 hover:bg-rose-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                : "rounded-full border border-emerald-500/50 bg-emerald-500/10 px-6 py-2 text-sm font-medium text-emerald-200 transition hover:border-emerald-400 hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-60"
            }
          >
            {archiveBusy ? "Working…" : sample.isActive ? "Archive sample" : "Unarchive sample"}
          </button>
        </div>
      </section>
    </div>
  );
}
