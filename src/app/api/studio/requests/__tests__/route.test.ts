import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/features/ai-studio/lib/requests", () => ({
  submitRequest: vi.fn(),
  listRequestsForCreator: vi.fn(),
}));

import { auth } from "@/lib/auth";
import { submitRequest, listRequestsForCreator } from "@/features/ai-studio/lib/requests";
import { POST, GET } from "@/app/api/studio/requests/route";
import { HttpError } from "@/features/ai-studio/lib/errors";

beforeEach(() => vi.clearAllMocks());

const validBody = {
  prompt: "A".repeat(50),
  targetCategory: "EMOTION_STORY",
  sampleId: "s1",
};

describe("POST /api/studio/requests", () => {
  it("returns 401 when no session", async () => {
    (auth as any).mockResolvedValue(null);
    const res = await POST(
      new Request("http://localhost/x", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(validBody),
      })
    );
    expect(res.status).toBe(401);
  });

  it("submits request and returns 200", async () => {
    (auth as any).mockResolvedValue({ user: { id: "u1", role: "CREATOR" } });
    (submitRequest as any).mockResolvedValue({ id: "r1", status: "PENDING" });
    const res = await POST(
      new Request("http://localhost/x", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(validBody),
      })
    );
    expect(res.status).toBe(200);
    const args = (submitRequest as any).mock.calls[0][0];
    expect(args.creatorId).toBe("u1");
  });

  it("returns 402 when quota exhausted", async () => {
    (auth as any).mockResolvedValue({ user: { id: "u1", role: "CREATOR" } });
    (submitRequest as any).mockRejectedValue(new HttpError(402, "quota exhausted"));
    const res = await POST(
      new Request("http://localhost/x", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(validBody),
      })
    );
    expect(res.status).toBe(402);
  });

  it("returns 400 on invalid body", async () => {
    (auth as any).mockResolvedValue({ user: { id: "u1", role: "CREATOR" } });
    const res = await POST(
      new Request("http://localhost/x", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt: "short", targetCategory: "EMOTION_STORY" }),
      })
    );
    expect(res.status).toBe(400);
  });
});

describe("GET /api/studio/requests", () => {
  it("returns creator's requests", async () => {
    (auth as any).mockResolvedValue({ user: { id: "u1", role: "CREATOR" } });
    (listRequestsForCreator as any).mockResolvedValue([{ id: "r1" }]);
    const res = await GET(new Request("http://localhost/x"));
    expect(res.status).toBe(200);
    const args = (listRequestsForCreator as any).mock.calls[0][0];
    expect(args.creatorId).toBe("u1");
  });
});
