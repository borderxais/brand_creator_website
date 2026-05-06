import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/features/ai-studio/lib/samples", () => ({
  getSample: vi.fn(),
  updateSample: vi.fn(),
}));

import { auth } from "@/lib/auth";
import { getSample, updateSample } from "@/features/ai-studio/lib/samples";
import { GET, PATCH } from "@/app/api/studio/samples/[id]/route";

beforeEach(() => vi.clearAllMocks());

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

describe("GET /api/studio/samples/[id]", () => {
  it("returns sample by id", async () => {
    (auth as any).mockResolvedValue({ user: { id: "u1", role: "CREATOR" } });
    (getSample as any).mockResolvedValue({ id: "s1", title: "Demo" });
    const res = await GET(new Request("http://localhost/api/studio/samples/s1"), ctx("s1"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.sample.id).toBe("s1");
  });

  it("returns 404 when not found", async () => {
    (auth as any).mockResolvedValue({ user: { id: "u1", role: "CREATOR" } });
    (getSample as any).mockResolvedValue(null);
    const res = await GET(
      new Request("http://localhost/api/studio/samples/missing"),
      ctx("missing")
    );
    expect(res.status).toBe(404);
  });

  it("returns 401 when not authenticated", async () => {
    (auth as any).mockResolvedValue(null);
    const res = await GET(new Request("http://localhost/api/studio/samples/s1"), ctx("s1"));
    expect(res.status).toBe(401);
  });
});

describe("PATCH /api/studio/samples/[id]", () => {
  it("requires studio admin (403 for creator)", async () => {
    (auth as any).mockResolvedValue({ user: { id: "u1", role: "CREATOR" } });
    const res = await PATCH(
      new Request("http://localhost/api/studio/samples/s1", {
        method: "PATCH",
        body: JSON.stringify({ title: "New" }),
      }),
      ctx("s1")
    );
    expect(res.status).toBe(403);
  });

  it("updates sample as admin", async () => {
    (auth as any).mockResolvedValue({ user: { id: "admin1", role: "STUDIO_ADMIN" } });
    (updateSample as any).mockResolvedValue({ id: "s1", title: "New" });
    const res = await PATCH(
      new Request("http://localhost/api/studio/samples/s1", {
        method: "PATCH",
        body: JSON.stringify({ title: "New" }),
      }),
      ctx("s1")
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.sample.title).toBe("New");
    expect((updateSample as any).mock.calls[0][0]).toEqual({
      id: "s1",
      input: { title: "New" },
    });
  });

  it("returns 400 on empty body", async () => {
    (auth as any).mockResolvedValue({ user: { id: "admin1", role: "STUDIO_ADMIN" } });
    const res = await PATCH(
      new Request("http://localhost/api/studio/samples/s1", {
        method: "PATCH",
        body: JSON.stringify({}),
      }),
      ctx("s1")
    );
    expect(res.status).toBe(400);
  });
});
