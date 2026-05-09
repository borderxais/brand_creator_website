"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AiVideoTaskStatus } from "@prisma/client";

export type TaskAdminRowData = {
  id: string;
  creatorLabel: string;
  prompt: string;
  status: AiVideoTaskStatus;
  outputUrl: string | null;
  outputPath: string | null;
  outputSignedUrl: string | null;
  notes: string | null;
  voiceSignedUrl: string | null;
  portraitSignedUrl: string | null;
  createdAt: string;
};

const STATUSES: AiVideoTaskStatus[] = ["QUEUED", "GENERATING", "IN_REVIEW", "DELIVERED"];

export default function TaskAdminRow({ task }: { task: TaskAdminRowData }) {
  const router = useRouter();
  const [status, setStatus] = useState<AiVideoTaskStatus>(task.status);
  const [outputUrl, setOutputUrl] = useState(task.outputUrl ?? "");
  const [notes, setNotes] = useState(task.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPending, startTransition] = useTransition();

  const onSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/storyclaw-admin/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          outputUrl: outputUrl.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data?.error ?? "Failed to update task");
        return;
      }
      const payload = (await response.json().catch(() => null)) as {
        task: { status: AiVideoTaskStatus; outputUrl: string | null; notes: string | null };
      } | null;
      if (payload?.task) {
        setStatus(payload.task.status);
        setOutputUrl(payload.task.outputUrl ?? "");
        setNotes(payload.task.notes ?? "");
      }
      startTransition(() => router.refresh());
    } catch {
      setError("Network error — please try again");
    } finally {
      setIsSaving(false);
    }
  };

  const busy = isSaving || isPending;

  return (
    <tr className="border-t border-slate-100 align-top">
      <td className="px-3 py-3 text-xs text-slate-500">
        <div className="font-mono">{task.id.slice(0, 8)}</div>
        <div>{task.creatorLabel}</div>
        <div>{new Date(task.createdAt).toLocaleString()}</div>
      </td>
      <td className="px-3 py-3 text-xs">
        <details>
          <summary className="cursor-pointer text-slate-600">
            {task.prompt.length > 60 ? `${task.prompt.slice(0, 60)}…` : task.prompt}
          </summary>
          <p className="mt-2 whitespace-pre-wrap text-slate-700">{task.prompt}</p>
        </details>
        <div className="mt-2 flex gap-2 text-indigo-600">
          {task.portraitSignedUrl ? (
            <a href={task.portraitSignedUrl} target="_blank" rel="noreferrer" className="underline">
              portrait
            </a>
          ) : null}
          {task.voiceSignedUrl ? (
            <a href={task.voiceSignedUrl} target="_blank" rel="noreferrer" className="underline">
              voice
            </a>
          ) : null}
        </div>
      </td>
      <td className="px-3 py-3">
        <form onSubmit={onSave} className="flex flex-col gap-2 text-xs">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as AiVideoTaskStatus)}
            className="rounded border border-slate-200 px-2 py-1"
            disabled={busy}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <input
            type="url"
            placeholder="output URL (required for DELIVERED)"
            value={outputUrl}
            onChange={(e) => setOutputUrl(e.target.value)}
            className="rounded border border-slate-200 px-2 py-1"
            disabled={busy}
          />
          <textarea
            placeholder="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="rounded border border-slate-200 px-2 py-1"
            disabled={busy}
          />
          {error ? <p className="text-rose-600">{error}</p> : null}
          <button
            type="submit"
            disabled={busy}
            className="rounded bg-slate-900 px-3 py-1 text-white disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save"}
          </button>
        </form>
      </td>
    </tr>
  );
}
