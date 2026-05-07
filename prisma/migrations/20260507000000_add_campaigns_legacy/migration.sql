-- CreateTable: legacy campaigns (lowercase) — separate from "Campaign" (PascalCase NextAuth model)
-- Also adds creator_handle_name to User if not already present, and creates campaignclaims.
-- This migration exists because these tables were originally created outside of Prisma
-- migrations (direct Supabase SQL) and need to be created fresh in the e2e environment.

-- Add creator_handle_name to User if missing
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "creator_handle_name" TEXT NOT NULL DEFAULT '';

-- Create campaigns table (legacy lowercase model)
CREATE TABLE IF NOT EXISTS "campaigns" (
    "id"                                         UUID NOT NULL DEFAULT gen_random_uuid(),
    "brand_id"                                   TEXT,
    "title"                                      TEXT NOT NULL,
    "brief"                                      TEXT,
    "requirements"                               TEXT,
    "budget_range"                               TEXT,
    "commission"                                 TEXT,
    "platform"                                   TEXT,
    "deadline"                                   DATE,
    "max_creators"                               INTEGER DEFAULT 10,
    "is_open"                                    BOOLEAN DEFAULT true,
    "created_at"                                 TIMESTAMPTZ DEFAULT now(),
    "budget_unit"                                TEXT,
    "sample_video_url"                           TEXT,
    "industry_category"                          TEXT,
    "primary_promotion_objectives"               TEXT,
    "ad_placement"                               TEXT,
    "campaign_execution_mode"                    TEXT,
    "creator_profile_preferences_gender"         TEXT,
    "creator_profile_preference_ethnicity"       TEXT,
    "creator_profile_preference_content_niche"   TEXT,
    "preferred_creator_location"                 TEXT,
    "language_requirement_for_creators"          TEXT,
    "creator_tier_requirement"                   TEXT,
    "send_to_creator"                            TEXT,
    "approved_by_brand"                          TEXT,
    "kpi_reference_target"                       TEXT,
    "prohibited_content_warnings"                TEXT,
    "product_photo"                              TEXT,
    "posting_requirements"                       TEXT,
    "script_required"                            TEXT,
    "product_highlight"                          TEXT,
    "product_price"                              TEXT,
    "product_sold_number"                        TEXT,
    "paid_promotion_type"                        TEXT,
    "video_buyout_budget_range"                  TEXT,
    "base_fee_budget_range"                      TEXT,
    "follower_requirement"                       TEXT,
    "order_requirement"                          TEXT,
    "product_name"                               TEXT,
    "updated_at"                                 TIMESTAMPTZ,
    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- FK from campaigns to BrandProfile
ALTER TABLE "campaigns"
    ADD CONSTRAINT "campaigns_brand_id_fkey"
    FOREIGN KEY ("brand_id") REFERENCES "BrandProfile"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Create campaignclaims table
CREATE TABLE IF NOT EXISTS "campaignclaims" (
    "id"               UUID NOT NULL DEFAULT gen_random_uuid(),
    "campaign_id"      UUID,
    "creator_id"       TEXT,
    "status"           TEXT NOT NULL DEFAULT 'pending',
    "sample_text"      TEXT,
    "sample_video_url" TEXT,
    "created_at"       TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "campaignclaims_pkey" PRIMARY KEY ("id")
);

-- FK from campaignclaims to campaigns
ALTER TABLE "campaignclaims"
    ADD CONSTRAINT "campaignclaims_campaign_id_fkey"
    FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- FK from campaignclaims to CreatorProfile
ALTER TABLE "campaignclaims"
    ADD CONSTRAINT "campaignclaims_creator_id_fkey"
    FOREIGN KEY ("creator_id") REFERENCES "CreatorProfile"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
