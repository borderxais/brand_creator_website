'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle, Info, Pause, Play, PlayCircle, RefreshCw, Sparkles, Upload, Video, X } from 'lucide-react';

export type VideoStatus = 'ready' | 'expired';

export type AiVideoRecord = {
  id: string;
  creatorId: string;
  generatedAt: string;
  expiresAt: string;
  videoUrl?: string;
  thumbnailUrl?: string | null;
  tags: string[];
  status: VideoStatus;
};

interface DashboardProps {
  videos: AiVideoRecord[];
  tikTokBinding: TikTokBindingInfo | null;
  uploadEndpoint: string;
  statusEndpoint: string;
}

export type TikTokBindingInfo = {
  displayName?: string;
  handle?: string;
  openId?: string;
  avatarUrl?: string | null;
  accessToken?: string;
};

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

const statusTokens: Record<VideoStatus, { label: string; tone: string }> = {
  ready: { label: 'Ready to download', tone: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  expired: { label: 'Expired', tone: 'bg-slate-100 text-slate-500 ring-slate-200' },
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
  const statusToken = statusTokens[video.status];

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusToken.tone}`}
        >
          {statusToken.label}
        </span>
        <div className="flex flex-wrap gap-2">
          {video.tags.length ? (
            video.tags.map((tag) => (
              <span
                key={`${video.id}-${tag}`}
                className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500"
              >
                #{tag}
              </span>
            ))
          ) : (
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-slate-300">Untagged</span>
          )}
        </div>
      </div>

      <div className="relative aspect-[9/16] w-full overflow-hidden rounded-xl bg-slate-900">
        {video.thumbnailUrl ? (
          <img
            src={video.thumbnailUrl}
            alt={`Thumbnail for video ${video.id}`}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-white/50">
            <Video className="h-10 w-10" />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60">
          {canSelect && video.videoUrl ? (
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
              {video.status === 'expired' ? (
                <>
                  <X className="h-3.5 w-3.5 text-rose-500" />
                  Expired
                </>
              ) : (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-500" />
                  Preparing
                </>
              )}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2 text-sm text-slate-600">
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Generated</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {generatedFormatter.format(new Date(video.generatedAt))}
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
  const statusToken = statusTokens[video.status];

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
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Video tags</p>
            <div className="flex flex-wrap gap-2">
              {video.tags.length ? (
                video.tags.map((tag) => (
                  <span key={`${video.id}-modal-tag-${tag}`} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
                    #{tag}
                  </span>
                ))
              ) : (
                <span className="text-xs font-medium uppercase tracking-[0.2em] text-slate-300">Untagged</span>
              )}
            </div>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusToken.tone}`}
            >
              {statusToken.label}
            </span>
            <div className="text-sm text-slate-500">
              <p>Generated {generatedFormatter.format(new Date(video.generatedAt))}</p>
              <p>Download window ends {downloadWindowFormatter.format(new Date(video.expiresAt))}</p>
            </div>
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

