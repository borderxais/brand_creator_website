import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { patchTaskSchema } from "@/lib/ai-video-task";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchTaskSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid payload";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const existing = await prisma.aiVideoTask.findUnique({
    where: { id },
    select: { outputPath: true, outputUrl: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  // outputUrl: payload value if provided, otherwise existing value.
  const finalOutputUrl =
    parsed.data.outputUrl !== undefined ? parsed.data.outputUrl : existing.outputUrl;

  if (parsed.data.status === "DELIVERED") {
    const hasOutput =
      (typeof finalOutputUrl === "string" && finalOutputUrl.length > 0) ||
      (typeof existing.outputPath === "string" && existing.outputPath.length > 0);
    if (!hasOutput) {
      return NextResponse.json(
        { error: "outputUrl or uploaded output required when status is DELIVERED" },
        { status: 400 }
      );
    }
  }

  try {
    const task = await prisma.aiVideoTask.update({
      where: { id },
      data: {
        status: parsed.data.status,
        outputUrl: parsed.data.outputUrl ?? undefined,
        notes: parsed.data.notes ?? undefined,
      },
      select: {
        id: true,
        status: true,
        outputUrl: true,
        outputPath: true,
        notes: true,
        updatedAt: true,
      },
    });
    return NextResponse.json({ task });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    console.error("[storyclaw-admin/tasks] update error", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}
