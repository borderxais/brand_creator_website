import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import GenerateVideoForm from './GenerateVideoForm';

export const metadata: Metadata = {
  title: 'Generate AI Video | Cricher AI CreatorHub',
  description:
    'Submit the assets and creative direction needed to spin up a fresh AI-generated advertising video.',
};

export default function GenerateAiVideoPage() {
  return (
    <div className="space-y-8 py-8">
      <Link
        href="/creatorportal/ai-video"
        className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 transition hover:text-indigo-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to AI Video Library
      </Link>

      <div className="space-y-10">
        <header className="space-y-3">
          <p className="text-sm uppercase tracking-[0.2em] text-indigo-500">AI production suite</p>
          <h1 className="text-3xl font-semibold text-slate-900">Generate a new AI video</h1>
          <p className="text-base text-slate-600">
            Drop in the reference voice clone, a clear portrait for stylistic grounding, and the prompt we
            should follow. Our production pipeline handles the rest.
          </p>
        </header>

        <GenerateVideoForm />
      </div>
    </div>
  );
}
