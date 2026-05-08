import { describe, it, expect } from "vitest";
import {
  PORTRAIT_MIME_TO_EXT,
  VOICE_MIME_TO_EXT,
  PORTRAIT_MAX_BYTES,
  VOICE_MAX_BYTES,
  buildPortraitPath,
  buildVoicePath,
  validatePortraitFile,
  validateVoiceFile,
  promptSchema,
  patchTaskSchema,
  STATUS_DISPLAY,
} from "@/lib/ai-video-task";

describe("buildPortraitPath", () => {
  it("uses creatorId, taskId and the correct extension", () => {
    expect(buildPortraitPath("creator-1", "task-1", "image/jpeg")).toBe(
      "creator-1/task-1/portrait.jpg"
    );
    expect(buildPortraitPath("c", "t", "image/png")).toBe("c/t/portrait.png");
    expect(buildPortraitPath("c", "t", "image/webp")).toBe("c/t/portrait.webp");
  });
});

describe("buildVoicePath", () => {
  it("uses creatorId, taskId and the correct extension", () => {
    expect(buildVoicePath("c", "t", "audio/mpeg")).toBe("c/t/voice.mp3");
    expect(buildVoicePath("c", "t", "audio/wav")).toBe("c/t/voice.wav");
    expect(buildVoicePath("c", "t", "audio/mp4")).toBe("c/t/voice.m4a");
    expect(buildVoicePath("c", "t", "audio/x-m4a")).toBe("c/t/voice.m4a");
  });
});

describe("validatePortraitFile", () => {
  it("accepts a small JPEG", () => {
    const f = new File(["x"], "p.jpg", { type: "image/jpeg" });
    expect(validatePortraitFile(f)).toEqual({ ok: true });
  });
  it("rejects an unsupported MIME", () => {
    const f = new File(["x"], "p.gif", { type: "image/gif" });
    expect(validatePortraitFile(f)).toEqual({
      ok: false,
      status: 400,
      error: "Unsupported portrait file type",
    });
  });
  it("rejects an oversize file", () => {
    const big = new File([new Uint8Array(PORTRAIT_MAX_BYTES + 1)], "p.jpg", {
      type: "image/jpeg",
    });
    expect(validatePortraitFile(big)).toEqual({
      ok: false,
      status: 413,
      error: "Portrait file exceeds size limit",
    });
  });
});

describe("validateVoiceFile", () => {
  it("returns ok when the voice argument is null", () => {
    expect(validateVoiceFile(null)).toEqual({ ok: true });
  });
  it("rejects an unsupported MIME", () => {
    const f = new File(["x"], "v.flac", { type: "audio/flac" });
    expect(validateVoiceFile(f)).toEqual({
      ok: false,
      status: 400,
      error: "Unsupported voice file type",
    });
  });
  it("rejects an oversize file", () => {
    const big = new File([new Uint8Array(VOICE_MAX_BYTES + 1)], "v.mp3", {
      type: "audio/mpeg",
    });
    expect(validateVoiceFile(big)).toEqual({
      ok: false,
      status: 413,
      error: "Voice file exceeds size limit",
    });
  });
});

describe("promptSchema", () => {
  it("trims and accepts a non-empty prompt", () => {
    expect(promptSchema.parse("  hello  ")).toBe("hello");
  });
  it("rejects an empty/whitespace prompt", () => {
    expect(() => promptSchema.parse("   ")).toThrow();
  });
  it("rejects a prompt longer than 5000 chars", () => {
    expect(() => promptSchema.parse("a".repeat(5001))).toThrow();
  });
});

describe("patchTaskSchema", () => {
  it("requires outputUrl when status is DELIVERED", () => {
    expect(() => patchTaskSchema.parse({ status: "DELIVERED" })).toThrow();
    expect(() => patchTaskSchema.parse({ status: "DELIVERED", outputUrl: "" })).toThrow();
    expect(patchTaskSchema.parse({ status: "DELIVERED", outputUrl: "https://x" })).toEqual({
      status: "DELIVERED",
      outputUrl: "https://x",
    });
  });
  it("accepts non-DELIVERED statuses without outputUrl", () => {
    expect(patchTaskSchema.parse({ status: "QUEUED" })).toEqual({ status: "QUEUED" });
    expect(patchTaskSchema.parse({ status: "IN_REVIEW", notes: "n" })).toEqual({
      status: "IN_REVIEW",
      notes: "n",
    });
  });
  it("rejects an invalid status", () => {
    expect(() => patchTaskSchema.parse({ status: "BOGUS" })).toThrow();
  });
  it("rejects an outputUrl that is not a valid URL", () => {
    expect(() => patchTaskSchema.parse({ status: "DELIVERED", outputUrl: "not a url" })).toThrow();
  });
});

describe("STATUS_DISPLAY", () => {
  it("maps every enum value to a label", () => {
    expect(STATUS_DISPLAY.QUEUED.label).toBe("Queued");
    expect(STATUS_DISPLAY.GENERATING.label).toBe("Generating");
    expect(STATUS_DISPLAY.IN_REVIEW.label).toBe("In Review");
    expect(STATUS_DISPLAY.DELIVERED.label).toBe("Delivered");
  });
});

it("PORTRAIT_MIME_TO_EXT and VOICE_MIME_TO_EXT export the expected keys", () => {
  expect(Object.keys(PORTRAIT_MIME_TO_EXT).sort()).toEqual([
    "image/jpeg",
    "image/png",
    "image/webp",
  ]);
  expect(Object.keys(VOICE_MIME_TO_EXT).sort()).toEqual([
    "audio/mp4",
    "audio/mpeg",
    "audio/wav",
    "audio/x-m4a",
  ]);
});
