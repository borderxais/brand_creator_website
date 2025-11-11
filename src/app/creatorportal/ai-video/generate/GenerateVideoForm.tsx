'use client';

import { FormEvent, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { FileAudio, FileImage, Loader2, Sparkles } from 'lucide-react';

type SubmissionState =
  | { type: 'idle' }
  | { type: 'success'; message: string; requestId: string; storagePath: string }
  | { type: 'error'; message: string };

export default function GenerateVideoForm() {
  const { data: session } = useSession();
  const [prompt, setPrompt] = useState('');
  const [voiceSample, setVoiceSample] = useState<File | null>(null);
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<SubmissionState>({ type: 'idle' });

  const voiceInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!session?.user?.id) {
      setStatus({ type: 'error', message: 'You must be signed in as a creator to submit a request.' });
      return;
    }

    if (!prompt.trim()) {
      setStatus({ type: 'error', message: 'Please provide a generation prompt.' });
      return;
    }

    const formData = new FormData();
    formData.append('creator_id', session.user.id);
    formData.append('prompt', prompt.trim());
    if (voiceSample) {
      formData.append('voice_sample', voiceSample);
    }
    if (referenceImage) {
      formData.append('reference_image', referenceImage);
    }

    setIsSubmitting(true);
    setStatus({ type: 'idle' });

    try {
      const response = await fetch('/api/ai-videos/generate', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.detail || 'Failed to queue AI video request.');
      }

      setStatus({
        type: 'success',
        message: data.message ?? 'Video request submitted successfully.',
        requestId: data.request_id,
        storagePath: data.storage_path,
      });
      setPrompt('');
      setVoiceSample(null);
      setReferenceImage(null);
      if (voiceInputRef.current) {
        voiceInputRef.current.value = '';
      }
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
    } catch (error) {
      console.error('AI video request failed:', error);
      setStatus({
        type: 'error',
        message:
          error instanceof Error ? error.message : 'Something went wrong while submitting your request.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {status.type !== 'idle' && (
        <div
          className={`rounded-2xl border p-4 text-sm ${
            status.type === 'success'
              ? 'border-emerald-200 bg-emerald-50/70 text-emerald-800'
              : 'border-rose-200 bg-rose-50/70 text-rose-700'
          }`}
        >
          {status.type === 'success' ? (
            <>
              <p className="font-semibold">{status.message}</p>
              <p className="mt-1 text-emerald-700">
                Request ID: <span className="font-mono text-xs">{status.requestId}</span>
              </p>
              <p className="text-emerald-700">
                Assets stored under: <span className="font-mono text-xs">{status.storagePath}</span>
              </p>
            </>
          ) : (
            status.message
          )}
        </div>
      )}

      <form className="grid gap-6 lg:grid-cols-[1.3fr_1fr]" onSubmit={handleSubmit}>
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Voice upload</h2>
            <p className="mt-2 text-sm text-slate-600">
              Provide an audio sample for cloning—30 seconds or longer works best. We accept WAV, MP3, and M4A
              files up to 25 MB.
            </p>
            <label
              htmlFor="voice_sample"
              className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-indigo-200 bg-indigo-50/40 p-6 text-center transition hover:border-indigo-400 hover:bg-indigo-50"
            >
              <FileAudio className="h-10 w-10 text-indigo-500" />
              <span className="mt-3 text-sm font-semibold text-indigo-700">Click to upload voice sample</span>
              <span className="mt-1 text-xs text-slate-500">Or drag and drop an audio file</span>
              <input
                id="voice_sample"
                name="voice_sample"
                type="file"
                accept="audio/*"
                className="hidden"
                ref={voiceInputRef}
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  setVoiceSample(file);
                }}
              />
            </label>
            {voiceSample && (
              <p className="mt-3 truncate text-xs font-medium text-indigo-700">{voiceSample.name}</p>
            )}
          </section>

          <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Creative prompt</h2>
            <p className="mt-2 text-sm text-slate-600">
              Outline the storyline, pacing notes, and CTAs you want in the finished video. Include any specific
              phrases we must mention.
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
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                required
              />
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Portrait reference</h2>
            <p className="mt-2 text-sm text-slate-600">
              Upload a clear facial image of the target talent. Front-facing with neutral lighting delivers the
              most consistent results.
            </p>
            <label
              htmlFor="reference_image"
              className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center transition hover:border-slate-300 hover:bg-slate-100"
            >
              <FileImage className="h-10 w-10 text-slate-500" />
              <span className="mt-3 text-sm font-semibold text-slate-700">Upload portrait image</span>
              <span className="mt-1 text-xs text-slate-500">JPG or PNG, minimum 1080x1080</span>
              <input
                id="reference_image"
                name="reference_image"
                type="file"
                accept="image/*"
                className="hidden"
                ref={imageInputRef}
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  setReferenceImage(file);
                }}
              />
            </label>
            {referenceImage && (
              <p className="mt-3 truncate text-xs font-medium text-slate-700">{referenceImage.name}</p>
            )}

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
            type="submit"
            disabled={isSubmitting || !prompt.trim()}
            className="group relative inline-flex w-full items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
            <span className="relative inline-flex items-center gap-2">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {isSubmitting ? 'Submitting…' : 'Generate video'}
            </span>
          </button>
        </aside>
      </form>
    </>
  );
}
