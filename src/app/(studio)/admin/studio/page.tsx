import Link from "next/link";
import { getAdminStats } from "@/features/ai-studio/lib/requests";

export const dynamic = "force-dynamic";

interface StatTileProps {
  label: string;
  value: number;
  hint?: string;
  href?: string;
}

function StatTile({ label, value, hint, href }: StatTileProps) {
  const inner = (
    <div className="flex flex-col gap-3 py-8">
      <span className="text-xs uppercase tracking-[0.18em] text-zinc-500">{label}</span>
      <span className="text-6xl font-light tabular-nums tracking-tight text-zinc-100">{value}</span>
      {hint ? <span className="text-xs text-zinc-500">{hint}</span> : null}
    </div>
  );
  if (!href) return <div className="px-6">{inner}</div>;
  return (
    <Link
      href={href}
      className="block px-6 transition hover:bg-zinc-900/40 focus-visible:bg-zinc-900/40 focus-visible:outline-none"
    >
      {inner}
    </Link>
  );
}

export default async function AdminStudioDashboardPage() {
  const stats = await getAdminStats();

  return (
    <div className="space-y-12">
      <header className="flex flex-col gap-2">
        <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">Operations</span>
        <h1 className="text-4xl font-light tracking-tight text-zinc-100">Dashboard</h1>
        <p className="text-sm text-zinc-400">Live counts. Click a tile to drill into the queue.</p>
      </header>

      <section
        aria-label="Request status counts"
        className="grid grid-cols-1 divide-y divide-zinc-800 border-y border-zinc-800 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4"
      >
        <StatTile
          label="Pending"
          value={stats.pending}
          hint="Awaiting claim"
          href="/admin/studio/requests?status=PENDING"
        />
        <StatTile
          label="In progress"
          value={stats.inProgress}
          hint="Currently claimed"
          href="/admin/studio/requests?status=IN_PROGRESS"
        />
        <StatTile
          label="Delivered"
          value={stats.delivered7d}
          hint="Last 7 days"
          href="/admin/studio/requests?status=DELIVERED"
        />
        <StatTile
          label="Failed"
          value={stats.failed7d}
          hint="Last 7 days"
          href="/admin/studio/requests?status=FAILED"
        />
      </section>

      <nav className="flex flex-wrap gap-3 text-sm">
        <Link
          href="/admin/studio/requests"
          className="rounded border border-zinc-700 px-4 py-2 text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900"
        >
          Open queue →
        </Link>
        <Link
          href="/admin/studio/samples"
          className="rounded border border-zinc-800 px-4 py-2 text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-900"
        >
          Manage samples
        </Link>
        <Link
          href="/admin/studio/samples/new"
          className="rounded border border-zinc-800 px-4 py-2 text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-900"
        >
          Upload sample
        </Link>
      </nav>
    </div>
  );
}
