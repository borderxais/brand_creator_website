import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/app/api/auth/[...nextauth]/auth.config';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // Get the authenticated user's session
    const session = await getServerSession(authConfig);
    console.log('Session:', session);

    if (!session?.user?.email) {
      console.log('No session or email');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user and ensure they are a creator
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!user || user.role !== 'CREATOR') {
      console.log('Not a creator:', { role: user?.role });
      return NextResponse.json({ error: 'Unauthorized - Creator access only' }, { status: 403 });
    }

    const creatorProfile = await prisma.creatorProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!creatorProfile) {
      console.log('Creator profile not found for user');
      return NextResponse.json({ error: 'Unauthorized - Creator access only' }, { status: 403 });
    }

    // Fetch claim records (acts like applications)
    const claims = await prisma.campaignclaims.findMany({
      where: { creator_id: creatorProfile.id },
      include: {
        campaigns: {
          include: {
            BrandProfile: {
              select: {
                id: true,
                companyName: true,
                industry: true,
                website: true,
                description: true,
              },
            },
          },
        },
      },
    });

    // Extract campaign IDs creator already applied to
    const appliedCampaignIds = claims
      .map(claim => claim.campaign_id)
      .filter((id): id is string => Boolean(id));

    // Get campaigns the creator has applied to
    const currentCampaigns = claims
      .map(claim => {
        if (!claim.campaigns) return null;
        return {
          ...claim.campaigns,
          applicationStatus: claim.status,
          appliedAt: claim.created_at,
        };
      })
      .filter((campaign): campaign is NonNullable<typeof campaign> => campaign !== null);
    console.log('Current campaigns:', currentCampaigns.length);

    // Get available campaigns (open and not already applied)
    const availableCampaigns = await prisma.campaigns.findMany({
      where: {
        is_open: true,
        NOT: { id: { in: appliedCampaignIds } },
      },
      include: {
        BrandProfile: {
          select: {
            id: true,
            companyName: true,
            industry: true,
            website: true,
            description: true,
          },
        },
      },
    });
    console.log('Available campaigns:', availableCampaigns.length);

    return NextResponse.json({
      currentCampaigns,
      availableCampaigns,
    });
  } catch (error) {
    console.error('Error fetching creator campaigns:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
