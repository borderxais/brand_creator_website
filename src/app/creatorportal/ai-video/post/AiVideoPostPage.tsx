'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Info,
  RefreshCw,
  Upload,
  X,
} from 'lucide-react';
import { AiVideoRecord, TikTokBindingInfo } from '../types';

type CreatorInfoData = {
  creator_avatar_url?: string;
  creator_username?: string;
  creator_nickname?: string;
  privacy_level_options?: string[];
  comment_disabled?: boolean;
  duet_disabled?: boolean;
  stitch_disabled?: boolean;
  max_video_post_duration_sec?: number;
  creator_can_post?: boolean;
  can_post?: boolean;
  creator_can_publish?: boolean;
  can_publish?: boolean;
};

type CreatorInfoResponse = {
  data?: CreatorInfoData;
  error?: { code?: string; message?: string; log_id?: string };
};

type UploadStatus = 'uploading' | 'checking' | 'success' | 'error';

type Props = {
  videos: AiVideoRecord[];
  tikTokBinding: TikTokBindingInfo | null;
  uploadEndpoint: string;
  statusEndpoint: string;
};

const durationFormatter = (value: number | null | undefined) => {
  if (!value && value !== 0) return '--';
  const minutes = Math.floor(value / 60);
  const seconds = Math.round(value % 60);
  return minutes ? `${minutes}m ${seconds}s` : `${seconds}s`;
};

const statusBadge = (status?: UploadStatus) => {
  if (!status) return null;
  if (status === 'uploading' || status === 'checking') {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
        <span className="h-2 w-2 animate-pulse rounded-full bg-indigo-500" />
        {status === 'uploading' ? 'Uploading' : 'Checking'}
      </span>
    );
  }
  if (status === 'success') {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
        <CheckCircle className="h-3.5 w-3.5" />
        Published
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
      <X className="h-3.5 w-3.5" />
      Failed
    </span>
  );
};

