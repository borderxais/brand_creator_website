import Link from "next/link";
import type { VideoRequestStatus } from "@prisma/client";
import { listAdminQueue } from "@/features/ai-studio/lib/requests";
import AdminQueueRow from "@/features/ai-studio/components/AdminQueueRow";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

type FilterKey = "ALL" | "QUEUE" | VideoRequestStatus;

const ALL_STATUSES: ReadonlyArray<VideoRequestStatus> = [
  "PENDING",
  "IN_PROGRESS",
  "DELIVERED",
  "REJECTED",
  "FAILED",
];

const STATUS_SET = new Set<string>(ALL_STATUSES);

interface ChipDef {
  key: FilterKey;
  label: string;
  param?: string;
}

const CHIPS: ReadonlyArray<ChipDef> = [
  { key: "QUEUE", label: "Queue" },
  { key: "ALL", label: "All", param: "ALL" },
  { key: "PENDING", label: "Pending", param: "PENDING" },
  { key: "IN_PROGRESS", label: "In progress", param: "IN_PROGRESS" },
  { key: "DELIVERED", label: "Delivered", param: "DELIVERED" },
  { key: "REJECTED", label: "Rejected", param: "REJECTED" },
  { key: "FAILED", label: "Failed", param: "FAILED" },
];

function resolveFilter(rawStatus: string | undefined): FilterKey {
  if (!rawStatus) return "QUEUE";
  if (rawStatus === "ALL") return "ALL";
  if (STATUS_SET.has(rawStatus)) return rawStatus as VideoRequestStatus;
  return "QUEUE";
}

const FILTER_HEADINGS: Record<FilterKey, string> = {
  QUEUE: "Active queue",
  ALL: "All requests",
  PENDING: "Pending",
  IN_PROGRESS: "In progress",
  DELIVERED: "Delivered",
  REJECTED: "Rejected",
  FAILED: "Failed",
};

function buildHref(param: string | undefined): string {
  return param ? `/admin/studio/requests?status=${param}` : "/admin/studio/requests";
}

async function loadRows(filter: FilterKey) {
  if (filter === "QUEUE") {
    return listAdminQueue({ limit: 100 });
  }
  if (filter === "ALL") {
    return listAdminQueue({ status: [...ALL_STATUSES], limit: 100 });
  }
  return listAdminQueue({ status: filter, limit: 100 });
}

export default async function AdminQueuePage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const filter = resolveFilter(sp.status);
  const rows = await loadRows(filter);

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-2">
        <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">Queue</span>
        <h1 className="text-4xl font-light tracking-tight text-zinc-100">
          {FILTER_HEADINGS[filter]}
        </h1>
        <p className="text-sm text-zinc-400">
          {rows.length} {rows.length === 1 ? "request" : "requests"}
        </p>
      </header>

      <nav aria-label="Filter requests" className="flex flex-wrap gap-2">
        {CHIPS.map((chip) => {
          const active = chip.key === filter;
          return (
            <Link
              key={chip.key}
              href={buildHref(chip.param)}
              className={`rounded-full border px-3 py-1 text-sm transition ${
                active
                  ? "border-zinc-100 bg-zinc-100 text-zinc-900"
                  : "border-zinc-700 text-zinc-300 hover:border-zinc-500"
              }`}
            >
              {chip.label}
            </Link>
          );
        })}
      </nav>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 p-12 text-center text-zinc-500">
          No requests match this filter.
        </div>
      ) : (
        <section className="border-t border-zinc-800">
          {rows.map((row) => (
            <AdminQueueRow key={row.id} request={row} />
          ))}
        </section>
      )}
    </div>
  );
}
