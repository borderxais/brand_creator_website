import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createId } from "@paralleldrive/cuid2";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  buildPortraitPath,
  buildVoicePath,
  promptSchema,
  validatePortraitFile,
  validateVoiceFile,
  type PortraitMime,
  type VoiceMime,
} from "@/lib/ai-video-task";
import { SupabaseConfigError, deleteFromBucket, uploadToBucket } from "@/lib/supabase-admin";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const creatorId = session.user.id;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const promptRaw = formData.get("prompt");
  const promptResult = promptSchema.safeParse(promptRaw);
  if (!promptResult.success) {
    return NextResponse.json({ error: "Prompt required" }, { status: 400 });
  }
  const prompt = promptResult.data;

  const portrait = formData.get("portrait");
  if (!(portrait instanceof File) || portrait.size === 0) {
    return NextResponse.json({ error: "Portrait image required" }, { status: 400 });
  }
  const portraitCheck = validatePortraitFile(portrait);
  if (!portraitCheck.ok) {
    return NextResponse.json({ error: portraitCheck.error }, { status: portraitCheck.status });
  }

  const voiceRaw = formData.get("voice");
  const voice = voiceRaw instanceof File && voiceRaw.size > 0 ? voiceRaw : null;
  const voiceCheck = validateVoiceFile(voice);
  if (!voiceCheck.ok) {
    return NextResponse.json({ error: voiceCheck.error }, { status: voiceCheck.status });
  }

  const taskId = createId();
  const portraitPath = buildPortraitPath(creatorId, taskId, portrait.type as PortraitMime);
  const voicePath = voice ? buildVoicePath(creatorId, taskId, voice.type as VoiceMime) : null;

  const uploadedPaths: string[] = [];

  try {
    await uploadToBucket(portraitPath, portrait, portrait.type);
    uploadedPaths.push(portraitPath);

    if (voice && voicePath) {
      await uploadToBucket(voicePath, voice, voice.type);
      uploadedPaths.push(voicePath);
    }

    const task = await prisma.aiVideoTask.create({
      data: {
        id: taskId,
        creatorId,
        prompt,
        portraitPath,
        voicePath,
      },
      select: { id: true, status: true },
    });

    return NextResponse.json({ id: task.id, status: task.status });
  } catch (error) {
    if (uploadedPaths.length > 0) {
      await deleteFromBucket(uploadedPaths);
    }
    if (error instanceof SupabaseConfigError) {
      console.error("[ai-videos/tasks] supabase not configured");
      return NextResponse.json({ error: "Storage not configured" }, { status: 500 });
    }
    if (error instanceof Error && error.message.startsWith("Supabase upload failed")) {
      console.error("[ai-videos/tasks] upload error", error.message);
      return NextResponse.json({ error: "Storage upload failed" }, { status: 502 });
    }
    console.error("[ai-videos/tasks] db insert error", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
