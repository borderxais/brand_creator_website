import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    sample: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import {
  listSamples,
  getSample,
  createSample,
  updateSample,
  archiveSample,
} from "@/features/ai-studio/lib/samples";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("samples service", () => {
  it("listSamples filters by category and isActive=true by default", async () => {
    (prisma.sample.findMany as any).mockResolvedValue([]);
    await listSamples({ category: "EMOTION_STORY", limit: 12 });
    const args = (prisma.sample.findMany as any).mock.calls[0][0];
    expect(args.where).toEqual({ category: "EMOTION_STORY", isActive: true });
    expect(args.take).toBe(12);
    expect(args.orderBy).toEqual({ createdAt: "desc" });
  });

  it("listSamples cursor-paginates with cursorId", async () => {
    (prisma.sample.findMany as any).mockResolvedValue([]);
    await listSamples({ limit: 12, cursorId: "abc123" });
    const args = (prisma.sample.findMany as any).mock.calls[0][0];
    expect(args.skip).toBe(1);
    expect(args.cursor).toEqual({ id: "abc123" });
  });

  it("getSample returns row by id", async () => {
    (prisma.sample.findUnique as any).mockResolvedValue({ id: "s1", title: "Demo" });
    const result = await getSample("s1");
    expect(result?.id).toBe("s1");
  });

  it("createSample writes uploadedBy and defaults durationSec=90", async () => {
    (prisma.sample.create as any).mockResolvedValue({ id: "s1" });
    await createSample({
      input: {
        title: "Demo",
        category: "VERTICAL_DRAMA",
        previewUrl: "studio-samples/s1/sample.mp4",
        durationSec: 90,
      },
      uploadedById: "admin-1",
    });
    const args = (prisma.sample.create as any).mock.calls[0][0];
    expect(args.data.uploadedById).toBe("admin-1");
    expect(args.data.durationSec).toBe(90);
    expect(args.data.title).toBe("Demo");
  });

  it("archiveSample sets isActive=false", async () => {
    (prisma.sample.update as any).mockResolvedValue({ id: "s1", isActive: false });
    await archiveSample({ id: "s1", isActive: false });
    const args = (prisma.sample.update as any).mock.calls[0][0];
    expect(args.where).toEqual({ id: "s1" });
    expect(args.data).toEqual({ isActive: false });
  });

  it("archiveSample un-archives by flipping isActive=true", async () => {
    (prisma.sample.update as any).mockResolvedValue({ id: "s1", isActive: true });
    await archiveSample({ id: "s1", isActive: true });
    const args = (prisma.sample.update as any).mock.calls[0][0];
    expect(args.where).toEqual({ id: "s1" });
    expect(args.data).toEqual({ isActive: true });
  });

  it("updateSample passes input through to prisma.sample.update", async () => {
    (prisma.sample.update as any).mockResolvedValue({ id: "s1", title: "New" });
    await updateSample({
      id: "s1",
      input: { title: "New", durationSec: 120 },
    });
    const args = (prisma.sample.update as any).mock.calls[0][0];
    expect(args.where).toEqual({ id: "s1" });
    expect(args.data).toEqual({ title: "New", durationSec: 120 });
  });
});
