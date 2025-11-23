import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import AiVideoDashboard, { AiVideoRecord, TikTokBindingInfo, VideoStatus } from './AiVideoDashboard';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'AI Video Library | BorderX CreatorHub',
  description: 'Review every AI-generated ad spot, track delivery status, and relaunch creative briefs in one place.',
};

const PYTHON_API_BASE = process.env.CAMPAIGNS_API_URL || 'http://localhost:5000';

type AiVideoLibraryItem = {
  id: string;
  creator_id: string;
  generated_time?: string;
  created_at?: string;
  video?: string;
  video_url?: string;
  thumbnail_url?: string;
  tag?: string[] | string;
  tags?: string[];
};

export default async function AiVideoPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? null;

  const [videos, tiktokAccount] = await Promise.all([
    fetchAiVideos(userId),
    userId
      ? prisma.tikTokAccount.findUnique({
          where: { user_id: userId },
        })
      : Promise.resolve(null),
  ]);

  const tikTokBinding: TikTokBindingInfo | null = tiktokAccount
    ? {
        displayName: tiktokAccount.display_name ?? undefined,
        handle: tiktokAccount.handle ?? undefined,
        openId: tiktokAccount.tiktok_open_id,
      }
    : null;

  return <AiVideoDashboard videos={videos} tikTokBinding={tikTokBinding} />;
}

async function fetchAiVideos(userId: string | null): Promise<AiVideoRecord[]> {
  try {
    const baseUrl = PYTHON_API_BASE;
    const url = new URL('/ai-videos/library', baseUrl);
    if (userId) {
      url.searchParams.set('creator_id', userId);
    }

    const response = await fetch(url.toString(), { cache: 'no-store' });
    if (response.status === 404) {
      return [];
    }
    if (!response.ok) {
      console.error('Failed to fetch AI videos', await response.text());
      return [];
    }

    const responseBody = await response.clone().text();
    console.log('AI video library response body', responseBody);
    const payload: AiVideoLibraryItem[] = await response.json();
    console.log('AI video library payload', payload);
    return payload.map(mapToRecord);
  } catch (error) {
    console.error('Unable to load AI videos', error);
    return [];
  }
}

function mapToRecord(item: AiVideoLibraryItem): AiVideoRecord {
  const generatedAt = item.generated_time ?? item.created_at ?? new Date().toISOString();
  const expiresAt = new Date(new Date(generatedAt).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const status: VideoStatus = new Date(expiresAt).getTime() < Date.now() ? 'expired' : 'ready';
  const videoUrl = item.video_url ?? item.video;
  const tags = Array.isArray(item.tags)
    ? item.tags
    : Array.isArray(item.tag)
      ? item.tag
      : typeof item.tag === 'string'
        ? item.tag.split(',').map((tag) => tag.trim()).filter(Boolean)
        : [];

  return {
    id: item.id,
    creatorId: item.creator_id,
    generatedAt,
    expiresAt,
    videoUrl,
    thumbnailUrl: item.thumbnail_url,
    tags,
    status,
  };
}
