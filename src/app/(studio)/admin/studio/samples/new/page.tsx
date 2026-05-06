import { SampleUploadForm } from "@/features/ai-studio/components/SampleUploadForm";

export const dynamic = "force-dynamic";

export default function AdminStudioSampleNewPage() {
  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-2">
        <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">Upload</span>
        <h1 className="text-4xl font-light tracking-tight text-zinc-100">New sample</h1>
        <p className="max-w-xl text-sm text-zinc-400">
          Upload a vertical reference reel and a thumbnail. Files stream straight to storage; the
          metadata row is created last.
        </p>
      </header>
      <SampleUploadForm />
    </div>
  );
}
