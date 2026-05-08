"use client";

import Link from "next/link";
import "./ai-video-welcome.css";

interface AiVideoWelcomeProps {
  creatorName: string;
}

interface SampleReel {
  palette: string;
  category: string;
  title: string;
  hook: string;
  completion: string;
  status: "ready" | "trending" | "bookmarked" | "preview";
  isNew?: boolean;
  bookmarked?: boolean;
}

const samples: SampleReel[] = [
  {
    palette: "pal-drama",
    category: "Vertical drama",
    title: "“The Roommate I Hired”",
    hook: "Hook 9.1",
    completion: "78% completion",
    status: "ready",
  },
  {
    palette: "pal-vlog",
    category: "Lifestyle vlog",
    title: "“30 days, no spending.”",
    hook: "Hook 8.4",
    completion: "71% completion",
    status: "ready",
  },
  {
    palette: "pal-thrill",
    category: "Thriller",
    title: "“The Last Voicemail”",
    hook: "Hook 9.4",
    completion: "81% completion",
    status: "trending",
    isNew: true,
  },
  {
    palette: "pal-emo",
    category: "Emotional",
    title: "“Letter to my younger self.”",
    hook: "Hook 8.9",
    completion: "76% completion",
    status: "bookmarked",
    bookmarked: true,
  },
  {
    palette: "pal-com",
    category: "Comedy skit",
    title: "“My GPS hates me.”",
    hook: "Hook 8.1",
    completion: "69% completion",
    status: "preview",
  },
  {
    palette: "pal-life",
    category: "Travel",
    title: "“$5 dinner in Lisbon.”",
    hook: "Hook 8.7",
    completion: "74% completion",
    status: "ready",
  },
  {
    palette: "pal-drama",
    category: "Vertical drama",
    title: "“He emailed the wrong person.”",
    hook: "Hook 9.0",
    completion: "79% completion",
    status: "ready",
  },
  {
    palette: "pal-vlog",
    category: "Lifestyle",
    title: "“Sunday reset routine.”",
    hook: "Hook 8.2",
    completion: "72% completion",
    status: "ready",
  },
];

