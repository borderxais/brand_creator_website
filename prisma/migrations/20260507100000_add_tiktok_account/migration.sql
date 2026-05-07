-- Idempotent CREATE for TikTokAccount. Schema (prisma/schema.prisma:182) defines
-- the model but no prior migration creates the table — original schema seeded via
-- direct SQL in dev. e2e env needs the table for /creatorportal/ai-video to render.

CREATE TABLE IF NOT EXISTS "TikTokAccount" (
    "id"                 UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id"            TEXT NOT NULL,
    "tiktok_open_id"     TEXT NOT NULL,
    "access_token"       TEXT NOT NULL,
    "refresh_token"      TEXT NOT NULL,
    "scope"              TEXT NOT NULL,
    "expires_at"         TIMESTAMPTZ(6) NOT NULL,
    "refresh_expires_at" TIMESTAMPTZ(6) NOT NULL,
    "handle"             TEXT,
    "display_name"       TEXT,
    "avatar_url"         TEXT,
    "follower_count"     INTEGER,
    "engagement_rate"    DOUBLE PRECISION,
    "last_synced_at"     TIMESTAMPTZ(6) DEFAULT now(),
    "created_at"         TIMESTAMPTZ(6) DEFAULT now(),
    "updated_at"         TIMESTAMPTZ(6) DEFAULT now(),
    CONSTRAINT "TikTokAccount_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "TikTokAccount_user_id_key" ON "TikTokAccount" ("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "TikTokAccount_tiktok_open_id_key" ON "TikTokAccount" ("tiktok_open_id");

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TikTokAccount_user_id_fkey') THEN
        ALTER TABLE "TikTokAccount"
            ADD CONSTRAINT "TikTokAccount_user_id_fkey"
            FOREIGN KEY ("user_id") REFERENCES "User"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION;
    END IF;
END $$;
