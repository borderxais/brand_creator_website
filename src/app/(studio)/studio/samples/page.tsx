import Link from "next/link";
import { listSamples } from "@/features/ai-studio/lib/samples";
import { SampleCard } from "@/features/ai-studio/components/SampleCard";
import { CategoryEnum } from "@/features/ai-studio/lib/schemas";

const CATEGORY_LABEL: Record<string, string> = {
  ALL: "All",
  VERTICAL_DRAMA: "Drama",
  EMOTION_STORY: "Emotion",
  LIFESTYLE_VLOG: "Lifestyle",
  SUSPENSE_THRILLER: "Suspense",
  OTHER: "Other",
};

interface PageProps {
  searchParams: Promise<{ category?: string; cursor?: string }>;
}

export default async function StudioSamplesPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const categoryParse = sp.category ? CategoryEnum.safeParse(sp.category) : null;
  const category = categoryParse?.success ? categoryParse.data : undefined;
  const samples = await listSamples({ category, cursorId: sp.cursor, limit: 12 });
  const last = samples[samples.length - 1];

  const buildHref = (cat?: string) => {
    const params = new URLSearchParams();
    if (cat && cat !== "ALL") params.set("category", cat);
    return `/studio/samples${params.toString() ? `?${params.toString()}` : ""}`;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">All samples</h1>
          <p className="text-zinc-400">Pick a style and direct your own version.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              "ALL",
              "VERTICAL_DRAMA",
              "EMOTION_STORY",
              "LIFESTYLE_VLOG",
              "SUSPENSE_THRILLER",
              "OTHER",
            ] as const
          ).map((cat) => {
            const active = (cat === "ALL" && !category) || cat === category;
            return (
              <Link
                key={cat}
                href={buildHref(cat)}
                className={`rounded-full border px-3 py-1 text-sm transition ${
                  active
                    ? "border-zinc-100 bg-zinc-100 text-zinc-900"
                    : "border-zinc-700 text-zinc-300 hover:border-zinc-500"
                }`}
              >
                {CATEGORY_LABEL[cat]}
              </Link>
            );
          })}
        </div>
      </div>

      {samples.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 p-12 text-center text-zinc-500">
          No samples in this category yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {samples.map((s) => (
            <SampleCard key={s.id} sample={s} />
          ))}
        </div>
      )}

      {samples.length === 12 && last ? (
        <div className="flex justify-center">
          <Link
            href={`${buildHref(category)}${buildHref(category).includes("?") ? "&" : "?"}cursor=${last.id}`}
            className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:border-zinc-500"
          >
            Load more
          </Link>
        </div>
      ) : null}
    </div>
  );
}
