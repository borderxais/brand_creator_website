import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import AiVideoDashboard from './AiVideoDashboard';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { buildTikTokBinding, fetchAiVideos, refreshTikTokAccount } from './data';

export const metadata: Metadata = {
  title: 'AI Video Library | Cricher AI CreatorHub',
  description: 'Review every AI-generated ad spot, track delivery status, and relaunch creative briefs in one place.',
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

  const refreshedAccount = await refreshTikTokAccount(tiktokAccount);
  const tikTokBinding = await buildTikTokBinding(refreshedAccount);

  return <AiVideoDashboard videos={videos} tikTokBinding={tikTokBinding} />;
}
