import { prisma } from "@/lib/prisma";
import { createSignedUrls } from "@/lib/supabase-admin";
import TaskAdminRow, { type TaskAdminRowData } from "./TaskAdminRow";

export const dynamic = "force-dynamic";

export default async function StoryclawAdminPage() {
  const rows = await prisma.aiVideoTask.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      prompt: true,
      status: true,
      outputUrl: true,
      outputPath: true,
      notes: true,
      voicePath: true,
      portraitPath: true,
      createdAt: true,
      updatedAt: true,
      creatorId: true,
      creator: { select: { id: true, email: true, name: true } },
    },
  });

  const portraitPaths = rows.map((r) => r.portraitPath);
  const voicePaths = rows.map((r) => r.voicePath).filter((p): p is string => p !== null);
  const outputPaths = rows.map((r) => r.outputPath).filter((p): p is string => p !== null);

  const [portraitMap, voiceMap, outputMap] = await Promise.all([
    createSignedUrls(portraitPaths),
    createSignedUrls(voicePaths),
    createSignedUrls(outputPaths),
  ]);

  const tasks: Array<TaskAdminRowData & { rowKey: string }> = rows.map((r) => ({
    id: r.id,
    creatorLabel: r.creator?.name ?? r.creator?.email ?? r.creatorId,
    prompt: r.prompt,
    status: r.status,
    outputUrl: r.outputUrl,
    outputPath: r.outputPath,
    outputSignedUrl: r.outputPath ? (outputMap.get(r.outputPath) ?? null) : null,
    notes: r.notes,
    voiceSignedUrl: r.voicePath ? (voiceMap.get(r.voicePath) ?? null) : null,
    portraitSignedUrl: portraitMap.get(r.portraitPath) ?? null,
    createdAt: r.createdAt.toISOString(),
    rowKey: `${r.id}-${r.updatedAt.toISOString()}`,
  }));

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-8">
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
        <p className="font-semibold">Internal Storyclaw control panel</p>
        <p>This page is not authentication-protected. Do not share this URL.</p>
      </div>
      <h1 className="text-2xl font-semibold text-slate-900">AI Video Tasks</h1>
      {tasks.length === 0 ? (
        <p className="text-sm text-slate-500">No tasks.</p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-slate-500">
              <th className="px-3 py-2">Task</th>
              <th className="px-3 py-2">Inputs</th>
              <th className="px-3 py-2">Status / Output</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <TaskAdminRow key={task.rowKey} task={task} />
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
