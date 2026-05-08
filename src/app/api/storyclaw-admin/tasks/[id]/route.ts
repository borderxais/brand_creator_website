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
