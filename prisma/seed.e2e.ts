/**
 * prisma/seed.e2e.ts — Deterministic E2E test fixtures
 *
 * Stable ID contracts:
 *   Users:    e2e-user-brand, e2e-user-creator, e2e-user-admin
 *   Campaign: 00000000-0000-0000-0000-e2e000000001  (alias "e2e-campaign-1")
 *   Sample:   e2e-sample-1
 *
 * Schema notes (verified against prisma/schema.prisma):
 *   - User.creatorHandleName  required non-null String (mapped to creator_handle_name)
 *   - User.role               String default "CREATOR"; admin role = "STUDIO_ADMIN"
 *   - campaigns               lowercase-plural model; id is @db.Uuid → stable ID must be UUID-format
 *   - campaigns.brand_id      FK to BrandProfile.id (not User.id) — BrandProfile created first
 *   - Sample.category         required SampleCategory enum
 *   - Sample.previewUrl       required String (schema has no `url` field)
 *   - Sample.uploadedById     FK to User.id
 *
 * DO NOT run with NODE_ENV=production or against the live DB.
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Low cost factor — test-only, speed matters more than security here.
const PW = bcrypt.hashSync("e2e-password", 4);

// campaigns.id is @db.Uuid; must be valid UUID format.
const CAMPAIGN_UUID = "00000000-0000-0000-0000-e2e000000001";

async function main() {
  // ── Users ────────────────────────────────────────────────────────────────

  const brandUser = await prisma.user.upsert({
    where: { id: "e2e-user-brand" },
    update: {
      email: "brand@e2e.test",
      name: "E2E Brand",
      role: "BRAND",
      emailVerified: new Date("2024-01-01T00:00:00.000Z"),
    },
    create: {
      id: "e2e-user-brand",
      email: "brand@e2e.test",
      name: "E2E Brand",
      password: PW,
      role: "BRAND",
      creatorHandleName: "e2e-brand",
      emailVerified: new Date("2024-01-01T00:00:00.000Z"),
    },
  });

  await prisma.user.upsert({
    where: { id: "e2e-user-creator" },
    update: {
      email: "creator@e2e.test",
      name: "E2E Creator",
      role: "CREATOR",
      emailVerified: new Date("2024-01-01T00:00:00.000Z"),
    },
    create: {
      id: "e2e-user-creator",
      email: "creator@e2e.test",
      name: "E2E Creator",
      password: PW,
      role: "CREATOR",
      creatorHandleName: "e2e-creator",
      emailVerified: new Date("2024-01-01T00:00:00.000Z"),
    },
  });

  await prisma.user.upsert({
    where: { id: "e2e-user-admin" },
    update: {
      email: "admin@e2e.test",
      name: "E2E Admin",
      role: "STUDIO_ADMIN",
      emailVerified: new Date("2024-01-01T00:00:00.000Z"),
    },
    create: {
      id: "e2e-user-admin",
      email: "admin@e2e.test",
      name: "E2E Admin",
      password: PW,
      role: "STUDIO_ADMIN",
      creatorHandleName: "e2e-admin",
      emailVerified: new Date("2024-01-01T00:00:00.000Z"),
    },
  });

  // ── BrandProfile (required FK for campaigns.brand_id) ────────────────────
  const brandProfile = await prisma.brandProfile.upsert({
    where: { userId: brandUser.id },
    update: {},
    create: {
      id: "e2e-brand-profile-1",
      userId: brandUser.id,
      companyName: "E2E Test Brand Co",
      industry: "Technology",
    },
  });

  // ── Campaign ─────────────────────────────────────────────────────────────
  // campaigns.id is @db.Uuid; stable UUID used as the "e2e-campaign-1" contract.
  await prisma.campaigns.upsert({
    where: { id: CAMPAIGN_UUID },
    update: {
      title: "E2E Campaign 1",
      brand_id: brandProfile.id,
    },
    create: {
      id: CAMPAIGN_UUID,
      title: "E2E Campaign 1",
      brand_id: brandProfile.id,
    },
  });

  // ── Sample ───────────────────────────────────────────────────────────────
  // uploadedById → e2e-user-admin (STUDIO_ADMIN manages samples per app domain)
  await prisma.sample.upsert({
    where: { id: "e2e-sample-1" },
    update: {
      title: "E2E Sample 1",
      previewUrl: "https://e2e.test/samples/e2e-sample-1.mp4",
      category: "OTHER",
    },
    create: {
      id: "e2e-sample-1",
      title: "E2E Sample 1",
      category: "OTHER",
      previewUrl: "https://e2e.test/samples/e2e-sample-1.mp4",
      uploadedById: "e2e-user-admin",
    },
  });

  console.log("E2E seed complete");
  console.log("  Users:    e2e-user-brand | e2e-user-creator | e2e-user-admin");
  console.log(`  Campaign: ${CAMPAIGN_UUID}  (alias e2e-campaign-1)`);
  console.log("  Sample:   e2e-sample-1");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
