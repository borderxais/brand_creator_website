"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface RequestFormProps {
  sampleId?: string;
  targetCategory: string;
  remainingQuota: number;
}

export function RequestForm({ sampleId, targetCategory, remainingQuota }: RequestFormProps) {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [styleNotes, setStyleNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const promptValid = prompt.trim().length >= 30;
  const canSubmit = promptValid && remainingQuota > 0 && !submitting;

  if (remainingQuota <= 0) {
    return (
      <div className="space-y-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-5">
        <p className="text-sm text-amber-200">No requests left this period.</p>
        <Link
          href="/studio/billing"
          className="inline-flex rounded-full bg-amber-400 px-4 py-1.5 text-sm font-medium text-amber-950 transition hover:bg-amber-300"
        >
          Upgrade plan
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/studio/requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sampleId,
          targetCategory,
          prompt,
          styleNotes: styleNotes || undefined,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Submission failed");
        return;
      }
      router.push(`/studio/requests/${body.request.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="prompt" className="block text-sm font-medium text-zinc-200">
          Prompt
        </label>
        <p className="mt-1 text-xs text-zinc-500">Describe your story. Min 30 characters.</p>
        <textarea
          id="prompt"
          required
          minLength={30}
          maxLength={1500}
          rows={6}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-sm leading-relaxed text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-400 focus:outline-none"
          placeholder="A late-night driver picks up a passenger who recognizes the song on the radio…"
        />
        <p className="mt-1 text-xs text-zinc-500">
          {prompt.length} / 1500 {promptValid ? "✓" : "(need 30+)"}
        </p>
      </div>

      <div>
        <label htmlFor="style" className="block text-sm font-medium text-zinc-200">
          Style notes <span className="text-zinc-500">(optional)</span>
        </label>
        <textarea
          id="style"
          rows={3}
          maxLength={500}
          value={styleNotes}
          onChange={(e) => setStyleNotes(e.target.value)}
          className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-400 focus:outline-none"
          placeholder="Slower pacing, neon palette, English voiceover…"
        />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-500">
          Costs 1 of your {remainingQuota} remaining requests this period.
        </p>
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-full bg-zinc-100 px-5 py-2 text-sm font-medium text-zinc-900 transition hover:bg-white disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
        >
          {submitting ? "Submitting…" : "Submit request"}
        </button>
      </div>

      {error ? (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
          {error}
        </p>
      ) : null}
    </form>
  );
}
