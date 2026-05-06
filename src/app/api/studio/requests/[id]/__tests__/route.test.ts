import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: { videoRequest: { findUnique: vi.fn() } },
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GET } from "@/app/api/studio/requests/[id]/route";

beforeEach(() => vi.clearAllMocks());

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

describe("GET /api/studio/requests/[id]", () => {
  it("returns request when creator owns it", async () => {
    (auth as any).mockResolvedValue({ user: { id: "u1", role: "CREATOR" } });
    (prisma.videoRequest.findUnique as any).mockResolvedValue({ id: "r1", creatorId: "u1" });
    const res = await GET(new Request("http://localhost/x"), ctx("r1"));
    expect(res.status).toBe(200);
  });

  it("returns 403 when creator does not own it", async () => {
    (auth as any).mockResolvedValue({ user: { id: "u1", role: "CREATOR" } });
    (prisma.videoRequest.findUnique as any).mockResolvedValue({ id: "r1", creatorId: "other" });
    const res = await GET(new Request("http://localhost/x"), ctx("r1"));
    expect(res.status).toBe(403);
  });

  it("allows STUDIO_ADMIN regardless of ownership", async () => {
    (auth as any).mockResolvedValue({ user: { id: "a1", role: "STUDIO_ADMIN" } });
    (prisma.videoRequest.findUnique as any).mockResolvedValue({ id: "r1", creatorId: "other" });
    const res = await GET(new Request("http://localhost/x"), ctx("r1"));
    expect(res.status).toBe(200);
  });

  it("returns 404 when not found", async () => {
    (auth as any).mockResolvedValue({ user: { id: "u1", role: "CREATOR" } });
    (prisma.videoRequest.findUnique as any).mockResolvedValue(null);
    const res = await GET(new Request("http://localhost/x"), ctx("missing"));
    expect(res.status).toBe(404);
  });
});
