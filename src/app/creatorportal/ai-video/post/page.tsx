import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { buildTikTokBinding, fetchAiVideos } from '../data';
import AiVideoPostPage from './AiVideoPostPage';

export const metadata: Metadata = {
  title: 'Post to TikTok | Cricher AI CreatorHub',
  description: 'Confirm AI video upload settings before publishing to TikTok.',
};

const PYTHON_API_BASE = process.env.CAMPAIGNS_API_URL || 'http://localhost:5000';

type PageProps = {
  searchParams?: Promise<{ ids?: string }>;
};

export default async function PostToTikTokPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? null;

  const resolvedSearchParams = (await searchParams) ?? {};
  const selectedIds = (resolvedSearchParams.ids ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);

  const [videos, tiktokAccount] = await Promise.all([
    fetchAiVideos(userId),
    userId
      ? prisma.tikTokAccount.findUnique({
          where: { user_id: userId },
        })
      : Promise.resolve(null),
  ]);

  const tikTokBinding = await buildTikTokBinding(tiktokAccount);
  const selectedVideos = selectedIds.length
    ? videos.filter((video) => selectedIds.includes(video.id) && video.status === 'ready' && video.videoUrl)
    : [];

  return (
    <AiVideoPostPage
      videos={selectedVideos}
      tikTokBinding={tikTokBinding}
      uploadEndpoint={`${PYTHON_API_BASE}/tiktok/upload-ai-video`}
      statusEndpoint={`${PYTHON_API_BASE}/tiktok/publish-status`}
    />
  );
}
