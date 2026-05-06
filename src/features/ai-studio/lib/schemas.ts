import { z } from "zod";

export const CategoryEnum = z.enum([
  "VERTICAL_DRAMA",
  "EMOTION_STORY",
  "LIFESTYLE_VLOG",
  "SUSPENSE_THRILLER",
  "OTHER",
]);

export const RequestSubmitSchema = z.object({
  sampleId: z.string().min(1).optional(),
  prompt: z.string().min(30).max(1500),
  styleNotes: z.string().max(500).optional(),
  targetCategory: CategoryEnum,
});

export type RequestSubmitInput = z.infer<typeof RequestSubmitSchema>;

export const SampleCreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  category: CategoryEnum,
  hook: z.string().max(200).optional(),
  previewUrl: z.string().min(1),
  thumbnailUrl: z.string().min(1).optional(),
  durationSec: z.number().int().positive().max(600).default(90),
});

export type SampleCreateInput = z.infer<typeof SampleCreateSchema>;

export const SampleUpdateSchema = z
  .object({
    title: z.string().min(1).max(120).optional(),
    description: z.string().max(2000).nullable().optional(),
    category: CategoryEnum.optional(),
    hook: z.string().max(280).nullable().optional(),
    previewUrl: z.string().url().optional(),
    thumbnailUrl: z.string().url().nullable().optional(),
    durationSec: z.number().int().min(1).max(600).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "no fields to update" });

export type SampleUpdateInput = z.infer<typeof SampleUpdateSchema>;

export const DeliverSchema = z.object({
  outputUrl: z.string().min(1),
  outputDurationSec: z.number().int().positive().max(600),
});

export type DeliverInput = z.infer<typeof DeliverSchema>;

export const RejectSchema = z.object({
  reason: z.string().min(5).max(500),
});

export type RejectInput = z.infer<typeof RejectSchema>;
