"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { VideoRequestStatus } from "@prisma/client";

interface AdminActionPanelRequest {
  id: string;
  status: VideoRequestStatus;
  creatorId: string;
  claimedById: string | null;
  claimedByHandle: string | null;
  deliveredAt: Date | null;
}

interface AdminActionPanelProps {
  request: AdminActionPanelRequest;
  viewerId: string;
}

const MAX_OUTPUT_BYTES = 200 * 1024 * 1024;
const MIN_DURATION = 1;
const MAX_DURATION = 600;
const MAX_REASON_LEN = 500;

async function postJson(url: string, body?: Record<string, unknown>): Promise<unknown> {
  const res = await fetch(url, {
    method: "POST",
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new Error(data.error ?? `request failed (${res.status})`);
  return data;
}

function formatRelative(date: Date): string {
  const diff = Date.now() - date.getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

export default function AdminActionPanel({ request, viewerId }: AdminActionPanelProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [reason, setReason] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [duration, setDuration] = useState<number>(90);

  const isMine = request.claimedById === viewerId;

  async function withBusy(fn: () => Promise<void>): Promise<void> {
    setError(null);
    setBusy(true);
    try {
      await fn();
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "unexpected error");
    } finally {
      setBusy(false);
    }
  }

  async function handleClaim(): Promise<void> {
    await withBusy(async () => {
      await postJson(`/api/studio/requests/${request.id}/claim`);
    });
  }

  async function handleRelease(): Promise<void> {
    if (!confirm("Release this request back to the pending queue?")) return;
    await withBusy(async () => {
      await postJson(`/api/studio/requests/${request.id}/release`);
    });
  }

  async function handleTakeOver(): Promise<void> {
    if (!confirm("Release this from the current admin and claim it yourself?")) return;
    await withBusy(async () => {
      await postJson(`/api/studio/requests/${request.id}/release`);
      await postJson(`/api/studio/requests/${request.id}/claim`);
    });
  }

  async function handleFail(): Promise<void> {
    if (!confirm("Mark this request as failed? Quota will be refunded to the creator.")) return;
    await withBusy(async () => {
      await postJson(`/api/studio/requests/${request.id}/fail`);
    });
  }

  async function handleReject(): Promise<void> {
    const trimmed = reason.trim();
    if (!trimmed) {
      setError("reason is required");
      return;
    }
    if (trimmed.length > MAX_REASON_LEN) {
      setError(`reason must be ≤ ${MAX_REASON_LEN} chars`);
      return;
    }
    await withBusy(async () => {
      await postJson(`/api/studio/requests/${request.id}/reject`, { reason: trimmed });
      setReason("");
      setShowRejectForm(false);
    });
  }

  async function handleUploadAndDeliver(): Promise<void> {
    if (!file) {
      setError("select an mp4 file");
      return;
    }
    if (file.type !== "video/mp4") {
      setError("file must be video/mp4");
      return;
    }
    if (file.size > MAX_OUTPUT_BYTES) {
      setError(`file exceeds 200 MB`);
      return;
    }
    if (duration < MIN_DURATION || duration > MAX_DURATION) {
      setError(`duration must be ${MIN_DURATION}..${MAX_DURATION} seconds`);
      return;
    }
    await withBusy(async () => {
      const signed = (await postJson(`/api/studio/admin/output-upload-url`, {
        requestId: request.id,
      })) as { uploadUrl: string; path: string };
      const uploadRes = await fetch(signed.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": "video/mp4", "x-upsert": "true" },
        body: file,
      });
      if (!uploadRes.ok) throw new Error(`upload failed (${uploadRes.status})`);
      await postJson(`/api/studio/requests/${request.id}/deliver`, {
        outputUrl: signed.path,
        outputDurationSec: duration,
      });
    });
  }

  const status = request.status;

  return (
    <aside
      aria-busy={busy}
      className="space-y-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6"
    >
      <h2 className="text-sm uppercase tracking-[0.2em] text-zinc-400">Actions</h2>

      {error ? (
        <p className="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </p>
      ) : null}

      {status === "PENDING" ? (
        <button
          type="button"
          disabled={busy}
          onClick={handleClaim}
          className="w-full rounded-full bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-white disabled:opacity-50"
        >
          {busy ? "Claiming…" : "Claim"}
        </button>
      ) : null}

      {status === "IN_PROGRESS" && isMine ? (
        <div className="space-y-5">
          <section className="space-y-3">
            <h3 className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              Upload &amp; deliver
            </h3>
            <label className="block space-y-1 text-xs text-zinc-400">
              <span>MP4 file (≤ 200 MB)</span>
              <input
                type="file"
                accept="video/mp4"
                disabled={busy}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-zinc-200 file:mr-3 file:rounded-full file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-zinc-900"
              />
            </label>
            <label className="block space-y-1 text-xs text-zinc-400">
              <span>Duration (seconds)</span>
              <input
                type="number"
                min={MIN_DURATION}
                max={MAX_DURATION}
                step={1}
                value={duration}
                disabled={busy}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="block w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-100"
              />
            </label>
            <button
              type="button"
              disabled={busy || !file}
              onClick={handleUploadAndDeliver}
              className="w-full rounded-full bg-emerald-400/90 px-4 py-2 text-sm font-medium text-emerald-950 hover:bg-emerald-300 disabled:opacity-50"
            >
              {busy ? "Working…" : "Upload & deliver"}
            </button>
          </section>

          <section className="space-y-2">
            {showRejectForm ? (
              <div className="space-y-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
                <label className="block space-y-1 text-xs text-amber-200">
                  <span>Reason</span>
                  <textarea
                    required
                    maxLength={MAX_REASON_LEN}
                    rows={3}
                    value={reason}
                    disabled={busy}
                    onChange={(e) => setReason(e.target.value)}
                    className="block w-full rounded-md border border-amber-500/30 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
                  />
                  <span className="text-[10px] text-amber-300/70">
                    {reason.length}/{MAX_REASON_LEN}
                  </span>
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={handleReject}
                    className="rounded-full bg-amber-300 px-4 py-1.5 text-xs font-medium text-amber-950 hover:bg-amber-200 disabled:opacity-50"
                  >
                    Confirm reject
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setShowRejectForm(false);
                      setReason("");
                      setError(null);
                    }}
                    className="rounded-full border border-zinc-700 px-4 py-1.5 text-xs text-zinc-300 hover:border-zinc-500"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setShowRejectForm(true);
                  setError(null);
                }}
                className="w-full rounded-full border border-amber-500/40 px-4 py-2 text-sm text-amber-200 hover:border-amber-400 disabled:opacity-50"
              >
                Reject
              </button>
            )}
            <button
              type="button"
              disabled={busy}
              onClick={handleFail}
              className="w-full rounded-full border border-rose-500/40 px-4 py-2 text-sm text-rose-200 hover:border-rose-400 disabled:opacity-50"
            >
              Mark failed
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={handleRelease}
              className="w-full rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:border-zinc-500 disabled:opacity-50"
            >
              Release back to queue
            </button>
          </section>
        </div>
      ) : null}

      {status === "IN_PROGRESS" && !isMine ? (
        <div className="space-y-3">
          <p className="text-sm text-zinc-300">
            Claimed by{" "}
            <span className="text-zinc-100">{request.claimedByHandle ?? "another admin"}</span>
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={handleTakeOver}
            className="w-full rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-200 hover:border-zinc-500 disabled:opacity-50"
          >
            {busy ? "Working…" : "Release & take over"}
          </button>
        </div>
      ) : null}

      {status === "DELIVERED" ? (
        <p className="text-sm text-emerald-200">
          Delivered{request.deliveredAt ? ` ${formatRelative(new Date(request.deliveredAt))}` : ""}.
        </p>
      ) : null}
      {status === "REJECTED" ? (
        <p className="text-sm text-amber-200">Rejected — quota refunded.</p>
      ) : null}
      {status === "FAILED" ? (
        <p className="text-sm text-rose-200">Failed — quota refunded.</p>
      ) : null}
    </aside>
  );
}
