import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/features/ai-studio/lib/requests", () => ({
  claimRequest: vi.fn(),
  deliverRequest: vi.fn(),
  rejectRequest: vi.fn(),
  failRequest: vi.fn(),
}));

import { auth } from "@/lib/auth";
import {
  claimRequest,
  deliverRequest,
  rejectRequest,
  failRequest,
} from "@/features/ai-studio/lib/requests";
import { POST as claim } from "@/app/api/studio/requests/[id]/claim/route";
import { POST as deliver } from "@/app/api/studio/requests/[id]/deliver/route";
import { POST as reject } from "@/app/api/studio/requests/[id]/reject/route";
import { POST as fail } from "@/app/api/studio/requests/[id]/fail/route";

beforeEach(() => vi.clearAllMocks());

const adminCtx = (id: string) => ({ params: Promise.resolve({ id }) });
const adminSession = { user: { id: "a1", role: "STUDIO_ADMIN" } };
const creatorSession = { user: { id: "u1", role: "CREATOR" } };

describe("claim", () => {
  it("returns 403 for non-admin", async () => {
    (auth as any).mockResolvedValue(creatorSession);
    const res = await claim(new Request("http://localhost/x", { method: "POST" }), adminCtx("r1"));
    expect(res.status).toBe(403);
  });
  it("calls claimRequest with adminId for admin", async () => {
    (auth as any).mockResolvedValue(adminSession);
    (claimRequest as any).mockResolvedValue({ id: "r1", status: "IN_PROGRESS" });
    await claim(new Request("http://localhost/x", { method: "POST" }), adminCtx("r1"));
    expect(claimRequest).toHaveBeenCalledWith({ requestId: "r1", adminId: "a1" });
  });
});

describe("deliver", () => {
  it("requires outputUrl + outputDurationSec", async () => {
    (auth as any).mockResolvedValue(adminSession);
    const res = await deliver(
      new Request("http://localhost/x", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      }),
      adminCtx("r1")
    );
    expect(res.status).toBe(400);
  });
  it("calls deliverRequest with parsed body", async () => {
    (auth as any).mockResolvedValue(adminSession);
    (deliverRequest as any).mockResolvedValue({ id: "r1", status: "DELIVERED" });
    await deliver(
      new Request("http://localhost/x", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ outputUrl: "studio-outputs/u1/r1.mp4", outputDurationSec: 90 }),
      }),
      adminCtx("r1")
    );
    expect(deliverRequest).toHaveBeenCalledWith({
      requestId: "r1",
      outputUrl: "studio-outputs/u1/r1.mp4",
      outputDurationSec: 90,
    });
  });
});

describe("reject", () => {
  it("requires reason >= 5 chars", async () => {
    (auth as any).mockResolvedValue(adminSession);
    const res = await reject(
      new Request("http://localhost/x", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reason: "no" }),
      }),
      adminCtx("r1")
    );
    expect(res.status).toBe(400);
  });
  it("calls rejectRequest", async () => {
    (auth as any).mockResolvedValue(adminSession);
    (rejectRequest as any).mockResolvedValue({ id: "r1", status: "REJECTED" });
    await reject(
      new Request("http://localhost/x", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reason: "needs more story setup" }),
      }),
      adminCtx("r1")
    );
    expect(rejectRequest).toHaveBeenCalledWith({
      requestId: "r1",
      reason: "needs more story setup",
    });
  });
});

describe("fail", () => {
  it("calls failRequest (no body required)", async () => {
    (auth as any).mockResolvedValue(adminSession);
    (failRequest as any).mockResolvedValue({ id: "r1", status: "FAILED" });
    await fail(new Request("http://localhost/x", { method: "POST" }), adminCtx("r1"));
    expect(failRequest).toHaveBeenCalledWith({ requestId: "r1" });
  });
});