export default function AiVideoDashboard({ videos, tikTokBinding, uploadEndpoint, statusEndpoint }: DashboardProps) {
  const [preview, setPreview] = useState<AiVideoRecord | null>(null);
  const [selectedVideoIds, setSelectedVideoIds] = useState<string[]>([]);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [uploadStatuses, setUploadStatuses] = useState<
    Record<string, 'uploading' | 'checking' | 'success' | 'error'>
  >({});
  const [uploadStatusDetails, setUploadStatusDetails] = useState<Record<string, string>>({});
  const [publishIds, setPublishIds] = useState<Record<string, string>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [isRedirectingToTikTok, setIsRedirectingToTikTok] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

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

  const handleUpload = async () => {
    const selectedReadyVideos = videos.filter(
      (video) => selectedVideoIds.includes(video.id) && readyVideoIds.includes(video.id) && video.videoUrl,
    );

    if (!selectedReadyVideos.length) {
      setUploadMessage('Choose at least one ready video to upload to TikTok.');
      return;
    }

    if (!tikTokBinding?.accessToken) {
      setUploadMessage('TikTok account is connected but missing an access token. Please reconnect TikTok.');
      return;
    }

    setIsUploading(true);
    setUploadMessage(null);
    setUploadStatusDetails({});
    setPublishIds({});
    setUploadStatuses(
      selectedReadyVideos.reduce(
        (acc, video) => ({ ...acc, [video.id]: 'uploading' as const }),
        {},
      ),
    );

    try {
      const response = await fetch(uploadEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_token: tikTokBinding.accessToken,
          videos: selectedReadyVideos.map((video) => ({
            id: video.id,
            videoUrl: video.videoUrl,
            title: video.tags?.[0] ? `AI video - ${video.tags[0]}` : 'AI video upload',
          })),
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setUploadMessage(payload.error || 'TikTok upload failed.');
        setUploadStatuses(
          selectedReadyVideos.reduce(
            (acc, video) => ({ ...acc, [video.id]: 'error' as const }),
            {},
          ),
        );
        return;
      }

      const results = Array.isArray(payload.results) ? payload.results : [];
      const nextStatuses: Record<string, 'uploading' | 'checking' | 'success' | 'error'> = {};
      const nextDetails: Record<string, string> = {};
      const nextPublishIds: Record<string, string> = {};

      results.forEach((result: any) => {
        if (!result?.id) return;
        if (result.status !== 'ok') {
          nextStatuses[result.id] = 'error';
          nextDetails[result.id] = result.error?.message || 'Upload failed';
          return;
        }

        if (result.publish_id) {
          nextPublishIds[result.id] = result.publish_id;
        }
        const publishStatus = result.publish_status?.data?.status;
        if (typeof publishStatus === 'string') {
          const normalized = publishStatus.toUpperCase();
          if (normalized === 'SUCCESS' || normalized === 'PUBLISHED' || normalized === 'COMPLETED') {
            nextStatuses[result.id] = 'success';
          } else if (normalized === 'FAILED') {
            nextStatuses[result.id] = 'error';
          } else {
            nextStatuses[result.id] = 'checking';
          }
          nextDetails[result.id] = publishStatus;
        } else {
          nextStatuses[result.id] = 'checking';
          nextDetails[result.id] = 'Checking TikTok publish status';
        }
      });

      setUploadStatuses((prev) => ({ ...prev, ...nextStatuses }));
      setUploadStatusDetails((prev) => ({ ...prev, ...nextDetails }));
      setPublishIds((prev) => ({ ...prev, ...nextPublishIds }));

      const successes = Object.entries(nextStatuses)
        .filter(([, status]) => status === 'success')
        .map(([id]) => id);
      const failures = Object.entries(nextStatuses)
        .filter(([, status]) => status === 'error')
        .map(([id]) => id);
      const pending = Object.entries(nextStatuses)
        .filter(([, status]) => status === 'checking' || status === 'uploading')
        .map(([id]) => id);

      if (successes.length && !failures.length) {
        setUploadMessage(`Uploaded to TikTok: ${successes.join(', ')}`);
        setToast('Your TikTok upload is live! 🎉');
      } else if (successes.length && failures.length) {
        setUploadMessage(
          `Uploaded: ${successes.join(', ')}. Failed: ${failures.join(', ')}. See console for details.`,
        );
      } else if (pending.length && !successes.length && !failures.length) {
        setUploadMessage('Upload started. Checking TikTok status…');
      } else {
        setUploadMessage('Upload failed for all selected videos.');
      }
    } catch (error) {
      console.error('TikTok upload error', error);
      setUploadMessage('Unexpected error uploading to TikTok.');
      setUploadStatuses(
        selectedReadyVideos.reduce(
          (acc, video) => ({ ...acc, [video.id]: 'error' as const }),
          {},
        ),
      );
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!tikTokBinding?.accessToken) return;
    const pending = Object.entries(uploadStatuses)
      .filter(([, status]) => status === 'checking')
      .map(([videoId]) => ({ videoId, publishId: publishIds[videoId] }))
      .filter((item) => Boolean(item.publishId));

    if (!pending.length) {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      return;
    }

    const poll = async () => {
      try {
        const publishIdList = pending.map((p) => p.publishId);
        const response = await fetch(statusEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            access_token: tikTokBinding.accessToken,
            publish_ids: publishIdList,
          }),
        });
        const payload = await response.json().catch(() => ({}));
        const results = Array.isArray(payload.results) ? payload.results : [];

        const nextStatuses: Record<string, 'checking' | 'success' | 'error'> = {};
        const nextDetails: Record<string, string> = {};

        results.forEach((result: any) => {
          const publishId = result.publish_id;
          if (!publishId) return;
          const videoEntry = pending.find((p) => p.publishId === publishId);
          if (!videoEntry) return;
          const videoId = videoEntry.videoId;
          if (result.status !== 'ok') {
            nextStatuses[videoId] = 'error';
            nextDetails[videoId] = result.error?.message || 'Status check failed';
            return;
          }
          const status = result.payload?.data?.status;
          const failReason = result.payload?.data?.fail_reason;
          const normalized = typeof status === 'string' ? status.toUpperCase() : '';
          if (normalized === 'PUBLISH_COMPLETE' || normalized === 'SUCCESS' || normalized === 'PUBLISHED') {
            nextStatuses[videoId] = 'success';
            nextDetails[videoId] = status;
            setToast('Your TikTok upload is live! 🎉');
          } else if (normalized === 'FAILED') {
            nextStatuses[videoId] = 'error';
            nextDetails[videoId] = failReason || 'Publish failed';
          } else {
            nextStatuses[videoId] = 'checking';
            nextDetails[videoId] = status || 'Checking TikTok publish status';
          }
        });

        if (Object.keys(nextStatuses).length) {
          setUploadStatuses((prev) => ({ ...prev, ...nextStatuses }));
          setUploadStatusDetails((prev) => ({ ...prev, ...nextDetails }));
        }
      } catch (error) {
        console.error('Polling TikTok status failed', error);
      }
    };

    if (!pollingRef.current) {
      poll();
      pollingRef.current = setInterval(poll, 5000);
    }
  }, [uploadStatuses, publishIds, tikTokBinding?.accessToken, statusEndpoint]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const redirectToTikTokAuth = () => {
    setIsRedirectingToTikTok(true);
    window.location.href = "/api/auth/tiktok/authorize";
  };

  const hasTikTokBinding = Boolean(tikTokBinding);
  const tikTokName = tikTokBinding?.displayName || tikTokBinding?.handle || tikTokBinding?.openId;

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
        <div className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">TikTok account status</p>
            {hasTikTokBinding ? (
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                {tikTokBinding?.avatarUrl ? (
                  <img
                    src={tikTokBinding.avatarUrl}
                    alt={tikTokName || 'TikTok account avatar'}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    {tikTokName?.[0]?.toUpperCase() ?? 'T'}
                  </span>
                )}
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                Connected {tikTokName ? `as ${tikTokName}` : ''}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-700">
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
                Not connected
              </div>
            )}
          </div>
          {!hasTikTokBinding && (
            <button
              type="button"
              onClick={redirectToTikTokAuth}
              className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700"
              disabled={isRedirectingToTikTok}
            >
              {isRedirectingToTikTok ? 'Redirecting…' : 'Connect TikTok'}
            </button>
          )}
        </div>

        {hasTikTokBinding && (
          <>
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
            {Boolean(Object.keys(uploadStatuses).length) && (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  <Info className="h-4 w-4 text-indigo-500" />
                  Upload status
                </div>
                <div className="mt-2 space-y-2 text-sm text-slate-700">
                  {Object.entries(uploadStatuses).map(([videoId, status]) => (
                    <div
                      key={videoId}
                      className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-xs"
                    >
                      <div className="flex items-center gap-2">
                        {status === 'uploading' || status === 'checking' ? (
                          <span className="inline-flex h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-500" />
                        ) : status === 'success' ? (
                          <CheckCircle className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <X className="h-4 w-4 text-rose-500" />
                        )}
                        <span className="font-semibold text-slate-900">{videoId}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {status === 'uploading'
                            ? 'Uploading…'
                            : status === 'checking'
                              ? 'Checking TikTok status…'
                              : status === 'success'
                                ? 'Published'
                                : 'Failed'}
                        </p>
                        {uploadStatusDetails[videoId] ? (
                          <p className="text-xs text-slate-500">{uploadStatusDetails[videoId]}</p>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
        {!hasTikTokBinding && (
          <p className="mt-3 text-sm text-slate-600">
            Connect your TikTok account to enable direct uploads and keep campaign deliverables in sync.
          </p>
        )}
      </div>

      {videos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-10 text-center text-sm text-slate-500">
          No AI videos yet. Generate a new brief to see your clips here.
        </div>
      ) : (
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
      )}

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
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-white px-4 py-3 shadow-xl ring-1 ring-indigo-100">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            {toast}
          </div>
          <p className="mt-1 text-xs text-slate-500">Head to TikTok to view your post.</p>
        </div>
      )}
    </div>
  );
}
