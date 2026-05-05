# Platform Purpose

## What this platform is

A creator-first collaboration platform where independent creators request, receive, publish, and monetize AI-generated short-form video. The platform connects three sides:

- **Creators** — mid-tier influencers (10K – 5M followers) on TikTok, Instagram Reels, and YouTube Shorts who need higher content velocity than they can produce solo.
- **AI generation vendors** — upstream providers such as **StoryClaw** (Seedance 2 engine) that produce 90-second vertical AI videos on demand.
- **Brands** (existing side of the platform) — buyers of creator services through campaigns and collaborations already supported in this repo.

Creators come to the platform to:

1. **Browse** curated 90-second AI video samples to find a style they want.
2. **Request** their own version with their own script, characters, and tone.
3. **Subscribe** to a tier (Free trial → Starter → Pro) that grants monthly request quota.
4. **Receive** the generated output and use it on their own channels.
5. **Publish** (P2+) to multiple platforms in one click and tap into the platform's distribution network.

## Why it exists

Mid-tier creators are bottlenecked by production capacity. Hand-shooting and editing vertical short-form video is the limiting factor on follower growth and revenue. AI video generation removes that bottleneck — but raw AI tools are intimidating, the quality varies, and creators don't want to be reduced to "the person who pressed Generate." The platform exists to give creators:

- **Low-friction onboarding** via real 90-second samples that prove the quality before they pay.
- **Creative ownership** — creators write the story, AI executes; creators retain 100% rights to their final videos.
- **A single subscription** that rolls up tooling, generation quota, and (in later phases) distribution and monetization, instead of cobbling together five SaaS bills.
- **Compliance handled by the platform** — FTC AI-disclosure tagging, watermarking, and platform-policy alignment baked in.

The thesis from the partnership plan: *the 90-second sample is the nail; the Creator Pack subscription is the hammer; the distribution network is the retention loop.*

## Who it's for

| Audience | Core need | What we provide |
|---|---|---|
| Mid-tier creators (entertainment / lifestyle / drama / emotion verticals) | More content per week without losing creative voice | Sample-driven AI video requests, monthly quota, creative control |
| StoryClaw (and future AI gen vendors) | A demand-side surface that aggregates creator orders | A managed creator pipeline, sample placement, payment routing |
| Brands (existing) | Faster turnaround on sponsored creative | (P2+) AI-assisted creator briefs, faster deliverables |
| Creator Platform partners (P2+) | A revenue-share opportunity to push to their creator base | Affiliate commissions on Creator Pack subscriptions |

## Phase 1 promise

> *"You bring the story. We bring the production team. The output is yours."*

Phase 1 keeps the loop deliberately small: a creator can sign up, browse samples, subscribe, request a video, and receive a finished AI-generated clip in their inbox within one billing cycle. Everything else — multi-platform publish, distribution network revenue, partner integrations, FAST TV, real-time API ingestion — comes after that loop has proven the unit economics.

See [`docs/superpowers/specs/2026-05-05-ai-video-studio-design.md`](superpowers/specs/2026-05-05-ai-video-studio-design.md) for the P1 design and [`TODO.md`](../TODO.md) (root of repo) for the active task list.

## North-star principles

1. **Creators retain ownership.** No sneaky rights claims; samples are inspiration, not contracts.
2. **AI is the executor, not the author.** Every UI surface frames the creator as director.
3. **Quota is the gate, quality is the moat.** We'd rather under-promise volume and over-deliver craft.
4. **Compliance is a platform feature, not a creator burden.** FTC AI-disclosure tags, watermarks, and platform-policy alignment ship as defaults.
5. **One subscription, expanding value.** Each phase adds value to the same Creator Pack instead of fragmenting into add-ons.

## Non-goals

- We are not a stock-video library.
- We are not a creator-discovery marketplace for brands. (Brand-creator collaboration is the *existing* product surface; AI Video Studio sits next to it.)
- We are not building our own foundation model. AI generation is vendored.
- We are not a long-form video platform. Vertical 90-second short-form only in P1.
