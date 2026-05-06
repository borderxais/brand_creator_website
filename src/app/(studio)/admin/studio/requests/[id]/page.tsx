import Link from "next/link";
import { notFound } from "next/navigation";
import type { User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireStudioAdmin } from "@/features/ai-studio/lib/api-handler";
import { StatusBadge } from "@/features/ai-studio/components/StatusBadge";
import AdminActionPanel from "@/features/ai-studio/components/AdminActionPanel";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ status?: string }>;
}

function userHandle(user: Pick<User, "email" | "name"> | null): string | null {
  if (!user) return null;
  return user.email ?? user.name ?? null;
}

export default async function AdminRequestDetailPage({ params, searchParams }: PageProps) {
  const session = await requireStudioAdmin();
  const { id } = await params;
  const sp = (await searchParams) ?? {};

  const request = await prisma.videoRequest.findUnique({
    where: { id },
    include: { sample: true, creator: true, claimedBy: true },
  });
  if (!request) notFound();

  const sampleTitle = request.sample?.title ?? "Custom prompt";
  const creatorHandle = userHandle(request.creator) ?? "unknown creator";
  const claimedByHandle = userHandle(request.claimedBy);

  const backHref = sp.status
    ? `/admin/studio/requests?status=${encodeURIComponent(sp.status)}`
    : "/admin/studio/requests";

  return (
    <div className="space-y-10">
      <div>
        <Link
          href={backHref}
          className="text-xs uppercase tracking-[0.2em] text-zinc-500 transition hover:text-zinc-200"
        >
          ← Back to queue
        </Link>
      </div>

      <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">Request</span>
          <h1 className="text-3xl font-light tracking-tight text-zinc-100">{sampleTitle}</h1>
          <p className="text-sm text-zinc-400">
            From <span className="text-zinc-200">{creatorHandle}</span> ·{" "}
            {new Date(request.createdAt).toLocaleString()}
          </p>
        </div>
        <StatusBadge status={request.status} />
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-8">
          <section className="space-y-3">
            <h2 className="text-xs uppercase tracking-[0.2em] text-zinc-500">Prompt</h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-100">
              {request.prompt}
            </p>
          </section>

          {request.styleNotes ? (
            <section className="space-y-3">
              <h2 className="text-xs uppercase tracking-[0.2em] text-zinc-500">Style notes</h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
                {request.styleNotes}
              </p>
            </section>
          ) : null}

          <section className="space-y-3">
            <h2 className="text-xs uppercase tracking-[0.2em] text-zinc-500">Target category</h2>
            <p className="text-sm text-zinc-200">{request.targetCategory}</p>
          </section>

          {request.sample ? (
            <section className="space-y-3">
              <h2 className="text-xs uppercase tracking-[0.2em] text-zinc-500">Reference sample</h2>
              <Link
                href={`/admin/studio/samples/${request.sample.id}`}
                className="inline-flex items-center gap-2 rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-200 hover:border-zinc-500"
              >
                {request.sample.title}
              </Link>
            </section>
          ) : null}

          <section className="space-y-3">
            <h2 className="text-xs uppercase tracking-[0.2em] text-zinc-500">Timeline</h2>
            <ol className="space-y-2 text-sm text-zinc-300">
              <li>
                <span className="text-zinc-500">PENDING</span> ·{" "}
                {new Date(request.createdAt).toLocaleString()}
              </li>
              {request.claimedAt ? (
                <li>
                  <span className="text-zinc-500">IN_PROGRESS</span> ·{" "}
                  {new Date(request.claimedAt).toLocaleString()}
                  {claimedByHandle ? <> · by {claimedByHandle}</> : null}
                </li>
              ) : null}
              {request.status === "DELIVERED" && request.deliveredAt ? (
                <li>
                  <span className="text-emerald-400">DELIVERED</span> ·{" "}
                  {new Date(request.deliveredAt).toLocaleString()}
                </li>
              ) : null}
              {request.status === "REJECTED" ? (
                <li>
                  <span className="text-amber-300">REJECTED</span>
                  {request.rejectionReason ? <> · {request.rejectionReason}</> : null}
                </li>
              ) : null}
              {request.status === "FAILED" ? (
                <li>
                  <span className="text-rose-300">FAILED</span>
                  {request.rejectionReason ? <> · {request.rejectionReason}</> : null}
                </li>
              ) : null}
            </ol>
          </section>
        </div>

        <AdminActionPanel
          request={{
            id: request.id,
            status: request.status,
            creatorId: request.creatorId,
            claimedById: request.claimedById,
            claimedByHandle,
            deliveredAt: request.deliveredAt,
          }}
          viewerId={session.user.id}
        />
      </div>
    </div>
  );
}
