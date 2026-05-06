# AI Video Studio — Plan B3: Creator UI (Sprint 4) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development.

**Goal:** Build the creator-facing Studio UI: landing, sample gallery, sample detail with request CTA, "My Videos" list, request detail with output player, and billing page. Components and pages call Plan B2 routes via fetch. End state: an authenticated creator can browse samples → submit a request → see PENDING in My Videos → upgrade tier on billing page.

**Architecture:** Next.js 15 App Router under route group `src/app/(studio)/studio/**`. Server Components fetch directly via Plan B1 services (no extra HTTP hop) where session is available; Client Components call Plan B2 routes via fetch when interactivity (form submit, retry) is needed. Shared layout with quota badge in header. Tailwind for styling. No new global state.

**Tech Stack:** Next.js 15 App Router (RSC + client components), Tailwind CSS, TypeScript strict, NextAuth `auth()`, Prisma, Vitest + React Testing Library.

**Spec reference:** [`docs/superpowers/specs/2026-05-05-ai-video-studio-design.md`](../specs/2026-05-05-ai-video-studio-design.md) §7 (creator routes), §9 (in-app), §13 (security), §14 (perf).

**Prereq:** Plan A + B1 + B2 complete.

---

## Design notes (anti-template)

Per `~/.claude/rules/web/design-quality.md`, do NOT ship generic Tailwind cards on white. Studio is creator-facing, premium-feel.

- **Editorial / vertical-video aesthetic.** 9:16 thumbnails dominate; type pairings reinforce "you're a director" framing.
- **Dark surface base** (`bg-zinc-950`) with **off-white panels** for forms; high contrast for video previews.
- **Type:** uppercase tracked labels + bold display weight for hero numbers.
- **Motion:** subtle hover-lift on cards (scale 1.02, shadow); no scroll-jacking.
- **No uniform card grid.** Featured = larger; gallery = staggered 2-col on mobile, 3-col tablet, 4-col desktop.
- **Empty states with character.**

Implementer subagents: pick a coherent palette + type scale once and stick with it.

---

## Task 1: Quota fetch helper + StudioLayout + QuotaBadge

**Files:**

- Create: `src/features/ai-studio/lib/get-quota.ts`
- Test: `src/features/ai-studio/lib/__tests__/get-quota.test.ts`
- Create: `src/features/ai-studio/components/QuotaBadge.tsx`
- Create: `src/app/(studio)/studio/layout.tsx`

Test for `getQuota`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: { subscription: { findUnique: vi.fn() } },
}));

import { prisma } from "@/lib/prisma";
import { getQuotaForUser } from "@/features/ai-studio/lib/get-quota";

beforeEach(() => vi.clearAllMocks());

describe("getQuotaForUser", () => {
  it("returns FREE default when no subscription row", async () => {
    (prisma.subscription.findUnique as any).mockResolvedValue(null);
    const q = await getQuotaForUser("u1");
    expect(q.tier).toBe("FREE");
    expect(q.quotaLimit).toBe(1);
    expect(q.quotaUsed).toBe(0);
    expect(q.exists).toBe(false);
  });

  it("returns the subscription state when present", async () => {
    (prisma.subscription.findUnique as any).mockResolvedValue({
      tier: "STARTER",
      quotaLimit: 5,
      quotaUsed: 2,
      periodEnd: new Date(Date.now() + 86_400_000),
    });
    const q = await getQuotaForUser("u1");
    expect(q.tier).toBe("STARTER");
    expect(q.quotaUsed).toBe(2);
    expect(q.exists).toBe(true);
  });
});
```

Implementation `src/features/ai-studio/lib/get-quota.ts`:

```ts
import { prisma } from "@/lib/prisma";

export interface QuotaState {
  exists: boolean;
  tier: "FREE" | "STARTER" | "PRO";
  quotaLimit: number;
  quotaUsed: number;
  remaining: number;
  periodEnd: Date | null;
}

