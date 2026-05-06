import Link from "next/link";
import { notFound } from "next/navigation";
import { getSample } from "@/features/ai-studio/lib/samples";
import { SampleEditForm } from "@/features/ai-studio/components/SampleEditForm";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminStudioSampleEditPage({ params }: PageProps) {
  const { id } = await params;
  const sample = await getSample(id);
  if (!sample) notFound();

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-start justify-between gap-6">
        <div className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">Edit sample</span>
          <h1 className="text-4xl font-light tracking-tight text-zinc-100">{sample.title}</h1>
          <p className="text-xs text-zinc-500">
            <span className="font-mono text-zinc-600">{sample.id}</span>
          </p>
        </div>
        <Link
          href="/admin/studio/samples"
          className="text-xs uppercase tracking-[0.18em] text-zinc-500 transition hover:text-amber-200"
        >
          <span aria-hidden>←</span> Back to samples
        </Link>
      </header>

      <SampleEditForm sample={sample} />
    </div>
  );
}
