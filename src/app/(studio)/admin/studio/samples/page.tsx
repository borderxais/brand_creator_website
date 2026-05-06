import Link from "next/link";
import type { SampleCategory } from "@prisma/client";
import { listSamples } from "@/features/ai-studio/lib/samples";

export const dynamic = "force-dynamic";

const CATEGORY_LABEL: Record<SampleCategory, string> = {
  VERTICAL_DRAMA: "Vertical Drama",
  EMOTION_STORY: "Emotion Story",
  LIFESTYLE_VLOG: "Lifestyle Vlog",
  SUSPENSE_THRILLER: "Suspense Thriller",
  OTHER: "Other",
};

function formatRelative(date: Date): string {
  const now = Date.now();
  const diffMs = now - date.getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return `${mo}mo ago`;
  const yr = Math.floor(day / 365);
  return `${yr}y ago`;
}

function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}…`;
}

interface UploadCtaProps {
  variant: "primary" | "ghost";
}

function UploadCta({ variant }: UploadCtaProps) {
  const base = "inline-flex items-center gap-2 rounded px-4 py-2 text-sm transition";
  const styles =
    variant === "primary"
      ? "border border-amber-300/60 bg-amber-400/10 text-amber-200 hover:border-amber-300 hover:bg-amber-400/15"
      : "border border-zinc-700 text-zinc-200 hover:border-zinc-500 hover:bg-zinc-900";
  return (
    <Link href="/admin/studio/samples/new" className={`${base} ${styles}`}>
      Upload sample <span aria-hidden>→</span>
    </Link>
  );
}

export default async function AdminSamplesPage() {
  const samples = await listSamples({ includeInactive: true, limit: 50 });

  return (
    <div className="space-y-12">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">Library</span>
          <h1 className="text-4xl font-light tracking-tight text-zinc-100">Samples</h1>
          <p className="max-w-xl text-sm text-zinc-400">
            Every sample reference, including archived. Edit metadata or pull a sample out of
            rotation without deleting its history.
          </p>
        </div>
        <UploadCta variant="primary" />
      </header>

      {samples.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded border border-dashed border-zinc-800 px-6 py-20 text-center">
          <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">Empty</span>
          <p className="text-lg font-light tracking-tight text-zinc-300">No samples yet.</p>
          <p className="max-w-sm text-sm text-zinc-500">
            Upload your first reference to give creators a starting point.
          </p>
          <UploadCta variant="ghost" />
        </div>
      ) : (
        <section aria-label="Samples table" className="border-y border-zinc-800">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-xs uppercase tracking-[0.18em] text-zinc-500">
                <th scope="col" className="py-3 pr-4 font-normal">
                  Title
                </th>
                <th scope="col" className="py-3 pr-4 font-normal">
                  Category
                </th>
                <th scope="col" className="py-3 pr-4 font-normal">
                  Status
                </th>
                <th scope="col" className="py-3 pr-4 text-right font-normal tabular-nums">
                  Duration
                </th>
                <th scope="col" className="py-3 pr-4 font-normal">
                  Created
                </th>
                <th scope="col" className="py-3 text-right font-normal">
                  <span className="sr-only">Edit</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {samples.map((sample) => {
                const editHref = `/admin/studio/samples/${sample.id}/edit`;
                return (
                  <tr key={sample.id} className="group transition hover:bg-zinc-900/40">
                    <td className="py-4 pr-4 align-top">
                      <Link href={editHref} className="block focus:outline-none">
                        <span className="block text-zinc-100 transition group-hover:text-amber-200">
                          {sample.title}
                        </span>
                        {sample.description ? (
                          <span className="mt-1 block text-xs text-zinc-500">
                            {truncate(sample.description, 110)}
                          </span>
                        ) : null}
                      </Link>
                    </td>
                    <td className="py-4 pr-4 align-top">
                      <span className="inline-flex items-center rounded border border-zinc-800 bg-zinc-900/40 px-2 py-0.5 text-xs uppercase tracking-[0.14em] text-zinc-300">
                        {CATEGORY_LABEL[sample.category]}
                      </span>
                    </td>
                    <td className="py-4 pr-4 align-top">
                      <span className="inline-flex items-center gap-2 text-xs text-zinc-300">
                        <span
                          aria-hidden
                          className={`h-1.5 w-1.5 rounded-full ${
                            sample.isActive ? "bg-emerald-400" : "bg-amber-400"
                          }`}
                        />
                        {sample.isActive ? "Active" : "Archived"}
                      </span>
                    </td>
                    <td className="py-4 pr-4 align-top text-right tabular-nums text-zinc-400">
                      {formatDuration(sample.durationSec)}
                    </td>
                    <td className="py-4 pr-4 align-top text-zinc-400">
                      <time dateTime={sample.createdAt.toISOString()}>
                        {formatRelative(sample.createdAt)}
                      </time>
                    </td>
                    <td className="py-4 align-top text-right">
                      <Link
                        href={editHref}
                        className="text-xs uppercase tracking-[0.18em] text-zinc-500 transition hover:text-amber-200"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
