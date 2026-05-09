#!/usr/bin/env tsx
import { execSync } from "node:child_process";
import { waitForHttp } from "./lib/wait";

const COMPOSE = "docker compose -p brand-creator-e2e -f docker/compose.e2e.yml";

export function assertTestDatabaseUrl(url: string | undefined): void {
  if (!url) throw new Error("DATABASE_URL must be set");
  if (!url.includes(":54329/")) {
    throw new Error(
      `refusing to operate against non-test DATABASE_URL: ${url}. Expected port :54329`
    );
  }
}

async function main() {
  const dbUrl = "postgres://e2e:e2e@localhost:54329/brand_creator_e2e";
  process.env.DATABASE_URL = dbUrl;
  assertTestDatabaseUrl(dbUrl);

  console.log("[e2e:up] starting compose stack…");
  execSync(`${COMPOSE} up -d --wait`, { stdio: "inherit" });

  console.log("[e2e:up] waiting on http endpoints…");
  await waitForHttp("http://localhost:8001/health", {
    timeoutMs: 60_000,
    intervalMs: 1000,
  });
  await waitForHttp("http://localhost:12001/", {
    timeoutMs: 60_000,
    intervalMs: 1000,
  });

  // Run migrate + seed inside the web container so the repo-root .env cannot
  // override DATABASE_URL with the production Supabase URL.
  const pgInternal = "postgres://e2e:e2e@pg:5432/brand_creator_e2e";
  const dbEnv = `DATABASE_URL=${pgInternal} DIRECT_URL=${pgInternal}`;

  console.log("[e2e:up] running prisma migrate deploy…");
  execSync(`${COMPOSE} exec -T web sh -c "${dbEnv} npx prisma migrate deploy"`, {
    stdio: "inherit",
  });

  // Apply schema drift fixes that exist in the repo migration but were baked
  // into the container image before the migration was added. Running idempotent
  // SQL directly on the pg container covers the gap without a full rebuild.
  console.log("[e2e:up] applying schema drift patches…");
  const patches = [
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "creator_handle_name" TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE "AiVideoTask" ADD COLUMN IF NOT EXISTS "outputPath" TEXT`,
    `CREATE TABLE IF NOT EXISTS "campaigns" (
       "id" UUID NOT NULL DEFAULT gen_random_uuid(),
       "brand_id" TEXT,
       "title" TEXT NOT NULL,
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
    `DO $$
     BEGIN
       IF NOT EXISTS (
         SELECT 1 FROM pg_constraint WHERE conname = 'campaigns_brand_id_fkey'
       ) THEN
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

  // Storage-api uses unqualified table names ("buckets", "objects") and the
  // knex `searchPath` option doesn't take effect against this image, so create
  // public-schema views over the storage tables and grant access to the supabase
  // roles. Then disable RLS (e2e-only) so service_role inserts succeed.
  // Finally upsert the ai-video-tasks bucket row at 200 MB (matches OUTPUT_MAX_BYTES).
  console.log("[e2e:up] configuring storage schema bridge…");
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

  console.log("[e2e:up] seeding…");
  execSync(`${COMPOSE} exec -T web sh -c "${dbEnv} npx tsx prisma/seed.e2e.ts"`, {
    stdio: "inherit",
  });

  console.log("[e2e:up] ready.");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
