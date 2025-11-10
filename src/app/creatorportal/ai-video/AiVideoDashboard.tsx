'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CalendarClock,
  ChevronDown,
  Download,
  FileText,
  Image as ImageIcon,
  Mic,
  Pause,
  Play,
  PlayCircle,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Video,
  X,
} from 'lucide-react';

export type VideoStatus = 'generating' | 'ready' | 'queued' | 'expired';

export type AiVideoRecord = {
  id: string;
  title: string;
  brand: string;
  createdAt: string;
  duration: string;
  format: '9:16' | '16:9' | '1:1';
  status: VideoStatus;
  expiresAt: string;
  videoUrl?: string;
  thumbnail?: string;
  campaign?: string;
  promptPreview: string;
  fullPrompt: string;
  targetVoice: string;
  targetVoiceNotes?: string;
  targetImage?: string;
  targetImageAlt?: string;
};

interface DashboardProps {
  videos: AiVideoRecord[];
}

const statusCopy: Record<VideoStatus, { label: string; tone: string }> = {
  ready: { label: 'Ready to preview', tone: 'bg-emerald-50 text-emerald-700 ring-emerald-100' },
  generating: { label: 'Rendering now', tone: 'bg-indigo-50 text-indigo-700 ring-indigo-100' },
  queued: { label: 'Queued', tone: 'bg-amber-50 text-amber-700 ring-amber-100' },
  expired: { label: 'Preview unavailable', tone: 'bg-slate-50 text-slate-500 ring-slate-100' },
};

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm uppercase tracking-[0.2em] text-indigo-500">{eyebrow}</p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-3xl font-semibold text-slate-900">{title}</h1>
        <Link
          href="/creatorportal/ai-video/generate"
          className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
        >
          <Sparkles className="mr-2 h-4 w-4 text-indigo-500" />
          Generate New Video
        </Link>
      </div>
      <p className="text-base text-slate-600">{description}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: VideoStatus }) {
  const current = statusCopy[status];
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${current.tone}`}>
      {status === 'ready' && <PlayCircle className="h-3.5 w-3.5" />}
      {status === 'generating' && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
      {status === 'queued' && <CalendarClock className="h-3.5 w-3.5" />}
      {status === 'expired' && <ShieldCheck className="h-3.5 w-3.5" />}
      {current.label}
    </span>
  );
}

interface VideoCardProps {
  video: AiVideoRecord;
  onPreview: (video: AiVideoRecord) => void;
}

function VideoCard({ video, onPreview }: VideoCardProps) {
  const [showFullPrompt, setShowFullPrompt] = useState(false);
  const [showReferenceAssets, setShowReferenceAssets] = useState(false);
  const isExpired = video.status === 'expired';
  const isGenerating = video.status === 'generating';
  const canPreview = Boolean(video.videoUrl && video.status === 'ready');

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm ring-1 ring-transparent transition hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">{video.brand}</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-900">{video.title}</h3>
          <p className="text-sm text-slate-500">{video.campaign}</p>
        </div>
        <StatusBadge status={video.status} />
      </div>

      <div className="grid gap-4 md:grid-cols-[300px_1fr]">
        <div className="relative overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
          {isExpired ? (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3 px-4 py-10 text-center">
              <div className="flex h-28 w-20 items-center justify-center rounded-lg bg-slate-100 text-slate-300">
                <Video className="h-10 w-10" />
              </div>
              <p className="text-sm font-medium text-slate-600">Preview no longer available</p>
              <p className="text-xs text-slate-500">Regenerate to unlock another 7-day window.</p>
            </div>
          ) : isGenerating ? (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3 px-4 py-10 text-center">
              <div className="flex h-28 w-20 items-center justify-center rounded-lg bg-indigo-50 text-indigo-500">
                <RefreshCw className="h-10 w-10 animate-spin" />
              </div>
              <p className="text-sm font-medium text-slate-600">Rendering in progress</p>
              <p className="text-xs text-slate-500">We will surface a thumbnail once the render is ready.</p>
            </div>
          ) : (
            <>
              {video.thumbnail ? (
                <Image
                  src={video.thumbnail}
                  alt={video.title}
                  width={320}
                  height={480}
                  className="h-64 w-full object-cover"
                />
              ) : (
                <div className="flex h-64 items-center justify-center bg-slate-900 text-white">
                  <Video className="h-16 w-16 opacity-60" />
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 opacity-0 transition hover:opacity-100">
                {canPreview ? (
                  <button
                    onClick={() => onPreview(video)}
                    className="inline-flex items-center rounded-full bg-white/95 px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg"
                  >
                    <PlayCircle className="mr-2 h-4 w-4 text-indigo-500" />
                    Preview Video
                  </button>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-slate-600">
                    <RefreshCw className="mr-2 h-4 w-4 text-indigo-500 animate-spin" />
                    Processing Render
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Generated</p>
            <p className="mt-1 text-base font-semibold text-slate-900">
              {new Date(video.createdAt).toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
              })}
            </p>
            <p className="text-sm text-slate-500">
              Duration {video.duration} · Format {video.format}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Download window</p>
            <p className="mt-1 text-base font-semibold text-slate-900">
              {new Date(video.expiresAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </p>
            <p className="text-sm text-slate-500">Videos are archived after 7 days</p>
          </div>
          <div className="rounded-xl border border-slate-100 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Creative prompt</p>
            <div className="mt-2 flex items-start gap-2 text-sm text-slate-700">
              <FileText className="mt-0.5 h-4 w-4 text-indigo-500" />
              <span>{video.promptPreview}</span>
            </div>
            <button
              type="button"
              onClick={() => setShowFullPrompt((prev) => !prev)}
              className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              {showFullPrompt ? 'Hide full prompt' : 'View full prompt'}
              <ChevronDown
                className={`h-3.5 w-3.5 transition ${showFullPrompt ? 'rotate-180' : ''}`}
              />
            </button>
            {showFullPrompt && (
              <p className="mt-3 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-600">
                {video.fullPrompt}
              </p>
            )}
          </div>
          <div
            className={`rounded-xl border border-slate-100 p-4 transition ${showReferenceAssets ? 'bg-slate-50/70' : ''}`}
            role="button"
            tabIndex={0}
            onClick={() => setShowReferenceAssets((prev) => !prev)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setShowReferenceAssets((prev) => !prev);
              }
            }}
          >
            <p className="text-xs uppercase tracking-wide text-slate-500">Uploaded references</p>
            <div className="mt-2 flex items-start gap-2 text-sm text-slate-700">
              <Mic className="mt-0.5 h-4 w-4 text-indigo-500" />
              <div>
                <p className="font-semibold text-slate-900">Voice upload</p>
                <p className="text-xs text-slate-500">{video.targetVoice}</p>
              </div>
            </div>
            <div className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-indigo-600">
              {showReferenceAssets ? 'Hide voice & image' : 'View voice & image'}
              <ChevronDown className={`h-3.5 w-3.5 transition ${showReferenceAssets ? 'rotate-180' : ''}`} />
            </div>
            {showReferenceAssets && (
              <div className="mt-4 space-y-3">
                <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-600">
                  <Mic className="h-4 w-4 text-indigo-500" />
                  <div>
                    <p className="font-semibold text-slate-900">Voice upload</p>
                    <p className="text-xs text-slate-500">{video.targetVoice}</p>
                    {video.targetVoiceNotes ? (
                      <p className="text-xs text-slate-500">{video.targetVoiceNotes}</p>
                    ) : (
                      <p className="text-xs text-slate-500">Uploaded voice clone</p>
                    )}
                  </div>
                </div>
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                  {video.targetImage ? (
                    <Image
                      src={video.targetImage}
                      alt={video.targetImageAlt ?? `${video.title} reference image`}
                      width={320}
                      height={180}
                      className="h-32 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-32 items-center justify-center bg-slate-100 text-slate-400">
                      <ImageIcon className="h-8 w-8" />
                    </div>
                  )}
                  <p className="px-3 py-2 text-xs text-slate-500">
                    {video.targetImageAlt ?? 'Reference image for styling'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-dashed border-slate-200 pt-4 text-xs text-slate-500">
        <span>ID #{video.id}</span>
        <span>•</span>
        <span>{video.status === 'expired' ? 'Regenerate required' : 'Share link valid for teammates'}</span>
      </div>
    </div>
  );
}

type PreviewModalProps = {
  video: AiVideoRecord;
  onClose: () => void;
};

function PreviewModal({ video, onClose }: PreviewModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.currentTime = 0;
    el.play().catch(() => setIsPlaying(false));
  }, [video]);

  const togglePlayback = () => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      el.play();
      setIsPlaying(true);
    } else {
      el.pause();
      setIsPlaying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-slate-900/80" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl rounded-3xl bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Previewing</p>
            <h3 className="text-xl font-semibold text-slate-900">{video.title}</h3>
            <p className="text-sm text-slate-500">{video.brand}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-slate-200 p-2 text-slate-500 hover:text-slate-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100 bg-slate-900">
          <video
            ref={videoRef}
            src={video.videoUrl}
            poster={video.thumbnail}
            playsInline
            className="aspect-[9/16] w-full max-h-[65vh] object-contain"
          />
          <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/80 px-4 py-3 text-white">
            <button
              onClick={togglePlayback}
              className="inline-flex items-center gap-2 rounded-full border border-white/30 px-4 py-1 text-sm font-medium"
            >
              {isPlaying ? (
                <>
                  <Pause className="h-4 w-4" /> Pause
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" /> Play
                </>
              )}
            </button>
            <a
              href={video.videoUrl}
              download
              className="inline-flex items-center gap-2 rounded-full border border-white/30 px-4 py-1 text-sm font-medium"
            >
              <Download className="h-4 w-4" />
              Download
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AiVideoDashboard({ videos }: DashboardProps) {
  const [preview, setPreview] = useState<AiVideoRecord | null>(null);

  const totals = useMemo(
    () => ({
      generated: videos.length,
      active: videos.filter((video) => video.status !== 'expired').length,
      expiringSoon: videos.filter((video) => video.status === 'ready').length,
    }),
    [videos],
  );

  return (
    <div className="space-y-10 py-8">
      <SectionHeading
        eyebrow="AI production suite"
        title="AI Video Library"
        description="Replay every automatically generated cut, keep tabs on render states, and know exactly when to reissue briefs before the storage window closes."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Videos generated</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{totals.generated}</p>
          <p className="text-sm text-slate-500">Includes all variants produced in the last 30 days.</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Active previews</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-600">{totals.active}</p>
          <p className="text-sm text-slate-500">Downloadable before auto-archival.</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Expiring soon</p>
          <p className="mt-2 text-3xl font-semibold text-amber-500">{totals.expiringSoon}</p>
          <p className="text-sm text-slate-500">Generate handoff links now.</p>
        </div>
      </div>

      <div className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-white p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-indigo-500">Retention policy</p>
            <h2 className="text-xl font-semibold text-slate-900">Preview-free within seven days</h2>
            <p className="mt-1 text-sm text-slate-600">
              AI ads stay hot-loaded for one week. After that we archive the heavy assets to control hosting costs.
              Re-run the brief anytime to mint a new copy.
            </p>
          </div>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-full border border-indigo-200 px-5 py-2 text-sm font-semibold text-indigo-700 shadow-sm transition hover:border-indigo-500 hover:text-indigo-900"
          >
            Talk to support
          </Link>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Video queue</p>
          <button className="inline-flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-800">
            Refresh statuses
            <RefreshCw className="ml-2 h-4 w-4" />
          </button>
        </div>
        <div className="space-y-6">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} onPreview={setPreview} />
          ))}
        </div>
      </div>

      {preview && preview.videoUrl && (
        <PreviewModal video={preview} onClose={() => setPreview(null)} />
      )}
    </div>
  );
}
