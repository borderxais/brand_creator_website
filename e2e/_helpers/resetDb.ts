import { PrismaClient } from "@prisma/client";
import { execSync } from "node:child_process";

export function listTruncatableTables(all: string[]): string[] {
  return all.filter((t) => t !== "_prisma_migrations");
}

export async function resetDb(prisma: PrismaClient): Promise<void> {
  const rows = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  `;
  const tables = listTruncatableTables(rows.map((r) => r.tablename));
  if (tables.length === 0) return;
  const list = tables.map((t) => `"${t}"`).join(", ");
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`);
  execSync("npx tsx prisma/seed.e2e.ts", { stdio: "inherit", env: process.env });
}
