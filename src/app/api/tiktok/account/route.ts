import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ connected: false }, { status: 401 });
  }

  const account = await prisma.tikTokAccount.findUnique({
    where: { user_id: session.user.id },
  });

  if (!account) {
    return NextResponse.json({ connected: false });
  }

  return NextResponse.json({
    connected: true,
    account: {
      openId: account.tiktok_open_id,
      displayName: account.display_name,
      handle: account.handle,
      avatarUrl: account.avatar_url,
      followerCount: account.follower_count,
      engagementRate: account.engagement_rate,
      scope: account.scope,
      expiresAt: account.expires_at,
      refreshExpiresAt: account.refresh_expires_at,
      lastSyncedAt: account.last_synced_at,
    },
  });
}
