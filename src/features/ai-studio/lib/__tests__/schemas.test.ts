import { describe, it, expect } from "vitest";
import {
  RequestSubmitSchema,
  SampleCreateSchema,
  SampleUpdateSchema,
  DeliverSchema,
  RejectSchema,
  CategoryEnum,
} from "@/features/ai-studio/lib/schemas";

describe("studio Zod schemas", () => {
  it("RequestSubmitSchema accepts valid input", () => {
    const ok = RequestSubmitSchema.safeParse({
      sampleId: "cuid123",
      prompt: "A short story about a cat finding its home in 90 seconds.",
      styleNotes: "Warm tone, slow pacing.",
      targetCategory: "EMOTION_STORY",
    });
    expect(ok.success).toBe(true);
  });

  it("RequestSubmitSchema rejects too-short prompt", () => {
    const result = RequestSubmitSchema.safeParse({
      sampleId: "cuid123",
      prompt: "too short",
      targetCategory: "EMOTION_STORY",
    });
    expect(result.success).toBe(false);
  });

  it("RequestSubmitSchema rejects invalid category", () => {
    const result = RequestSubmitSchema.safeParse({
      sampleId: "cuid123",
      prompt: "A".repeat(50),
      targetCategory: "BOGUS",
    });
    expect(result.success).toBe(false);
  });

  it("SampleCreateSchema requires preview URL", () => {
    const result = SampleCreateSchema.safeParse({
      title: "Demo",
      category: "VERTICAL_DRAMA",
    });
    expect(result.success).toBe(false);
  });

  it("DeliverSchema requires outputUrl + duration", () => {
    const ok = DeliverSchema.safeParse({
      outputUrl: "studio-outputs/u1/r1.mp4",
      outputDurationSec: 90,
    });
    expect(ok.success).toBe(true);
  });

  it("RejectSchema requires reason >= 5 chars", () => {
    expect(RejectSchema.safeParse({ reason: "no" }).success).toBe(false);
    expect(RejectSchema.safeParse({ reason: "needs more story setup" }).success).toBe(true);
  });

  it("SampleUpdateSchema rejects empty objects", () => {
    expect(SampleUpdateSchema.safeParse({}).success).toBe(false);
  });

  it("SampleUpdateSchema accepts partial updates", () => {
    const ok = SampleUpdateSchema.safeParse({ title: "Renamed" });
    expect(ok.success).toBe(true);
  });

  it("SampleUpdateSchema accepts isActive toggle alone", () => {
    const ok = SampleUpdateSchema.safeParse({ isActive: false });
    expect(ok.success).toBe(true);
  });

  it("CategoryEnum exposes 5 values matching Prisma enum", () => {
    expect(CategoryEnum.options).toEqual([
      "VERTICAL_DRAMA",
      "EMOTION_STORY",
      "LIFESTYLE_VLOG",
      "SUSPENSE_THRILLER",
      "OTHER",
    ]);
  });
});
