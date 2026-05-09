"use client";

import { ChangeEvent, FormEvent, useState, useTransition } from "react";
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

  const [outputFile, setOutputFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const onUpload = async () => {
    if (!outputFile || isUploading) return;
    setIsUploading(true);
    setUploadError(null);
    try {
      const fd = new FormData();
      fd.append("file", outputFile);
      const response = await fetch(`/api/storyclaw-admin/tasks/${task.id}/output`, {
        method: "POST",
        body: fd,
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setUploadError(data?.error ?? "Failed to upload output");
        return;
      }
      setOutputFile(null);
      startTransition(() => router.refresh());
    } catch {
      setUploadError("Network error — please try again");
    } finally {
      setIsUploading(false);
    }
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setOutputFile(event.target.files?.[0] ?? null);
    setUploadError(null);
  };

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
  const uploaded = task.outputPath !== null;

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
        <div className="flex flex-col gap-3 text-xs">
          <div className="rounded border border-slate-200 p-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Output upload
            </p>
            {uploaded ? (
              <p className="mt-1 flex items-center gap-2 text-emerald-700">
                <span aria-hidden>✓</span>
                <span>Output uploaded</span>
                {task.outputSignedUrl ? (
                  <a
                    href={task.outputSignedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                  >
                    Preview
                  </a>
                ) : null}
              </p>
            ) : (
              <p className="mt-1 text-slate-500">No file uploaded yet.</p>
            )}
            <input
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              onChange={onFileChange}
              disabled={isUploading || busy}
              className="mt-2 block w-full text-xs"
            />
            {uploadError ? <p className="mt-1 text-rose-600">{uploadError}</p> : null}
            <button
              type="button"
              onClick={onUpload}
              disabled={!outputFile || isUploading || busy}
              className="mt-2 rounded bg-indigo-600 px-3 py-1 text-white disabled:opacity-50"
            >
              {isUploading ? "Uploading…" : uploaded ? "Replace" : "Upload"}
            </button>
          </div>

          <form onSubmit={onSave} className="flex flex-col gap-2">
            <select
              aria-label="Status"
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
              placeholder="External URL (leave empty if uploading file)"
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
        </div>
      </td>
    </tr>
  );
}
