#!/usr/bin/env node
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("[studio-buckets] SUPABASE_URL and SUPABASE_SERVICE_KEY required");
  process.exit(1);
}

const client = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

const BUCKETS = [
  { id: "studio-samples", public: true, fileSizeLimit: 30 * 1024 * 1024 },
  { id: "studio-outputs", public: false, fileSizeLimit: 200 * 1024 * 1024 },
];

(async () => {
  for (const b of BUCKETS) {
    const { error } = await client.storage.createBucket(b.id, {
      public: b.public,
      fileSizeLimit: b.fileSizeLimit,
    });
    if (error && !error.message.includes("already exists")) {
      console.error(`[studio-buckets] failed to create ${b.id}: ${error.message}`);
      process.exit(1);
    }
    console.log(`[studio-buckets] ${b.id}: ${error ? "exists" : "created"}`);
  }
  console.log("[studio-buckets] done");
})();
