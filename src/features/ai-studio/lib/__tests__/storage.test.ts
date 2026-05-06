import { describe, it, expect, vi } from "vitest";

// Set dummy env vars before importing
process.env.SUPABASE_URL = "https://dummy.supabase.co";
process.env.SUPABASE_SERVICE_KEY = "dummy-key";

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    storage: {
      from: (bucket: string) => ({
        createSignedUrl: vi.fn(async (path: string, ttl: number) => ({
          data: { signedUrl: `https://signed.example/${bucket}/${path}?ttl=${ttl}` },
          error: null,
        })),
        createSignedUploadUrl: vi.fn(async (path: string) => ({
          data: {
            signedUrl: `https://upload.example/${bucket}/${path}`,
            token: `token-${bucket}-${path}`,
            path,
          },
          error: null,
        })),
        getPublicUrl: vi.fn((path: string) => ({
          data: { publicUrl: `https://public.example/${bucket}/${path}` },
        })),
      }),
    },
  })),
}));

import {
  outputPathFor,
  samplePathFor,
  getSampleSignedUrl,
  getOutputSignedUrl,
  getOutputUploadUrl,
  getSampleUploadUrl,
  STUDIO_SAMPLES_BUCKET,
  STUDIO_OUTPUTS_BUCKET,
} from "@/features/ai-studio/lib/storage";

describe("storage helpers", () => {
  it("outputPathFor includes userId and requestId", () => {
    expect(outputPathFor({ userId: "u1", requestId: "r1" })).toBe("u1/r1.mp4");
  });

  it("samplePathFor includes sampleId and ext", () => {
    expect(samplePathFor({ sampleId: "s1", ext: "mp4" })).toBe("s1/sample.mp4");
    expect(samplePathFor({ sampleId: "s1", ext: "jpg" })).toBe("s1/thumb.jpg");
  });

  it("STUDIO_SAMPLES_BUCKET and STUDIO_OUTPUTS_BUCKET are correct constants", () => {
    expect(STUDIO_SAMPLES_BUCKET).toBe("studio-samples");
    expect(STUDIO_OUTPUTS_BUCKET).toBe("studio-outputs");
  });

  it("getSampleSignedUrl returns signed URL for samples bucket", async () => {
    const url = await getSampleSignedUrl("s1/sample.mp4");
    expect(url).toContain("studio-samples/s1/sample.mp4");
  });

  it("getOutputSignedUrl returns 7-day signed URL for outputs bucket", async () => {
    const url = await getOutputSignedUrl("u1/r1.mp4");
    expect(url).toContain("studio-outputs/u1/r1.mp4");
    expect(url).toContain(`ttl=${60 * 60 * 24 * 7}`);
  });

  it("getOutputUploadUrl returns { uploadUrl, path, token }", async () => {
    const result = await getOutputUploadUrl({ userId: "u1", requestId: "r1" });
    expect(result).toHaveProperty("uploadUrl");
    expect(result).toHaveProperty("path");
    expect(result).toHaveProperty("token");
    expect(result.uploadUrl).toContain("studio-outputs/u1/r1.mp4");
    expect(result.token).toContain("studio-outputs");
  });

  it("getOutputUploadUrl path equals userId/requestId.mp4", async () => {
    const result = await getOutputUploadUrl({ userId: "user-abc", requestId: "req-xyz" });
    expect(result.path).toBe("user-abc/req-xyz.mp4");
  });

  it("getSampleUploadUrl returns { uploadUrl, path, token } for mp4", async () => {
    const result = await getSampleUploadUrl({ sampleId: "s-1", ext: "mp4" });
    expect(result).toHaveProperty("uploadUrl");
    expect(result).toHaveProperty("path");
    expect(result).toHaveProperty("token");
    expect(result.path).toBe("s-1/sample.mp4");
    expect(result.uploadUrl).toContain("studio-samples/s-1/sample.mp4");
    expect(result.token).toContain("studio-samples");
  });

  it("getSampleUploadUrl path equals sampleId/thumb.jpg for jpg ext", async () => {
    const result = await getSampleUploadUrl({ sampleId: "s-2", ext: "jpg" });
    expect(result.path).toBe("s-2/thumb.jpg");
  });
});