const statusBadge: Record<SampleReel["status"], { label: string; cls: string }> = {
  ready: { label: "Ready", cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" },
  trending: { label: "Trending", cls: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200" },
  bookmarked: { label: "★ Bookmarked", cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-200" },
  preview: { label: "Preview", cls: "bg-slate-50 text-slate-600 ring-1 ring-slate-200" },
};

const distributionChannels = [
  "TikTok",
  "Instagram Reels",
  "YouTube Shorts",
  "Roku",
  "Pluto TV",
  "Tubi",
  "Snapchat Spotlight",
  "Facebook Reels",
  "FAST TV — 200M households",
];

const starterFeatures = [
  "20 AI remixes / month",
  "1080p export, 9:16 + 1:1",
  "Direct-publish: TikTok, Reels, Shorts",
  "Email support",
];

const proFeatures = [
  "Unlimited AI remixes",
  "4K export · multi-format",
  "500-channel distribution + FAST TV pipeline",
  "60–70% rev-share on distribution earnings",
  "Priority brand-deal matching",
];

const filterTabs: Array<[string, number]> = [
  ["Vertical drama", 4],
  ["Lifestyle vlog", 3],
  ["Thriller", 2],
  ["Emotional", 3],
];

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <circle cx={12} cy={12} r={9} />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function BookmarkIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l2.39 4.84L20 9l-4 3.9.94 5.5L12 16l-4.94 2.4L8 12.9 4 9l5.61-1.16L12 2z" />
    </svg>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  );
}

export default function AiVideoWelcome({ creatorName }: AiVideoWelcomeProps) {
  return (
    <div className="overflow-x-hidden bg-[#f7f8fb] text-slate-900">
      {/* HERO */}
      <section className="av-mesh av-grain relative overflow-hidden text-white">
        <div className="relative mx-auto max-w-[1200px] px-6 pt-12 pb-20 lg:px-10">
          <div className="av-mono flex items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-white/70">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/15">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              Live · 8 new samples this week
            </span>
            <span className="hidden md:inline">AI-Generated · FTC-disclosed</span>
          </div>

          <div className="mt-8 grid items-end gap-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <h1 className="text-[44px] font-extrabold leading-[1.02] tracking-tight sm:text-[56px]">
                Welcome, <span className="text-indigo-200">{creatorName}.</span>
                <br />
                Your{" "}
                <span className="bg-gradient-to-r from-indigo-200 via-fuchsia-200 to-amber-100 bg-clip-text text-transparent">
                  90-second sample reels
                </span>{" "}
                are ready.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-white/75">
                Browse the latest AI-built sample reels across drama, vlog, thriller, and lifestyle.
                Bookmark what fits your audience — then unlock the Creator Pack to remix any sample
                with your own script and voice.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#showcase"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-indigo-900/40 hover:bg-white/95"
                >
                  <PlayIcon className="h-4 w-4 text-indigo-600" />
                  Browse this week’s samples
                </a>
                <a
                  href="#pack"
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-3 text-sm font-semibold text-white ring-1 ring-white/20 hover:bg-white/15"
                >
                  <SparkleIcon className="h-4 w-4" />
                  Get Creator Pack — $69/mo
                </a>
              </div>

              <dl className="mt-10 grid max-w-xl grid-cols-3 gap-6">
                <div>
                  <dt className="av-mono text-[10px] uppercase tracking-[0.25em] text-white/55">
                    Samples ready
                  </dt>
                  <dd className="mt-1 text-3xl font-bold">12</dd>
                </div>
                <div>
                  <dt className="av-mono text-[10px] uppercase tracking-[0.25em] text-white/55">
                    Distribution
                  </dt>
                  <dd className="mt-1 text-3xl font-bold">
                    500+ <span className="text-base font-medium text-white/60">channels</span>
                  </dd>
                </div>
                <div>
                  <dt className="av-mono text-[10px] uppercase tracking-[0.25em] text-white/55">
                    Avg. completion
                  </dt>
                  <dd className="mt-1 text-3xl font-bold">73%</dd>
                </div>
              </dl>
            </div>

            <div className="relative lg:col-span-5">
              <div className="relative mx-auto w-[300px]">
                <div className="av-float-badge absolute -left-10 -top-4 z-20 flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-semibold text-slate-900 ring-1 ring-slate-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Made with Cricher AI
                </div>
                <div className="av-float-badge absolute -right-6 top-24 z-20 flex items-center gap-2 rounded-2xl bg-indigo-500 px-3 py-2 text-xs font-semibold text-white">
                  <SparkleIcon className="h-3.5 w-3.5" />
                  Hook score 9.1
                </div>

                <div className="rounded-[40px] bg-black/60 p-2 shadow-2xl ring-1 ring-white/10">
                  <div
                    className="av-reel pal-drama rounded-[32px]"
                    style={{ aspectRatio: "9 / 19" }}
                  >
                    <div className="av-mono absolute inset-x-0 top-0 flex items-center justify-between p-3 text-[10px] text-white/80">
                      <span>9:41</span>
                      <span className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
                        <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
                        <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
                      </span>
                    </div>
                    <div className="absolute inset-x-6 top-1/3 -translate-y-1/2 text-white/85">
                      <p className="av-mono text-[10px] uppercase tracking-[0.25em] text-white/60">
                        Vertical drama · 0:90
                      </p>
                      <p className="mt-2 text-[22px] font-bold leading-tight">
                        “She thought it was just a job interview…”
                      </p>
                    </div>
                    <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4">
                      <div className="flex h-8 items-end gap-1">
                        {[24, 16, 28, 20, 32, 12, 24].map((h, i) => (
                          <span
                            key={i}
                            className="av-bar w-1 rounded-sm bg-white/80"
                            style={{ height: h }}
                          />
                        ))}
                      </div>
                      <button
                        type="button"
                        className="flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-slate-900 shadow-lg"
                      >
                        <PlayIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="av-mono mt-5 flex items-center gap-3 text-[10px] uppercase tracking-[0.25em] text-white/60">
                  <span className="av-dotline flex-1" />
                  <span>previewing 1 / 12</span>
                  <span className="av-dotline flex-1" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SAMPLE SHOWCASE */}
      <section id="showcase" className="relative z-10 mx-auto -mt-12 max-w-[1200px] px-6 lg:px-10">
        <div className="av-card p-6 lg:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="av-mono text-[11px] uppercase tracking-[0.3em] text-indigo-600">
                This week’s drop · Nov 18
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900 lg:text-3xl">
                Sample reels, hand-picked for you
              </h2>
              <p className="mt-1.5 max-w-2xl text-sm text-slate-600">
                Each 90-second sample is a content opportunity. Bookmark the ones that fit your
                channel — buy the Creator Pack to remix any of them.
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5 text-xs font-semibold">
              <button type="button" className="rounded-full bg-slate-900 px-3 py-1.5 text-white">
                All <span className="ml-1 text-white/60">12</span>
              </button>
              {filterTabs.map(([label, count]) => (
                <button
                  key={label}
                  type="button"
                  className="rounded-full bg-white px-3 py-1.5 text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                >
                  {label} <span className="ml-1 text-slate-400">{count}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
            {samples.map((s, i) => {
              const badge = statusBadge[s.status];
              return (
                <article key={i} className="av-lift">
                  <div className={`av-reel ${s.palette} is-empty`}>
                    <div className="absolute inset-0 flex flex-col justify-between p-3">
                      <div className="flex items-center justify-between">
                        {s.isNew ? (
                          <span className="av-chip av-mono rounded-full bg-amber-400/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-950">
                            New
                          </span>
                        ) : (
                          <span className="av-chip av-mono rounded-full bg-black/40 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white">
                            0:90
                          </span>
                        )}
                        <button
                          type="button"
                          aria-label="Bookmark"
                          className={`av-chip grid h-7 w-7 place-items-center rounded-full ${
                            s.bookmarked ? "bg-white text-slate-900" : "bg-black/40 text-white"
                          }`}
                        >
                          <BookmarkIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="av-mono text-[10px] uppercase tracking-[0.2em] text-white/60">
                            {s.category}
                          </p>
                          <p className="mt-1 text-sm font-semibold leading-snug text-white">
                            {s.title}
                          </p>
                        </div>
                        <button
                          type="button"
                          aria-label="Play"
                          className="grid h-9 w-9 place-items-center rounded-full bg-white text-slate-900 shadow-md"
                        >
                          <PlayIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <ClockIcon className="h-3.5 w-3.5" />
                      <span>
                        {s.hook} · {s.completion}
                      </span>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 font-semibold ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
            <p className="text-xs text-slate-500">
              Showing 8 of 12 · <span className="av-mono">#AIGenerated</span> tag is auto-applied to
              all sample remixes.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-full px-4 py-2 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
              >
                View bookmarks (3)
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
              >
                Load all 12 <ArrowRightIcon className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto mt-16 max-w-[1200px] px-6 lg:px-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="av-mono text-[11px] uppercase tracking-[0.3em] text-indigo-600">
              From sample to paycheck
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900 lg:text-3xl">
              How the Creator Pack works
            </h2>
            <p className="mt-1.5 max-w-2xl text-sm text-slate-600">
              Sample is the hook. Pack is the toolkit. Distribution is the paycheck. You stay the
              director — AI handles the production grind.
            </p>
          </div>
          <a
            href="#"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Read full creator handbook <ArrowRightIcon className="h-3.5 w-3.5" />
          </a>
        </div>

        <div className="mt-7 grid gap-5 md:grid-cols-3">
          <div className="av-card relative overflow-hidden p-6">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-indigo-100/60" />
            <p className="av-mono text-[10px] uppercase tracking-[0.3em] text-indigo-600">
              Step 01
            </p>
            <h3 className="mt-2 text-lg font-bold text-slate-900">Browse 90-second samples</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Every Monday, 8 fresh AI-built reels land in your dashboard, sorted by category.
              Bookmark what fits your audience.
            </p>
            <div className="mt-5 flex items-center gap-2 text-xs">
              <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">
                Free
              </span>
              <span className="text-slate-500">No card needed to preview</span>
            </div>
          </div>

          <div className="av-card relative overflow-hidden p-6">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-fuchsia-100/60" />
            <p className="av-mono text-[10px] uppercase tracking-[0.3em] text-fuchsia-600">
              Step 02
            </p>
            <h3 className="mt-2 text-lg font-bold text-slate-900">Remix with your script</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Unlock the Creator Pack and use AI Director to swap in your own scenes, voice and
              pacing. The sample style stays — your story takes over.
            </p>
            <div className="mt-5 flex items-center gap-2 text-xs">
              <span className="rounded-full bg-fuchsia-50 px-2 py-0.5 font-semibold text-fuchsia-700 ring-1 ring-fuchsia-200">
                $69 / mo
              </span>
              <span className="text-slate-500">First month -10% on this platform</span>
            </div>
          </div>

          <div className="av-card relative overflow-hidden p-6">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-emerald-100/60" />
            <p className="av-mono text-[10px] uppercase tracking-[0.3em] text-emerald-600">
              Step 03
            </p>
            <h3 className="mt-2 text-lg font-bold text-slate-900">Publish &amp; earn everywhere</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              One click to TikTok, Reels and Shorts. Opt into the 500-channel distribution network
              and FAST TV — keep 60–70% of distribution revenue.
            </p>
            <div className="mt-5 flex items-center gap-2 text-xs">
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700 ring-1 ring-emerald-200">
                You keep 100%
              </span>
              <span className="text-slate-500">of your own channel earnings</span>
            </div>
          </div>
        </div>
      </section>

      {/* DISTRIBUTION MARQUEE */}
      <section className="mt-16">
        <div className="mx-auto max-w-[1200px] px-6 lg:px-10">
          <p className="av-mono text-center text-[11px] uppercase tracking-[0.3em] text-slate-500">
            Your remix can syndicate to
          </p>
        </div>
        <div className="av-marquee mt-4 overflow-hidden">
          <div className="av-marquee-track flex gap-12 whitespace-nowrap text-sm font-semibold text-slate-400">
            {[...distributionChannels, ...distributionChannels].map((c, i) => (
              <span key={i} className="flex items-center gap-12">
                <span className="px-4">{c}</span>
                <span>·</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CREATOR PACK PRICING */}
      <section id="pack" className="mx-auto mt-16 max-w-[1200px] px-6 lg:px-10">
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="av-mono text-[11px] uppercase tracking-[0.3em] text-indigo-600">
              Creator Pack
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900 lg:text-3xl">
              Pick the plan that matches your output.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              You keep full copyright. Cricher AI only holds a revocable distribution license.
              Cancel anytime.
            </p>
            <div className="mt-5 flex flex-col gap-2 text-xs text-slate-600">
              <p className="flex items-center gap-2">
                <CheckIcon className="h-3.5 w-3.5 text-emerald-600" /> Watermark optional ·
                disclosure auto-handled
              </p>
              <p className="flex items-center gap-2">
                <CheckIcon className="h-3.5 w-3.5 text-emerald-600" /> FTC #AIGenerated tag
                auto-applied
              </p>
              <p className="flex items-center gap-2">
                <CheckIcon className="h-3.5 w-3.5 text-emerald-600" /> Brand-safety review on every
                deliverable
              </p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:col-span-8">
            <div className="av-card flex flex-col p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-slate-900">Starter</p>
                <span className="av-mono text-[10px] uppercase tracking-[0.25em] text-slate-400">
                  Solo Creator
                </span>
              </div>
              <p className="mt-3">
                <span className="text-4xl font-extrabold tracking-tight">$69</span>
                <span className="text-slate-500">/mo</span>
              </p>
              <p className="mt-1 text-xs text-slate-500">First month $62.10 with platform code</p>
              <ul className="mt-5 space-y-2 text-sm text-slate-700">
                {starterFeatures.map((f) => (
                  <li key={f} className="flex gap-2">
                    <CheckIcon className="mt-0.5 h-4 w-4 text-emerald-600" /> {f}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="mt-6 rounded-full bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Start Starter
              </button>
            </div>

            <div
              className="relative flex flex-col overflow-hidden rounded-[20px] p-6 text-white"
              style={{
                background: "linear-gradient(160deg,#4f46e5 0%, #6d63ff 50%, #8b5cf6 100%)",
              }}
            >
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
              <div className="relative flex items-center justify-between">
                <p className="text-sm font-bold">Pro</p>
                <span className="av-mono rounded-full bg-white/20 px-2 py-0.5 text-[10px] uppercase tracking-[0.25em] ring-1 ring-white/30">
                  Most picked
                </span>
              </div>
              <p className="relative mt-3">
                <span className="text-4xl font-extrabold tracking-tight">$199</span>
                <span className="text-white/70">/mo</span>
              </p>
              <p className="relative mt-1 text-xs text-white/70">
                Includes 500-channel distribution opt-in
              </p>
              <ul className="relative mt-5 space-y-2 text-sm">
                {proFeatures.map((f) => (
                  <li key={f} className="flex gap-2">
                    <CheckIcon className="mt-0.5 h-4 w-4 text-white" /> {f}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="relative mt-6 rounded-full bg-white py-2.5 text-sm font-bold text-indigo-700 hover:bg-white/95"
              >
                Upgrade to Pro
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA STRIP */}
      <section className="mx-auto mb-12 mt-16 max-w-[1200px] px-6 lg:px-10">
        <div
          className="relative overflow-hidden rounded-3xl p-8 text-white lg:p-10"
          style={{ background: "linear-gradient(135deg,#0c1142 0%, #2a2497 50%, #6d63ff 100%)" }}
        >
          <div className="av-grain absolute inset-0" />
          <div className="relative grid items-center gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <p className="av-mono text-[11px] uppercase tracking-[0.3em] text-white/70">
                Need something custom?
              </p>
              <h3 className="mt-2 text-2xl font-bold lg:text-3xl">
                Spin up the next AI edit in under a minute.
              </h3>
              <p className="mt-2 max-w-xl text-sm text-white/80">
                Drop in a voice, upload a reference image, and the creator workstation will mint a
                ready-to-preview TikTok asset.
              </p>
            </div>
            <div className="flex lg:justify-end">
              <Link
                href="/creatorportal/ai-video/generate"
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-indigo-700 shadow-xl hover:bg-white/95"
              >
                <SparkleIcon className="h-4 w-4" />
                Generate a video
              </Link>
            </div>
          </div>
        </div>

        <p className="av-mono mt-6 text-center text-[11px] uppercase tracking-[0.3em] text-slate-400">
          © Cricher AI · Confidential preview · #AIGenerated · #ad disclosure standard
        </p>
      </section>
    </div>
  );
}
