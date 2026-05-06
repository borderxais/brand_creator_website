const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const DEV_PASSWORD = "dev-password-only-not-prod";
const FAR_FUTURE = new Date("2125-01-01T00:00:00.000Z");
const ONE_MONTH_FROM_NOW = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

const FIXTURES = [
  {
    email: "creator-free@test.local",
    name: "Free Creator",
    handle: "free-creator",
    role: "CREATOR",
    subscription: { tier: "FREE", quotaLimit: 1, quotaUsed: 0, periodEnd: FAR_FUTURE },
  },
  {
    email: "creator-starter@test.local",
    name: "Starter Creator",
    handle: "starter-creator",
    role: "CREATOR",
    subscription: { tier: "STARTER", quotaLimit: 5, quotaUsed: 0, periodEnd: ONE_MONTH_FROM_NOW },
  },
  {
    email: "creator-pro@test.local",
    name: "Pro Creator",
    handle: "pro-creator",
    role: "CREATOR",
    subscription: { tier: "PRO", quotaLimit: 20, quotaUsed: 0, periodEnd: ONE_MONTH_FROM_NOW },
  },
  {
    email: "admin@test.local",
    name: "Studio Admin",
    handle: "studio-admin",
    role: "STUDIO_ADMIN",
    subscription: null,
  },
];

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("seed.dev.js refuses to run when NODE_ENV=production");
  }
  const password = await bcrypt.hash(DEV_PASSWORD, 10);

  for (const fixture of FIXTURES) {
    const user = await prisma.user.upsert({
      where: { email: fixture.email },
      update: { name: fixture.name, role: fixture.role, emailVerified: new Date() },
      create: {
        email: fixture.email,
        name: fixture.name,
        password,
        role: fixture.role,
        creatorHandleName: fixture.handle,
        emailVerified: new Date(),
      },
    });

    if (fixture.subscription) {
      await prisma.subscription.upsert({
        where: { userId: user.id },
        update: {
          tier: fixture.subscription.tier,
          quotaLimit: fixture.subscription.quotaLimit,
          quotaUsed: fixture.subscription.quotaUsed,
          periodEnd: fixture.subscription.periodEnd,
        },
        create: {
          userId: user.id,
          tier: fixture.subscription.tier,
          quotaLimit: fixture.subscription.quotaLimit,
          quotaUsed: fixture.subscription.quotaUsed,
          periodStart: new Date(),
          periodEnd: fixture.subscription.periodEnd,
        },
      });
    }
  }

  console.log(`[seed.dev] upserted ${FIXTURES.length} dev users`);
}

main()
  .catch((e) => {
    console.error("[seed.dev] failed", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
