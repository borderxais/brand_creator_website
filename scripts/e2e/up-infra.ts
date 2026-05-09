#!/usr/bin/env tsx
/**
 * Bring up only the infra services (pg, supabase storage, api, proxy) — NOT
 * the web container. Use this when you want to run `npm run dev` against the
 * docker backend. Migrate + seed run from the host with DATABASE_URL pointed at
 * the host-exposed Postgres port.
 */
import { execSync } from "node:child_process";
import { waitForHttp } from "./lib/wait";
import { assertTestDatabaseUrl } from "./up";

const COMPOSE = "docker compose -p brand-creator-e2e -f docker/compose.e2e.yml";
const HOST_DB_URL = "postgres://e2e:e2e@localhost:54329/brand_creator_e2e";

async function main() {
  process.env.DATABASE_URL = HOST_DB_URL;
  process.env.DIRECT_URL = HOST_DB_URL;
  assertTestDatabaseUrl(HOST_DB_URL);

  console.log("[e2e:up:infra] starting compose stack (pg, supabase, api, proxy)…");
  execSync(`${COMPOSE} up -d --wait pg supabase api proxy`, { stdio: "inherit" });

  console.log("[e2e:up:infra] waiting on http endpoints…");
  await waitForHttp("http://localhost:8001/health", { timeoutMs: 60_000, intervalMs: 1000 });
  await waitForHttp("http://localhost:54331/", { timeoutMs: 60_000, intervalMs: 1000 });

  console.log("[e2e:up:infra] running prisma migrate deploy…");
  execSync(`npx prisma migrate deploy`, { stdio: "inherit", env: process.env });

  console.log("[e2e:up:infra] applying schema drift patches…");
  const patches = [
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "creator_handle_name" TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE "AiVideoTask" ADD COLUMN IF NOT EXISTS "outputPath" TEXT`,
    `CREATE TABLE IF NOT EXISTS "campaigns" (
       "id" UUID NOT NULL DEFAULT gen_random_uuid(),
       "brand_id" TEXT, "title" TEXT NOT NULL,
       "brief" TEXT, "requirements" TEXT, "budget_range" TEXT, "commission" TEXT,
       "platform" TEXT, "deadline" DATE, "max_creators" INTEGER DEFAULT 10,
       "is_open" BOOLEAN DEFAULT true, "created_at" TIMESTAMPTZ DEFAULT now(),
       "budget_unit" TEXT, "sample_video_url" TEXT, "industry_category" TEXT,
       "primary_promotion_objectives" TEXT, "ad_placement" TEXT,
       "campaign_execution_mode" TEXT, "creator_profile_preferences_gender" TEXT,
       "creator_profile_preference_ethnicity" TEXT,
       "creator_profile_preference_content_niche" TEXT,
       "preferred_creator_location" TEXT, "language_requirement_for_creators" TEXT,
       "creator_tier_requirement" TEXT, "send_to_creator" TEXT,
       "approved_by_brand" TEXT, "kpi_reference_target" TEXT,
       "prohibited_content_warnings" TEXT, "product_photo" TEXT,
       "posting_requirements" TEXT, "script_required" TEXT,
       "product_highlight" TEXT, "product_price" TEXT, "product_sold_number" TEXT,
       "paid_promotion_type" TEXT, "video_buyout_budget_range" TEXT,
       "base_fee_budget_range" TEXT, "follower_requirement" TEXT,
       "order_requirement" TEXT, "product_name" TEXT, "updated_at" TIMESTAMPTZ,
       CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
     )`,
    `DO $$ BEGIN
       IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='campaigns_brand_id_fkey') THEN
         ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_brand_id_fkey"
           FOREIGN KEY ("brand_id") REFERENCES "BrandProfile"("id") ON DELETE CASCADE;
       END IF;
     END $$`,
    `CREATE TABLE IF NOT EXISTS "campaignclaims" (
       "id" UUID NOT NULL DEFAULT gen_random_uuid(),
       "campaign_id" UUID, "creator_id" TEXT,
       "status" TEXT NOT NULL DEFAULT 'pending',
       "sample_text" TEXT, "sample_video_url" TEXT,
       "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
       CONSTRAINT "campaignclaims_pkey" PRIMARY KEY ("id")
     )`,
  ];
  for (const sql of patches) {
    execSync(`${COMPOSE} exec -T pg psql -U e2e -d brand_creator_e2e -v ON_ERROR_STOP=1`, {
      stdio: ["pipe", "inherit", "inherit"],
      input: sql + ";\n",
    });
  }

  console.log("[e2e:up:infra] configuring storage schema bridge…");
  execSync(`${COMPOSE} exec -T pg psql -U e2e -d brand_creator_e2e -v ON_ERROR_STOP=1`, {
    stdio: ["pipe", "inherit", "inherit"],
    input: `
      CREATE OR REPLACE VIEW public.buckets AS SELECT * FROM storage.buckets;
      CREATE OR REPLACE VIEW public.objects AS SELECT * FROM storage.objects;
      CREATE OR REPLACE VIEW public.s3_multipart_uploads AS SELECT * FROM storage.s3_multipart_uploads;
      CREATE OR REPLACE VIEW public.s3_multipart_uploads_parts AS SELECT * FROM storage.s3_multipart_uploads_parts;
      ALTER TABLE storage.buckets DISABLE ROW LEVEL SECURITY;
      ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
      ALTER TABLE storage.s3_multipart_uploads DISABLE ROW LEVEL SECURITY;
      ALTER TABLE storage.s3_multipart_uploads_parts DISABLE ROW LEVEL SECURITY;
      GRANT USAGE ON SCHEMA storage, public TO service_role, authenticated, anon;
      GRANT ALL ON public.buckets, public.objects, public.s3_multipart_uploads, public.s3_multipart_uploads_parts TO service_role, authenticated, anon;
      GRANT ALL ON ALL TABLES IN SCHEMA storage TO service_role;
      INSERT INTO storage.buckets (id, name, public, file_size_limit)
      VALUES ('ai-video-tasks', 'ai-video-tasks', false, 209715200)
      ON CONFLICT (id) DO UPDATE SET file_size_limit = EXCLUDED.file_size_limit;
    `,
  });

  console.log("[e2e:up:infra] seeding…");
  execSync(`npx tsx prisma/seed.e2e.ts`, { stdio: "inherit", env: process.env });

  console.log("[e2e:up:infra] ready.");
  console.log("");
  console.log("Next:");
  console.log("  npx dotenv -e .env.e2e-dev -o -- npm run dev");
  console.log("  open http://localhost:12000");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
