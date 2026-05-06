import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/features/ai-studio/lib/samples", () => ({ getSample: vi.fn() }));

import { auth } from "@/lib/auth";
import { getSample } from "@/features/ai-studio/lib/samples";
import { GET } from "@/app/api/studio/samples/[id]/route";

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
