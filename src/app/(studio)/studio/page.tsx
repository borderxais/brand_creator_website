import Link from "next/link";
import { listSamples } from "@/features/ai-studio/lib/samples";
import { SampleCard } from "@/features/ai-studio/components/SampleCard";

export default async function StudioLandingPage() {
  const samples = await listSamples({ limit: 8 });
  const featured = samples[0];
  const rest = samples.slice(1);

  return (
    <div className="space-y-12">
      <section className="space-y-4">
        <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">AI Video Studio</p>
        <h1 className="max-w-2xl text-4xl font-semibold leading-tight md:text-5xl">
          You bring the story.
          <br />
          We bring the production team.
        </h1>
        <p className="max-w-xl text-zinc-400">
          Browse 90-second AI samples, pick a style, and direct your own version. Output is yours.
        </p>
        <div>
          <Link
            href="/studio/samples"
            className="inline-flex rounded-full bg-zinc-100 px-5 py-2 text-sm font-medium text-zinc-900 transition hover:bg-white"
          >
            Browse all samples
          </Link>
        </div>
      </section>

      {featured ? (
        <section className="space-y-4">
          <h2 className="text-sm uppercase tracking-[0.2em] text-zinc-500">Featured</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <SampleCard sample={featured} />
            {rest[0] ? <SampleCard sample={rest[0]} /> : null}
          </div>
        </section>
      ) : null}

      {rest.length > 1 ? (
        <section className="space-y-4">
          <h2 className="text-sm uppercase tracking-[0.2em] text-zinc-500">Latest</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {rest.slice(1).map((s) => (
              <SampleCard key={s.id} sample={s} />
            ))}
          </div>
        </section>
      ) : null}

      {samples.length === 0 ? (
        <section className="rounded-xl border border-dashed border-zinc-800 p-10 text-center text-zinc-500">
          New samples coming this week. Check back soon.
        </section>
      ) : null}
    </div>
  );
}
