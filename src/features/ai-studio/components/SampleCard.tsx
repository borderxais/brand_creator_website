import Link from "next/link";
import type { Sample } from "@prisma/client";

interface SampleCardProps {
  sample: Pick<Sample, "id" | "title" | "category" | "hook" | "thumbnailUrl" | "durationSec">;
}

const CATEGORY_LABEL: Record<string, string> = {
  VERTICAL_DRAMA: "Vertical drama",
  EMOTION_STORY: "Emotion",
  LIFESTYLE_VLOG: "Lifestyle",
  SUSPENSE_THRILLER: "Suspense",
  OTHER: "Other",
};

export function SampleCard({ sample }: SampleCardProps) {
  const categoryLabel = CATEGORY_LABEL[sample.category] ?? sample.category;
  return (
    <Link
      href={`/studio/samples/${sample.id}`}
      className="group block overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60 transition hover:-translate-y-0.5 hover:border-zinc-700 hover:shadow-xl"
    >
      <div className="relative aspect-[9/16] w-full bg-zinc-800">
        {sample.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={sample.thumbnailUrl}
            alt={sample.title}
            className="h-full w-full object-cover transition group-hover:scale-[1.02]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-600">no preview</div>
        )}
        <div className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-zinc-200">
          {sample.durationSec}s · {categoryLabel}{" "}
          <span className="opacity-60">{sample.category}</span>
        </div>
      </div>
      <div className="space-y-2 p-4">
        <h3 className="text-lg font-semibold leading-tight">{sample.title}</h3>
        {sample.hook ? <p className="line-clamp-2 text-sm text-zinc-400">{sample.hook}</p> : null}
      </div>
    </Link>
  );
}
