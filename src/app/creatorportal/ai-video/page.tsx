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

type TikTokAccountRecord = Awaited<ReturnType<typeof prisma.tikTokAccount.findUnique>>;

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

  const tikTokBinding = await buildTikTokBinding(tiktokAccount);

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

type TikTokUserProfile = {
  displayName?: string;
  avatarUrl?: string;
  username?: string;
  openId?: string;
  followerCount?: number;
};

async function buildTikTokBinding(account: TikTokAccountRecord): Promise<TikTokBindingInfo | null> {
  if (!account) {
    return null;
  }

  const existing: TikTokBindingInfo = {
    displayName: account.display_name ?? undefined,
    handle: account.handle ?? undefined,
    openId: account.tiktok_open_id,
  };

  if (existing.displayName || existing.handle) {
    return existing;
  }

  const profile = await fetchTikTokProfile(account.access_token);
  if (!profile) {
    return existing;
  }

  await prisma.tikTokAccount.update({
    where: { user_id: account.user_id },
    data: {
      display_name: profile.displayName ?? account.display_name,
      handle: profile.username ?? account.handle,
      avatar_url: profile.avatarUrl ?? account.avatar_url,
      follower_count: profile.followerCount ?? account.follower_count,
      last_synced_at: new Date(),
    },
  });

  return {
    displayName: profile.displayName ?? existing.displayName,
    handle: profile.username ?? existing.handle,
    openId: existing.openId,
  };
}

async function fetchTikTokProfile(accessToken?: string): Promise<TikTokUserProfile | null> {
  if (!accessToken) return null;

  try {
    const response = await fetch("https://open.tiktokapis.com/v2/user/info/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: ["open_id", "display_name", "avatar_url", "username", "follower_count"],
      }),
      cache: "no-store",
    });

    const body = await response.json().catch(() => null);
    if (!response.ok) {
      console.error("Failed to fetch TikTok user info on dashboard render", {
        status: response.status,
        body,
      });
      return null;
    }

    const user = body?.data?.user ?? body?.data ?? null;
    if (!user) return null;

    return {
      displayName: user.display_name ?? user.displayName,
      avatarUrl: user.avatar_url ?? user.avatarUrl,
      username: user.username ?? user.handle ?? user.open_id,
      openId: user.open_id ?? user.openId,
      followerCount: user.follower_count ?? user.followerCount,
    };
  } catch (error) {
    console.error("Error fetching TikTok profile on dashboard render", error);
    return null;
  }
}
