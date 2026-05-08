import { z } from "zod";

export const PORTRAIT_MAX_BYTES = 10 * 1024 * 1024;
export const VOICE_MAX_BYTES = 25 * 1024 * 1024;

export const PORTRAIT_MIME_TO_EXT = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export const VOICE_MIME_TO_EXT = {
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
} as const;

export type PortraitMime = keyof typeof PORTRAIT_MIME_TO_EXT;
export type VoiceMime = keyof typeof VOICE_MIME_TO_EXT;

export type FileValidationResult = { ok: true } | { ok: false; status: 400 | 413; error: string };

export function validatePortraitFile(file: File): FileValidationResult {
  if (!(file.type in PORTRAIT_MIME_TO_EXT)) {
    return { ok: false, status: 400, error: "Unsupported portrait file type" };
  }
  if (file.size > PORTRAIT_MAX_BYTES) {
    return { ok: false, status: 413, error: "Portrait file exceeds size limit" };
  }
  return { ok: true };
}

export function validateVoiceFile(file: File | null): FileValidationResult {
  if (file === null) return { ok: true };
  if (!(file.type in VOICE_MIME_TO_EXT)) {
    return { ok: false, status: 400, error: "Unsupported voice file type" };
  }
  if (file.size > VOICE_MAX_BYTES) {
    return { ok: false, status: 413, error: "Voice file exceeds size limit" };
  }
  return { ok: true };
}

export function buildPortraitPath(creatorId: string, taskId: string, mime: PortraitMime): string {
  return `${creatorId}/${taskId}/portrait.${PORTRAIT_MIME_TO_EXT[mime]}`;
}

export function buildVoicePath(creatorId: string, taskId: string, mime: VoiceMime): string {
  return `${creatorId}/${taskId}/voice.${VOICE_MIME_TO_EXT[mime]}`;
}

export const promptSchema = z
  .string()
  .transform((s) => s.trim())
  .pipe(z.string().min(1, "Prompt required").max(5000));

const baseStatusSchema = z.enum(["QUEUED", "GENERATING", "IN_REVIEW", "DELIVERED"]);

export const patchTaskSchema = z
  .object({
    status: baseStatusSchema,
    outputUrl: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine(
    (v) => v.status !== "DELIVERED" || (typeof v.outputUrl === "string" && v.outputUrl.length > 0),
    { message: "outputUrl required when status is DELIVERED", path: ["outputUrl"] }
  );

export type PatchTaskInput = z.infer<typeof patchTaskSchema>;

export const STATUS_DISPLAY = {
  QUEUED: { label: "Queued", className: "bg-slate-100 text-slate-700" },
  GENERATING: { label: "Generating", className: "bg-indigo-100 text-indigo-700" },
  IN_REVIEW: { label: "In Review", className: "bg-amber-100 text-amber-700" },
  DELIVERED: { label: "Delivered", className: "bg-emerald-100 text-emerald-700" },
} as const;