export async function getQuotaForUser(userId: string): Promise<QuotaState> {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub) {
    return {
      exists: false,
      tier: "FREE",
      quotaLimit: 1,
      quotaUsed: 0,
      remaining: 1,
      periodEnd: null,
    };
  }
  return {
    exists: true,
    tier: sub.tier,
    quotaLimit: sub.quotaLimit,
    quotaUsed: sub.quotaUsed,
    remaining: Math.max(0, sub.quotaLimit - sub.quotaUsed),
    periodEnd: sub.periodEnd,
  };
}
```

`src/features/ai-studio/components/QuotaBadge.tsx`:

```tsx
import type { QuotaState } from "@/features/ai-studio/lib/get-quota";

interface QuotaBadgeProps {
  quota: QuotaState;
  className?: string;
}

export function QuotaBadge({ quota, className = "" }: QuotaBadgeProps) {
  const isExhausted = quota.remaining === 0;
  const tone = isExhausted
    ? "bg-amber-500/15 text-amber-200 border-amber-500/30"
    : "bg-emerald-500/15 text-emerald-200 border-emerald-500/30";
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium ${tone} ${className}`}
      data-testid="quota-badge"
    >
      <span className="font-mono tabular-nums">
        {quota.quotaUsed} / {quota.quotaLimit}
      </span>
      <span className="opacity-70">{quota.tier}</span>
    </div>
  );
}
```

`src/app/(studio)/studio/layout.tsx`:

```tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getQuotaForUser } from "@/features/ai-studio/lib/get-quota";
import { QuotaBadge } from "@/features/ai-studio/components/QuotaBadge";

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?next=/studio");
  const quota = await getQuotaForUser(session.user.id);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 bg-zinc-900/40 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/studio" className="text-lg font-semibold tracking-tight">
            Studio
          </Link>
          <nav className="flex items-center gap-6 text-sm text-zinc-400">
            <Link href="/studio/samples" className="hover:text-zinc-100">
              Browse
            </Link>
            <Link href="/studio/requests" className="hover:text-zinc-100">
              My videos
            </Link>
            <Link href="/studio/billing" className="hover:text-zinc-100">
              Billing
            </Link>
            <QuotaBadge quota={quota} />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10">{children}</main>
    </div>
  );
}
```

Commit: `feat(studio): studio layout, quota fetcher, and QuotaBadge component`

---

## Task 2: SampleCard component

`src/features/ai-studio/components/__tests__/SampleCard.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SampleCard } from "@/features/ai-studio/components/SampleCard";

const sample = {
  id: "s1",
  title: "Late-Night Subway",
  category: "EMOTION_STORY",
  hook: "First 3s: stranger reads the same poem on the wall every night",
  thumbnailUrl: "/test-thumb.jpg",
  durationSec: 90,
};

describe("SampleCard", () => {
  it("renders title, category, and hook", () => {
    render(<SampleCard sample={sample as any} />);
    expect(screen.getByText("Late-Night Subway")).toBeInTheDocument();
    expect(screen.getByText(/EMOTION_STORY/)).toBeInTheDocument();
    expect(screen.getByText(/First 3s/)).toBeInTheDocument();
  });

  it("links to /studio/samples/[id]", () => {
    render(<SampleCard sample={sample as any} />);
    const link = screen.getByRole("link", { name: /Late-Night Subway/i });
    expect(link).toHaveAttribute("href", "/studio/samples/s1");
  });
});
```

`src/features/ai-studio/components/SampleCard.tsx`:

```tsx
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
```

Commit: `feat(studio): SampleCard component with 9:16 thumb + hook`

---

## Task 3: StatusBadge component

`src/features/ai-studio/components/__tests__/StatusBadge.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "@/features/ai-studio/components/StatusBadge";

describe("StatusBadge", () => {
  it.each([
    ["PENDING", /pending/i],
    ["IN_PROGRESS", /in progress/i],
    ["DELIVERED", /delivered/i],
    ["REJECTED", /rejected/i],
    ["FAILED", /failed/i],
  ] as const)("renders %s with human label", (status, expected) => {
    render(<StatusBadge status={status} />);
    expect(screen.getByText(expected)).toBeInTheDocument();
  });
});
```

`src/features/ai-studio/components/StatusBadge.tsx`:

```tsx
import type { VideoRequestStatus } from "@prisma/client";

interface StatusBadgeProps {
  status: VideoRequestStatus;
}

const TONE: Record<VideoRequestStatus, { tone: string; label: string }> = {
  PENDING: { tone: "bg-zinc-700/40 text-zinc-200 border-zinc-600", label: "Pending" },
  IN_PROGRESS: { tone: "bg-sky-500/20 text-sky-200 border-sky-500/40", label: "In progress" },
  DELIVERED: {
    tone: "bg-emerald-500/20 text-emerald-200 border-emerald-500/40",
    label: "Delivered",
  },
  REJECTED: { tone: "bg-amber-500/20 text-amber-200 border-amber-500/40", label: "Rejected" },
  FAILED: { tone: "bg-rose-500/20 text-rose-200 border-rose-500/40", label: "Failed" },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const { tone, label } = TONE[status];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${tone}`}
      data-testid="status-badge"
    >
      {label}
    </span>
  );
}
```

Commit: `feat(studio): StatusBadge for video request states`

---

## Task 4: Studio landing `/studio`

`src/app/(studio)/studio/page.tsx`:

```tsx
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
```

Commit: `feat(studio): /studio landing with hero + featured + latest`

---

## Task 5: Gallery `/studio/samples`

`src/app/(studio)/studio/samples/page.tsx`:

```tsx
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
```

Commit: `feat(studio): /studio/samples gallery with category filter + cursor pagination`

---

## Task 6: RequestForm component (client)

`src/features/ai-studio/components/__tests__/RequestForm.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { RequestForm } from "@/features/ai-studio/components/RequestForm";

