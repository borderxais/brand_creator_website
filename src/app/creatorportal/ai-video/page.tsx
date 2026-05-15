import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AiVideoDashboard from "./AiVideoDashboard";
import { buildTikTokBinding, fetchAiVideos } from "./data";

export const metadata: Metadata = {
  title: "AI Video | Cricher AI CreatorHub",
  description: "Generate AI videos, browse your library, and post to TikTok.",
};

export default async function AiVideoPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? null;

  const [videos, tiktokAccount] = await Promise.all([
    fetchAiVideos(userId),
    userId
      ? prisma.tikTokAccount.findUnique({ where: { user_id: userId } })
      : Promise.resolve(null),
  ]);

  const tikTokBinding = await buildTikTokBinding(tiktokAccount);

  return <AiVideoDashboard videos={videos} tikTokBinding={tikTokBinding} />;
}
