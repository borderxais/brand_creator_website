import type { VideoRequestStatus } from "@prisma/client";

interface StatusBadgeProps {
  status: VideoRequestStatus;
}

const TONE: Record<VideoRequestStatus, { tone: string; label: string }> = {
  PENDING: { tone: "bg-zinc-700/40 text-zinc-200 border-zinc-600", label: "Pending" },
  IN_PROGRESS: { tone: "bg-sky-500/20 text-sky-200 border-sky-500/40", label: "In progress" },
  DELIVERED: {
    tone: "bg-emerald-500/20 text-emerald-200 border-emerald-500/40",
    label: "Delivered",
  },
  REJECTED: { tone: "bg-amber-500/20 text-amber-200 border-amber-500/40", label: "Rejected" },
  FAILED: { tone: "bg-rose-500/20 text-rose-200 border-rose-500/40", label: "Failed" },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const { tone, label } = TONE[status];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${tone}`}
      data-testid="status-badge"
    >
      {label}
    </span>
  );
}
