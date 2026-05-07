import { describe, it, expect } from "vitest";
import { listTruncatableTables } from "../../e2e/_helpers/resetDb";

describe("listTruncatableTables", () => {
  it("excludes _prisma_migrations", () => {
    const tables = listTruncatableTables(["_prisma_migrations", "User", "Campaign"]);
    expect(tables).toEqual(["User", "Campaign"]);
  });
});