beforeEach(() => {
  global.fetch = vi.fn();
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe("RequestForm", () => {
  it("disables submit when prompt < 30 chars", () => {
    render(<RequestForm sampleId="s1" targetCategory="EMOTION_STORY" remainingQuota={5} />);
    const submit = screen.getByRole("button", { name: /submit request/i });
    expect(submit).toBeDisabled();
  });

  it("enables submit and posts to /api/studio/requests", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ request: { id: "r1" } }),
    });
    render(<RequestForm sampleId="s1" targetCategory="EMOTION_STORY" remainingQuota={5} />);
    fireEvent.change(screen.getByLabelText(/prompt/i), { target: { value: "A".repeat(40) } });
    fireEvent.click(screen.getByRole("button", { name: /submit request/i }));
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const init = (global.fetch as any).mock.calls[0][1];
    expect(JSON.parse(init.body).prompt.length).toBe(40);
  });

  it("shows upgrade CTA when remainingQuota=0", () => {
    render(<RequestForm sampleId="s1" targetCategory="EMOTION_STORY" remainingQuota={0} />);
    expect(screen.getByText(/no requests left/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /upgrade/i })).toBeInTheDocument();
  });
});
```

`src/features/ai-studio/components/RequestForm.tsx`:

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface RequestFormProps {
  sampleId?: string;
  targetCategory: string;
  remainingQuota: number;
}

export function RequestForm({ sampleId, targetCategory, remainingQuota }: RequestFormProps) {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [styleNotes, setStyleNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const promptValid = prompt.trim().length >= 30;
  const canSubmit = promptValid && remainingQuota > 0 && !submitting;

  if (remainingQuota <= 0) {
    return (
      <div className="space-y-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-5">
        <p className="text-sm text-amber-200">No requests left this period.</p>
        <Link
          href="/studio/billing"
          className="inline-flex rounded-full bg-amber-400 px-4 py-1.5 text-sm font-medium text-amber-950 transition hover:bg-amber-300"
        >
          Upgrade plan
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/studio/requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sampleId,
          targetCategory,
          prompt,
          styleNotes: styleNotes || undefined,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Submission failed");
        return;
      }
      router.push(`/studio/requests/${body.request.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="prompt" className="block text-sm font-medium text-zinc-200">
          Prompt
        </label>
        <p className="mt-1 text-xs text-zinc-500">Describe your story. Min 30 characters.</p>
        <textarea
          id="prompt"
          required
          minLength={30}
          maxLength={1500}
          rows={6}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-sm leading-relaxed text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-400 focus:outline-none"
          placeholder="A late-night driver picks up a passenger who recognizes the song on the radio…"
        />
        <p className="mt-1 text-xs text-zinc-500">
          {prompt.length} / 1500 {promptValid ? "✓" : "(need 30+)"}
        </p>
      </div>

      <div>
        <label htmlFor="style" className="block text-sm font-medium text-zinc-200">
          Style notes <span className="text-zinc-500">(optional)</span>
        </label>
        <textarea
          id="style"
          rows={3}
          maxLength={500}
          value={styleNotes}
          onChange={(e) => setStyleNotes(e.target.value)}
          className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-400 focus:outline-none"
          placeholder="Slower pacing, neon palette, English voiceover…"
        />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-500">
          Costs 1 of your {remainingQuota} remaining requests this period.
        </p>
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-full bg-zinc-100 px-5 py-2 text-sm font-medium text-zinc-900 transition hover:bg-white disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
        >
          {submitting ? "Submitting…" : "Submit request"}
        </button>
      </div>

      {error ? (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
          {error}
        </p>
      ) : null}
    </form>
  );
}
```

Commit: `feat(studio): RequestForm with quota gate + upgrade CTA`

---

## Task 7: Sample detail `/studio/samples/[id]`

`src/app/(studio)/studio/samples/[id]/page.tsx`:

```tsx
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
```

Commit: `feat(studio): /studio/samples/[id] sample detail + RequestForm`

---

## Task 8: My Videos `/studio/requests` + detail `/studio/requests/[id]`

`src/app/(studio)/studio/requests/page.tsx`:

```tsx
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
```

`src/app/(studio)/studio/requests/[id]/page.tsx`:

```tsx
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
```

Commit: `feat(studio): /studio/requests list + detail with output player`

---

## Task 9: Billing page `/studio/billing` + BillingActions client

`src/features/ai-studio/components/BillingActions.tsx`:

```tsx
"use client";

