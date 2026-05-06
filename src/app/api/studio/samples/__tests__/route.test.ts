import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/features/ai-studio/lib/samples", () => ({
  listSamples: vi.fn(),
  createSample: vi.fn(),
}));

import { auth } from "@/lib/auth";
import { listSamples, createSample } from "@/features/ai-studio/lib/samples";
import { GET, POST } from "@/app/api/studio/samples/route";

beforeEach(() => vi.clearAllMocks());

describe("GET /api/studio/samples", () => {
  it("returns samples list", async () => {
    (auth as any).mockResolvedValue({ user: { id: "u1", role: "CREATOR" } });
    (listSamples as any).mockResolvedValue([{ id: "s1", title: "Demo" }]);
    const res = await GET(new Request("http://localhost/api/studio/samples?limit=12"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.samples).toHaveLength(1);
  });

  it("filters by category query param", async () => {
    (auth as any).mockResolvedValue({ user: { id: "u1", role: "CREATOR" } });
    (listSamples as any).mockResolvedValue([]);
    await GET(new Request("http://localhost/api/studio/samples?category=EMOTION_STORY&limit=5"));
    const args = (listSamples as any).mock.calls[0][0];
    expect(args.category).toBe("EMOTION_STORY");
    expect(args.limit).toBe(5);
  });

  it("returns 401 when not authenticated", async () => {
    (auth as any).mockResolvedValue(null);
    const res = await GET(new Request("http://localhost/api/studio/samples"));
    expect(res.status).toBe(401);
  });
});

describe("POST /api/studio/samples", () => {
  it("returns 403 when not STUDIO_ADMIN", async () => {
    (auth as any).mockResolvedValue({ user: { id: "u1", role: "CREATOR" } });
    const res = await POST(
      new Request("http://localhost/api/studio/samples", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: "Demo",
          category: "VERTICAL_DRAMA",
          previewUrl: "studio-samples/s1/sample.mp4",
        }),
      })
    );
    expect(res.status).toBe(403);
  });

  it("creates sample when admin", async () => {
    (auth as any).mockResolvedValue({ user: { id: "a1", role: "STUDIO_ADMIN" } });
    (createSample as any).mockResolvedValue({ id: "s1" });
    const res = await POST(
      new Request("http://localhost/api/studio/samples", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: "Demo",
          category: "VERTICAL_DRAMA",
          previewUrl: "studio-samples/s1/sample.mp4",
        }),
      })
    );
    expect(res.status).toBe(200);
    const args = (createSample as any).mock.calls[0][0];
    expect(args.uploadedById).toBe("a1");
  });

  it("returns 400 on invalid body", async () => {
    (auth as any).mockResolvedValue({ user: { id: "a1", role: "STUDIO_ADMIN" } });
    const res = await POST(
      new Request("http://localhost/api/studio/samples", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: "" }),
      })
    );
    expect(res.status).toBe(400);
  });
});
