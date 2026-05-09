import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { buildOutputPath, validateOutputFile, type VideoMime } from "@/lib/ai-video-task";
import {
  SupabaseConfigError,
  SupabaseUploadError,
  deleteFromBucket,
  uploadToBucket,
} from "@/lib/supabase-admin";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const task = await prisma.aiVideoTask.findUnique({
    where: { id },
    select: { id: true, creatorId: true, outputPath: true },
  });
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const fileRaw = formData.get("file");
  const file = fileRaw instanceof File && fileRaw.size > 0 ? fileRaw : null;
  const check = validateOutputFile(file);
  if (!check.ok) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }
  // validateOutputFile narrowed: file is File with mime in VIDEO_MIME_TO_EXT keys
  const validFile = file as File;
  const newPath = buildOutputPath(task.creatorId, task.id, validFile.type as VideoMime);

  const previousPath = task.outputPath;
  const samePath = previousPath === newPath;

  // Best-effort cleanup of previous output blob when path differs.
  if (previousPath && !samePath) {
    await deleteFromBucket([previousPath]);
  }

  let uploadedNew = false;
  try {
    await uploadToBucket(newPath, validFile, validFile.type);
    uploadedNew = true;

    const updated = await prisma.aiVideoTask.update({
      where: { id: task.id },
      data: { outputPath: newPath, outputUrl: null },
      select: { outputPath: true },
    });

    return NextResponse.json({ outputPath: updated.outputPath });
  } catch (error) {
    if (uploadedNew) {
      await deleteFromBucket([newPath]);
    }
    if (error instanceof SupabaseConfigError) {
      console.error("[storyclaw-admin/tasks/output] supabase not configured");
      return NextResponse.json({ error: "Storage not configured" }, { status: 500 });
    }
    if (error instanceof SupabaseUploadError) {
      console.error("[storyclaw-admin/tasks/output] upload error", {
        path: error.path,
        message: error.message,
      });
      return NextResponse.json({ error: "Storage upload failed" }, { status: 502 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    console.error("[storyclaw-admin/tasks/output] db error", error);
    return NextResponse.json({ error: "Failed to record output" }, { status: 500 });
  }
}