import { useState } from "react";

interface BillingActionsProps {
  hasStripeCustomer: boolean;
}

export function BillingActions({ hasStripeCustomer }: BillingActionsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout(tier: "STARTER" | "PRO") {
    setError(null);
    setLoading(tier);
    try {
      const res = await fetch("/api/studio/billing/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const body = await res.json();
      if (!res.ok || !body.url) {
        setError(body.error ?? "Checkout failed");
        return;
      }
      window.location.href = body.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(null);
    }
  }

  async function openPortal() {
    setError(null);
    setLoading("PORTAL");
    try {
      const res = await fetch("/api/studio/billing/portal", { method: "POST" });
      const body = await res.json();
      if (!res.ok || !body.url) {
        setError(body.error ?? "Portal unavailable");
        return;
      }
      window.location.href = body.url;
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => startCheckout("STARTER")}
          disabled={loading !== null}
          className="rounded-full bg-zinc-100 px-5 py-2 text-sm font-medium text-zinc-900 transition hover:bg-white disabled:opacity-50"
        >
          {loading === "STARTER" ? "Redirecting…" : "Upgrade to Starter ($69/mo)"}
        </button>
        <button
          onClick={() => startCheckout("PRO")}
          disabled={loading !== null}
          className="rounded-full bg-emerald-400 px-5 py-2 text-sm font-medium text-emerald-950 transition hover:bg-emerald-300 disabled:opacity-50"
        >
          {loading === "PRO" ? "Redirecting…" : "Upgrade to Pro ($199/mo)"}
        </button>
        {hasStripeCustomer ? (
          <button
            onClick={openPortal}
            disabled={loading !== null}
            className="rounded-full border border-zinc-700 px-5 py-2 text-sm text-zinc-300 hover:border-zinc-500 disabled:opacity-50"
          >
            {loading === "PORTAL" ? "Opening…" : "Manage subscription"}
          </button>
        ) : null}
      </div>
      {error ? (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
          {error}
        </p>
      ) : null}
    </div>
  );
}
```

`src/app/(studio)/studio/billing/page.tsx`:

```tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BillingActions } from "@/features/ai-studio/components/BillingActions";