export default function AiVideoPostPage({ videos, tikTokBinding, uploadEndpoint, statusEndpoint }: Props) {
  const [creatorInfo, setCreatorInfo] = useState<CreatorInfoResponse | null>(null);
  const [creatorInfoStatus, setCreatorInfoStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [creatorInfoMessage, setCreatorInfoMessage] = useState<string | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [uploadStatuses, setUploadStatuses] = useState<Record<string, UploadStatus>>({});
  const [uploadStatusDetails, setUploadStatusDetails] = useState<Record<string, string>>({});
  const [publishIds, setPublishIds] = useState<Record<string, string>>({});
  const [videoDurations, setVideoDurations] = useState<Record<string, number | null>>({});
  const [isUploading, setIsUploading] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const hasTikTokBinding = Boolean(tikTokBinding);
  const tikTokAccessToken = tikTokBinding?.accessToken;

  const creatorData = creatorInfo?.data;
  const creatorNickname =
    creatorData?.creator_nickname || creatorData?.creator_username || tikTokBinding?.displayName;
  const maxDuration = creatorData?.max_video_post_duration_sec;
  const commentSetting = creatorData ? (creatorData.comment_disabled ? 'Disabled' : 'Enabled') : 'Unknown';
  const duetSetting = creatorData ? (creatorData.duet_disabled ? 'Disabled' : 'Enabled') : 'Unknown';
  const stitchSetting = creatorData ? (creatorData.stitch_disabled ? 'Disabled' : 'Enabled') : 'Unknown';
  const canPostNow = useMemo(() => {
    const flags = [
      creatorData?.creator_can_post,
      creatorData?.can_post,
      creatorData?.creator_can_publish,
      creatorData?.can_publish,
    ];
    if (flags.some((flag) => flag === false)) {
      return false;
    }
    if (flags.some((flag) => flag === true)) {
      return true;
    }
    return true;
  }, [creatorData]);

  useEffect(() => {
    if (!tikTokAccessToken) return;
    let isMounted = true;
    const loadCreatorInfo = async () => {
      setCreatorInfoStatus('loading');
      setCreatorInfoMessage(null);
      try {
        const response = await fetch('/api/tiktok/creator-info', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_token: tikTokAccessToken }),
        });
        const payload = (await response.json().catch(() => null)) as CreatorInfoResponse | null;
        if (!response.ok || !payload) {
          throw new Error(payload?.error?.message || 'Unable to load creator info.');
        }
        if (payload?.error?.code && payload.error.code !== 'ok') {
          throw new Error(payload.error.message || 'TikTok creator info error.');
        }
        if (isMounted) {
          setCreatorInfo(payload);
          setCreatorInfoStatus('success');
        }
      } catch (error) {
        if (isMounted) {
          setCreatorInfoStatus('error');
          setCreatorInfoMessage(error instanceof Error ? error.message : 'Unable to load creator info.');
        }
      }
    };

    loadCreatorInfo();
    return () => {
      isMounted = false;
    };
  }, [tikTokAccessToken]);

  useEffect(() => {
    let cancelled = false;
    const loadDurations = async () => {
      const nextDurations: Record<string, number | null> = {};
      for (const video of videos) {
        const videoUrl = video.videoUrl;
        if (!videoUrl) continue;
        try {
          const duration = await new Promise<number>((resolve, reject) => {
            const el = document.createElement('video');
            el.preload = 'metadata';
            el.crossOrigin = 'anonymous';
            el.onloadedmetadata = () => resolve(el.duration);
            el.onerror = () => reject(new Error('Unable to load metadata'));
            el.src = videoUrl;
          });
          nextDurations[video.id] = duration;
        } catch {
          nextDurations[video.id] = null;
        }

        if (cancelled) return;
        setVideoDurations((prev) => ({ ...prev, ...nextDurations }));
      }
    };

    loadDurations();
    return () => {
      cancelled = true;
    };
  }, [videos]);

  const durationViolations = useMemo(() => {
    if (!maxDuration) return [];
    return videos.filter((video) => {
      const duration = videoDurations[video.id];
      return typeof duration === 'number' && duration > maxDuration;
    });
  }, [maxDuration, videoDurations, videos]);

  const hasUnknownDurations = useMemo(() => {
    if (!maxDuration) return false;
    return videos.some((video) => video.videoUrl && videoDurations[video.id] == null);
  }, [maxDuration, videoDurations, videos]);

  const canSubmit =
    hasTikTokBinding &&
    Boolean(tikTokAccessToken) &&
    creatorInfoStatus === 'success' &&
    canPostNow &&
    !durationViolations.length &&
    !hasUnknownDurations &&
    videos.length > 0;

  const handleUpload = async () => {
    setUploadMessage(null);
    if (!videos.length) {
      setUploadMessage('No videos selected. Return to the AI video queue to choose clips.');
      return;
    }
    if (!tikTokAccessToken) {
      setUploadMessage('TikTok account is connected but missing an access token. Please reconnect TikTok.');
      return;
    }
    if (creatorInfoStatus !== 'success') {
      setUploadMessage('Please refresh creator info before posting.');
      return;
    }
    if (!canPostNow) {
      setUploadMessage('TikTok is not accepting new posts for this creator right now. Try again later.');
      return;
    }
    if (maxDuration && hasUnknownDurations) {
      setUploadMessage('Unable to verify video duration. Refresh the page and try again.');
      return;
    }
    if (durationViolations.length) {
      setUploadMessage(
        `One or more videos exceed the max duration of ${maxDuration}s. Remove or regenerate those clips.`,
      );
      return;
    }

    setIsUploading(true);
    setUploadStatuses(
      videos.reduce((acc, video) => ({ ...acc, [video.id]: 'uploading' as const }), {}),
    );
    setUploadStatusDetails({});
    setPublishIds({});

    try {
      const response = await fetch(uploadEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_token: tikTokAccessToken,
          videos: videos.map((video) => ({
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
          videos.reduce((acc, video) => ({ ...acc, [video.id]: 'error' as const }), {}),
        );
        return;
      }

      const results = Array.isArray(payload.results) ? payload.results : [];
      const nextStatuses: Record<string, UploadStatus> = {};
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
    } catch (error) {
      console.error('TikTok upload error', error);
      setUploadMessage('Unexpected error uploading to TikTok.');
      setUploadStatuses(
        videos.reduce((acc, video) => ({ ...acc, [video.id]: 'error' as const }), {}),
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
    if (!tikTokAccessToken) return;
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
            access_token: tikTokAccessToken,
            publish_ids: publishIdList,
          }),
        });
        const payload = await response.json().catch(() => ({}));
        const results = Array.isArray(payload.results) ? payload.results : [];

        const nextStatuses: Record<string, UploadStatus> = {};
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
  }, [uploadStatuses, publishIds, tikTokAccessToken, statusEndpoint]);

  const refreshCreatorInfo = async () => {
    if (!tikTokAccessToken) return;
    setCreatorInfoStatus('loading');
    setCreatorInfoMessage(null);
    try {
      const response = await fetch('/api/tiktok/creator-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: tikTokAccessToken }),
      });
      const payload = (await response.json().catch(() => null)) as CreatorInfoResponse | null;
      if (!response.ok || !payload) {
        throw new Error(payload?.error?.message || 'Unable to refresh creator info.');
      }
      if (payload?.error?.code && payload.error.code !== 'ok') {
        throw new Error(payload.error.message || 'TikTok creator info error.');
      }
      setCreatorInfo(payload);
      setCreatorInfoStatus('success');
    } catch (error) {
      setCreatorInfoStatus('error');
      setCreatorInfoMessage(error instanceof Error ? error.message : 'Unable to refresh creator info.');
    }
  };

  return (
    <div className="space-y-8 py-8">
      <div className="flex flex-col gap-4">
        <Link
          href="/creatorportal/ai-video"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to AI video queue
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-indigo-500">Post to TikTok</p>
            <h1 className="text-3xl font-semibold text-slate-900">Confirm upload settings</h1>
            <p className="text-sm text-slate-600">
              Review creator limits and upload settings before publishing to TikTok.
            </p>
          </div>
          {hasTikTokBinding && (
            <button
              type="button"
              onClick={refreshCreatorInfo}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:border-slate-300"
              disabled={creatorInfoStatus === 'loading'}
            >
              <RefreshCw className={`h-4 w-4 ${creatorInfoStatus === 'loading' ? 'animate-spin' : ''}`} />
              Refresh creator info
            </button>
          )}
        </div>
      </div>

      {!videos.length && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-10 text-center text-sm text-slate-500">
          No videos selected for posting. Return to the AI video queue to choose clips.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Creator info</p>
                <div className="flex items-center gap-3 text-sm font-semibold text-slate-900">
                  {creatorData?.creator_avatar_url ? (
                    <img
                      src={creatorData.creator_avatar_url}
                      alt={creatorNickname || 'TikTok creator avatar'}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                      {creatorNickname?.[0]?.toUpperCase() ?? 'T'}
                    </span>
                  )}
                  <span>
                    {creatorNickname ? `Posting as ${creatorNickname}` : 'TikTok creator unavailable'}
                  </span>
                </div>
                {creatorData?.creator_username && (
                  <p className="text-xs text-slate-500">@{creatorData.creator_username}</p>
                )}
              </div>
              <div className="rounded-full bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-500">
                {creatorInfoStatus === 'loading' && 'Fetching latest creator info...'}
                {creatorInfoStatus === 'success' && 'Creator info synced'}
                {creatorInfoStatus === 'error' && 'Creator info unavailable'}
              </div>
            </div>

            {creatorInfoMessage && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">
                <AlertTriangle className="mt-0.5 h-4 w-4" />
                <span>{creatorInfoMessage}</span>
              </div>
            )}

            {!canPostNow && creatorInfoStatus === 'success' && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-700">
                <AlertTriangle className="mt-0.5 h-4 w-4" />
                <span>TikTok is limiting new posts for this creator right now. Try again later.</span>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Upload settings</p>
                <h2 className="text-lg font-semibold text-slate-900">TikTok publish configuration</h2>
              </div>
              <div className="text-xs font-semibold text-slate-500">
                Privacy: <span className="text-slate-900">Public to everyone</span>
              </div>
            </div>
            <div className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Creator limits</p>
                <p className="mt-1 font-semibold text-slate-900">
                  Max duration {maxDuration ? `${maxDuration}s` : 'Unknown'}
                </p>
                <p className="text-xs text-slate-500">
                  {maxDuration ? 'Validated against TikTok creator settings.' : 'Refresh creator info to validate.'}
                </p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Brand flags</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">Brand content: No</p>
                <p className="text-sm text-slate-600">Brand organic: Yes</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Engagement settings</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  Comments {commentSetting}
                </p>
                <p className="text-sm text-slate-600">
                  Duet {duetSetting} / Stitch {stitchSetting}
                </p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Privacy options</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {creatorData?.privacy_level_options?.length
                    ? creatorData.privacy_level_options.join(', ')
                    : 'Not loaded'}
                </p>
                <p className="text-xs text-slate-500">Must match creator info from TikTok.</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Selected videos</p>
                <h2 className="text-lg font-semibold text-slate-900">Clips ready to publish</h2>
              </div>
              <p className="text-sm font-semibold text-slate-500">{videos.length} total</p>
            </div>
            <div className="mt-4 space-y-3">
              {videos.map((video) => {
                const duration = videoDurations[video.id];
                const exceedsMax = maxDuration && typeof duration === 'number' && duration > maxDuration;
                return (
                  <div
                    key={video.id}
                    className="flex flex-col gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      {video.thumbnailUrl ? (
                        <img
                          src={video.thumbnailUrl}
                          alt={`Thumbnail for ${video.id}`}
                          className="h-16 w-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-16 w-12 items-center justify-center rounded-lg bg-slate-200 text-xs text-slate-500">
                          {video.id.slice(0, 3)}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {video.tags?.[0] ? `AI video - ${video.tags[0]}` : 'AI video upload'}
                        </p>
                        <p className="text-xs text-slate-500">{video.id}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                        Duration {durationFormatter(duration)}
                      </span>
                      {exceedsMax && (
                        <span className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Exceeds limit
                        </span>
                      )}
                      {statusBadge(uploadStatuses[video.id])}
                    </div>
                  </div>
                );
              })}
            </div>

            {(durationViolations.length > 0 || hasUnknownDurations) && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">
                {hasUnknownDurations
                  ? 'Unable to verify video duration. Please refresh and try again.'
                  : `One or more videos exceed the ${maxDuration}s limit.`}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Publish checklist</p>
            <ul className="mt-3 space-y-3 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <Info className="mt-0.5 h-4 w-4 text-indigo-500" />
                Creator info refreshed and nickname confirmed.
              </li>
              <li className="flex items-start gap-2">
                <Info className="mt-0.5 h-4 w-4 text-indigo-500" />
                Video duration validated against TikTok max post length.
              </li>
              <li className="flex items-start gap-2">
                <Info className="mt-0.5 h-4 w-4 text-indigo-500" />
                Privacy set to Public to Everyone.
              </li>
              <li className="flex items-start gap-2">
                <Info className="mt-0.5 h-4 w-4 text-indigo-500" />
                Brand flags confirmed (content: No, organic: Yes).
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Publish action</p>
            <button
              type="button"
              onClick={handleUpload}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
              disabled={!canSubmit || isUploading}
            >
              <Upload className="h-4 w-4" />
              {isUploading ? 'Uploading...' : 'Confirm & post to TikTok'}
            </button>
            {!hasTikTokBinding && (
              <p className="mt-3 text-xs text-slate-500">
                Connect a TikTok account before posting.
              </p>
            )}
            {uploadMessage && (
              <p className="mt-3 text-sm font-medium text-slate-600">{uploadMessage}</p>
            )}
          </div>

          {Boolean(Object.keys(uploadStatuses).length) && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                <Info className="h-4 w-4 text-indigo-500" />
                Upload status
              </div>
              <div className="mt-3 space-y-2 text-sm text-slate-700">
                {Object.entries(uploadStatuses).map(([videoId, status]) => (
                  <div
                    key={videoId}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-xs"
                  >
                    <span className="font-semibold text-slate-900">{videoId}</span>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {status === 'uploading'
                          ? 'Uploading...'
                          : status === 'checking'
                            ? 'Checking TikTok status...'
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
        </div>
      </div>
    </div>
  );
}
