import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getSample } from "@/features/ai-studio/lib/samples";
import { getQuotaForUser } from "@/features/ai-studio/lib/get-quota";
import { RequestForm } from "@/features/ai-studio/components/RequestForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SampleDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(`/login?next=/studio/samples/${id}`);

  const sample = await getSample(id);
  if (!sample) notFound();
  const quota = await getQuotaForUser(session.user.id);

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[2fr_3fr]">
      <div className="space-y-4">
        <div className="aspect-[9/16] overflow-hidden rounded-xl bg-zinc-900">
          <video
            src={sample.previewUrl}
            controls
            playsInline
            poster={sample.thumbnailUrl ?? undefined}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">{sample.category}</p>
          <h1 className="text-2xl font-semibold leading-tight">{sample.title}</h1>
          {sample.hook ? <p className="text-sm text-zinc-400">{sample.hook}</p> : null}
          {sample.description ? (
            <p className="text-sm text-zinc-300">{sample.description}</p>
          ) : null}
        </div>
      </div>
      <div className="space-y-6">
        <h2 className="text-lg font-semibold">Direct your own version</h2>
        <RequestForm
          sampleId={sample.id}
          targetCategory={sample.category}
          remainingQuota={quota.remaining}
        />
      </div>
    </div>
  );
}