const PLAN_DETAILS = {
  FREE: { name: "Free trial", price: "$0", quota: "1 lifetime trial" },
  STARTER: { name: "Starter", price: "$69 / month", quota: "5 videos / month" },
  PRO: { name: "Pro", price: "$199 / month", quota: "20 videos / month" },
} as const;

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?next=/studio/billing");
  const sub = await prisma.subscription.findUnique({ where: { userId: session.user.id } });
  const tier = sub?.tier ?? "FREE";
  const details = PLAN_DETAILS[tier];

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">Billing</p>
        <h1 className="text-3xl font-semibold tracking-tight">Your plan</h1>
      </header>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-zinc-400">Current plan</p>
            <p className="text-2xl font-semibold">{details.name}</p>
            <p className="text-zinc-300">{details.price}</p>
            <p className="text-xs text-zinc-500">
              Quota: {sub?.quotaUsed ?? 0} / {sub?.quotaLimit ?? 1} used · {details.quota}
            </p>
          </div>
          {sub?.cancelAtPeriodEnd ? (
            <p className="rounded-full bg-amber-500/15 px-3 py-1 text-xs text-amber-200">
              Cancels at period end (
              {sub.periodEnd ? new Date(sub.periodEnd).toLocaleDateString() : "—"})
            </p>
          ) : null}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Upgrade or manage</h2>
        <BillingActions hasStripeCustomer={Boolean(sub?.stripeCustomerId)} />
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {(["FREE", "STARTER", "PRO"] as const).map((t) => {
          const d = PLAN_DETAILS[t];
          const active = t === tier;
          return (
            <div
              key={t}
              className={`rounded-xl border p-5 ${
                active ? "border-emerald-500/40 bg-emerald-500/5" : "border-zinc-800 bg-zinc-900/30"
              }`}
            >
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">{d.name}</p>
              <p className="mt-1 text-2xl font-semibold">{d.price}</p>
              <p className="mt-2 text-sm text-zinc-300">{d.quota}</p>
              {active ? <p className="mt-3 text-xs text-emerald-200">Current plan</p> : null}
            </div>
          );
        })}
      </section>
    </div>
  );
}
```

Commit: `feat(studio): /studio/billing plan picker + Stripe checkout/portal`

---

## Task 10: Sanity check + manual smoke + push

- [ ] `npm run harness:prepush` — expect green
- [ ] Manual UI smoke against `npm run dev`: log in as `creator-starter@test.local` (password `dev-password-only-not-prod` from seed), visit `/studio`, `/studio/samples`, `/studio/requests`, `/studio/billing`. All pages render without console errors.
- [ ] `git push origin main`

---

## Definition of Done (Plan B3)

- [ ] All 10 tasks committed.
- [ ] `npm run harness:prepush` passes.
- [ ] All 6 pages render without console errors.
- [ ] Quota badge reflects real subscription state.
- [ ] Submitting a request from sample detail navigates to `/studio/requests/[id]` and shows PENDING.

---

## Plan C preview

- **Plan C — Admin + polish (Sprint 5+6+7+8):** admin queue UI, sample upload flow, deliver/reject/fail UI, transactional email templates, full E2E happy paths via Playwright, perf budget verification, ship-ready polish.
