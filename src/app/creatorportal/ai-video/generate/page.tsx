import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, FileAudio, FileImage, Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Generate AI Video | BorderX CreatorHub',
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

        <form className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Voice upload</h2>
              <p className="mt-2 text-sm text-slate-600">
                Provide an audio sample for cloning—30 seconds or longer works best. We accept WAV, MP3, and
                M4A files up to 50 MB.
              </p>
              <label
                htmlFor="voice-upload"
                className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-indigo-200 bg-indigo-50/40 p-6 text-center transition hover:border-indigo-400 hover:bg-indigo-50"
              >
                <FileAudio className="h-10 w-10 text-indigo-500" />
                <span className="mt-3 text-sm font-semibold text-indigo-700">Click to upload voice sample</span>
                <span className="mt-1 text-xs text-slate-500">Or drag and drop an audio file</span>
                <input id="voice-upload" name="voice-upload" type="file" accept="audio/*" className="hidden" />
              </label>
            </section>

            <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Creative prompt
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Outline the storyline, pacing notes, and CTAs you want in the finished video. Include any
                specific phrases we must mention.
              </p>
              <div className="mt-4">
                <label htmlFor="prompt" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Generation prompt
                </label>
                <textarea
                  id="prompt"
                  name="prompt"
                  rows={8}
                  placeholder="Example: Create a 30s vertical video highlighting our winter skincare capsule..."
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm text-slate-700 transition focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Portrait reference
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Upload a clear facial image of the target talent. Front-facing with neutral lighting delivers
                the most consistent results.
              </p>
              <label
                htmlFor="portrait-upload"
                className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center transition hover:border-slate-300 hover:bg-slate-100"
              >
                <FileImage className="h-10 w-10 text-slate-500" />
                <span className="mt-3 text-sm font-semibold text-slate-700">Upload portrait image</span>
                <span className="mt-1 text-xs text-slate-500">JPG or PNG, minimum 1080x1080</span>
                <input id="portrait-upload" name="portrait-upload" type="file" accept="image/*" className="hidden" />
              </label>

              <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-xs text-slate-500">
                <p className="font-semibold text-slate-600">Tips for fast approvals</p>
                <ul className="mt-2 space-y-1">
                  <li>• Use raw files rather than screenshots to avoid compression artifacts.</li>
                  <li>• Keep visible logos or watermarks out of frame.</li>
                  <li>• Confirm likeness permissions before uploading third-party talent.</li>
                </ul>
              </div>
            </section>

            <button
              type="button"
              className="group relative inline-flex w-full items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
              <span className="relative inline-flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Generate video
              </span>
            </button>
          </aside>
        </form>
      </div>
    </div>
  );
}
