'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play, PlayCircle, RefreshCw, Sparkles, Upload, Video, X } from 'lucide-react';

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

const generatedFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
});

const downloadWindowFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
});

type VideoPreviewCardProps = {
  video: AiVideoRecord;
  selected: boolean;
  canSelect: boolean;
  onToggleSelect: (videoId: string) => void;
  onPreview: (video: AiVideoRecord) => void;
};

function VideoPreviewCard({
  video,
  selected,
  canSelect,
  onToggleSelect,
  onPreview,
}: VideoPreviewCardProps) {
  const expiresLabel =
    video.status === 'expired'
      ? 'Expired'
      : downloadWindowFormatter.format(new Date(video.expiresAt));

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-slate-900">{video.title}</p>

      <div className="relative aspect-[9/16] w-full overflow-hidden rounded-xl bg-slate-900">
        {video.thumbnail ? (
          <Image
            src={video.thumbnail}
            alt={video.title}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-white/50">
            <Video className="h-10 w-10" />
          </div>
        )}

        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60">
          {canSelect ? (
            <button
              type="button"
              onClick={() => onPreview(video)}
              className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-1 text-sm font-semibold text-slate-900 shadow-lg transition hover:bg-white"
            >
              <PlayCircle className="h-4 w-4 text-indigo-500" />
              Preview
            </button>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-1 text-xs font-semibold text-slate-600">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-500" />
              {video.status === 'expired' ? 'Expired' : 'Preparing'}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2 text-sm text-slate-600">
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Generated</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {generatedFormatter.format(new Date(video.createdAt))}
          </p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Download window</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{expiresLabel}</p>
        </div>
      </div>

      <label
        className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-semibold transition ${
          selected ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600'
        } ${!canSelect ? 'opacity-60' : ''}`}
      >
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          checked={selected}
          onChange={() => {
            if (canSelect) {
              onToggleSelect(video.id);
            }
          }}
          disabled={!canSelect}
        />
        <span>{canSelect ? 'Select for TikTok upload' : 'Available when ready'}</span>
      </label>
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
          <div className="flex flex-wrap items-center justify-center gap-3 bg-slate-900/80 px-4 py-3 text-white">
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
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AiVideoDashboard({ videos }: DashboardProps) {
  const [preview, setPreview] = useState<AiVideoRecord | null>(null);
  const [selectedVideoIds, setSelectedVideoIds] = useState<string[]>([]);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const readyVideoIds = useMemo(
    () => videos.filter((video) => video.status === 'ready' && video.videoUrl).map((video) => video.id),
    [videos],
  );

  const toggleSelect = (videoId: string) => {
    setSelectedVideoIds((prev) =>
      prev.includes(videoId) ? prev.filter((id) => id !== videoId) : [...prev, videoId],
    );
    setUploadMessage(null);
  };

  const handleUpload = () => {
    const selectedReadyVideos = videos.filter(
      (video) => selectedVideoIds.includes(video.id) && readyVideoIds.includes(video.id),
    );

    if (!selectedReadyVideos.length) {
      setUploadMessage('Choose at least one ready video to upload to TikTok.');
      return;
    }

    setIsUploading(true);
    setTimeout(() => {
      const titles = selectedReadyVideos.map((video) => video.title).join(', ');
      setUploadMessage(`Uploaded to TikTok: ${titles}`);
      setIsUploading(false);
    }, 600);
  };

  return (
    <div className="space-y-8 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-indigo-500">TikTok ready</p>
          <h1 className="text-3xl font-semibold text-slate-900">AI Video Queue</h1>
          <p className="text-sm text-slate-600">
            Pick the finished cuts you want to send to TikTok. Each tile only exposes the generation time,
            download window, and a quick preview for rapid approvals.
          </p>
        </div>
        <Link
          href="/creatorportal/ai-video/generate"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
        >
          <Sparkles className="h-4 w-4" />
          Generate new video
        </Link>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={handleUpload}
            className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
            disabled={isUploading}
          >
            <Upload className="h-4 w-4" />
            {isUploading ? 'Uploading…' : 'Upload selected to TikTok'}
          </button>
          <p className="text-sm text-slate-600">
            {selectedVideoIds.length ? `${selectedVideoIds.length} selected` : 'No videos selected'}
          </p>
        </div>
        {uploadMessage && (
          <p className="mt-3 text-sm font-medium text-slate-600">{uploadMessage}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {videos.map((video) => {
          const canSelect = video.status === 'ready' && Boolean(video.videoUrl);
          return (
            <VideoPreviewCard
              key={video.id}
              video={video}
              selected={selectedVideoIds.includes(video.id)}
              canSelect={canSelect}
              onToggleSelect={toggleSelect}
              onPreview={(record) => {
                if (record.videoUrl) {
                  setPreview(record);
                }
              }}
            />
          );
        })}
      </div>

      <div className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-500 p-6 text-white shadow-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-white/70">Need a new cut?</p>
            <h2 className="text-2xl font-semibold">Spin up the next AI edit in under a minute.</h2>
            <p className="mt-2 text-sm text-white/80">
              Drop in a voice, upload a reference image, and the creator workstation will mint a ready-to-preview TikTok asset.
            </p>
          </div>
          <Link
            href="/creatorportal/ai-video/generate"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-indigo-700 shadow-lg transition hover:bg-white/90"
          >
            <Sparkles className="h-4 w-4 text-indigo-500" />
            Generate another video
          </Link>
        </div>
      </div>

      {preview && preview.videoUrl && (
        <PreviewModal video={preview} onClose={() => setPreview(null)} />
      )}
    </div>
  );
}
