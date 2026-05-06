import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/features/ai-studio/components/StatusBadge";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function RequestDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(`/login?next=/studio/requests/${id}`);

  const request = await prisma.videoRequest.findUnique({
    where: { id },
    include: { sample: true },
  });
  if (!request) notFound();
  const isAdmin = session.user.role === "STUDIO_ADMIN";
  const isOwner = request.creatorId === session.user.id;
  if (!isAdmin && !isOwner) {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-8 text-rose-200">
        You don&apos;t have access to this request.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">Request</p>
          <h1 className="font-mono text-xl text-zinc-200">{request.id}</h1>
        </div>
        <StatusBadge status={request.status} />
      </header>

      <section className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-sm uppercase tracking-[0.2em] text-zinc-500">Prompt</h2>
          <p className="whitespace-pre-wrap text-sm text-zinc-200">{request.prompt}</p>
          {request.styleNotes ? (
            <>
              <h3 className="pt-4 text-sm uppercase tracking-[0.2em] text-zinc-500">Style notes</h3>
              <p className="whitespace-pre-wrap text-sm text-zinc-300">{request.styleNotes}</p>
            </>
          ) : null}
          <p className="pt-4 text-xs text-zinc-500">
            Submitted {new Date(request.createdAt).toLocaleString()}
          </p>
        </div>

        <div className="space-y-3">
          {request.status === "DELIVERED" && request.outputUrl ? (
            <>
              <h2 className="text-sm uppercase tracking-[0.2em] text-zinc-500">Your video</h2>
              <video
                src={request.outputUrl}
                controls
                playsInline
                className="aspect-[9/16] w-full rounded-xl bg-zinc-900"
              />
              <a
                href={request.outputUrl}
                download
                className="inline-flex rounded-full bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-white"
              >
                Download
              </a>
            </>
          ) : request.status === "REJECTED" || request.status === "FAILED" ? (
            <div className="space-y-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-200">
              <p className="font-medium">
                {request.status === "FAILED" ? "Generation failed" : "Rejected"}
              </p>
              {request.rejectionReason ? <p>{request.rejectionReason}</p> : null}
              <p className="text-amber-300/80">Your quota was refunded — feel free to retry.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 text-sm text-zinc-400">
              <p className="font-medium text-zinc-200">In our queue.</p>
              <p>Typically delivered within 24h. We&apos;ll email you when your video is ready.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
