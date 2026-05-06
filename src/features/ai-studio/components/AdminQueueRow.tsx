import Link from "next/link";
import type { Sample, User, VideoRequest } from "@prisma/client";
import { StatusBadge } from "@/features/ai-studio/components/StatusBadge";

interface AdminQueueRowProps {
  request: VideoRequest & {
    sample: Sample | null;
    creator: User;
    claimedBy: User | null;
  };
}

const RELATIVE_THRESHOLDS: ReadonlyArray<{ limit: number; divisor: number; unit: string }> = [
  { limit: 60_000, divisor: 1_000, unit: "s" },
  { limit: 3_600_000, divisor: 60_000, unit: "m" },
  { limit: 86_400_000, divisor: 3_600_000, unit: "h" },
  { limit: 604_800_000, divisor: 86_400_000, unit: "d" },
];

function formatRelative(date: Date): string {
  const diff = Date.now() - date.getTime();
  if (diff < 0) return "just now";
  for (const { limit, divisor, unit } of RELATIVE_THRESHOLDS) {
    if (diff < limit) {
      const value = Math.max(1, Math.floor(diff / divisor));
      return `${value}${unit} ago`;
    }
  }
  const weeks = Math.floor(diff / 604_800_000);
  return `${weeks}w ago`;
}

function userHandle(user: Pick<User, "email" | "name"> | null): string {
  if (!user) return "unknown";
  return user.email ?? user.name ?? "unknown";
}

const PROMPT_PREVIEW_LIMIT = 80;

function previewPrompt(prompt: string): string {
  if (prompt.length <= PROMPT_PREVIEW_LIMIT) return prompt;
  return `${prompt.slice(0, PROMPT_PREVIEW_LIMIT).trimEnd()}…`;
}

export default function AdminQueueRow({ request }: AdminQueueRowProps) {
  const sampleTitle = request.sample?.title ?? "Custom prompt";
  const creatorHandle = userHandle(request.creator);
  const claimedHandle = request.claimedBy ? userHandle(request.claimedBy) : null;

  return (
    <Link
      href={`/admin/studio/requests/${request.id}`}
      className="block border-b border-zinc-800 px-6 py-5 transition hover:bg-zinc-900/40 focus-visible:bg-zinc-900/40 focus-visible:outline-none"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,12rem)_minmax(0,1fr)_auto] md:items-center">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="truncate text-sm text-zinc-200">{creatorHandle}</span>
          <span className="text-xs text-zinc-500">{formatRelative(request.createdAt)}</span>
        </div>

        <div className="flex min-w-0 flex-col gap-1">
          <span className="truncate text-sm font-medium text-zinc-100">{sampleTitle}</span>
          <span className="line-clamp-1 text-xs text-zinc-400">
            {previewPrompt(request.prompt)}
          </span>
        </div>

        <div className="flex flex-col items-start gap-1 md:items-end">
          <StatusBadge status={request.status} />
          {claimedHandle ? (
            <span className="truncate text-xs text-zinc-500">Claimed by {claimedHandle}</span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
