import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listRequestsForCreator } from "@/features/ai-studio/lib/requests";
import { StatusBadge } from "@/features/ai-studio/components/StatusBadge";

export default async function MyVideosPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?next=/studio/requests");
  const requests = await listRequestsForCreator({ creatorId: session.user.id, limit: 50 });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">My videos</h1>
          <p className="text-zinc-400">Track every request you&apos;ve sent.</p>
        </div>
        <Link
          href="/studio/samples"
          className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:border-zinc-500"
        >
          Browse samples
        </Link>
      </div>

      {requests.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 p-10 text-center text-zinc-500">
          No requests yet — pick a sample to direct your first AI video.
        </div>
      ) : (
        <ul className="space-y-3">
          {requests.map((r) => (
            <li key={r.id}>
              <Link
                href={`/studio/requests/${r.id}`}
                className="flex items-start justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 transition hover:border-zinc-700"
              >
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm text-zinc-200">{r.prompt}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {new Date(r.createdAt).toLocaleString()} · {r.targetCategory}
                  </p>
                </div>
                <StatusBadge status={r.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
