import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/app/api/auth/[...nextauth]/auth.config';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authConfig);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'CREATOR') {
      return NextResponse.json(
        { error: 'Only creators can access this endpoint' },
        { status: 403 }
      );
    }

    // Get the creator's complete profile
    const creatorProfile = await prisma.creatorProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!creatorProfile) {
      return NextResponse.json(
        { error: 'Creator profile not found' },
        { status: 404 }
      );
    }

    // Parse categories from JSON string
    let categories = [];
    try {
      categories = JSON.parse(creatorProfile.categories || '[]');
    } catch (e) {
      console.warn('Failed to parse categories:', creatorProfile.categories);
      categories = [];
    }

    // Fetch linked platforms separately
    const creatorPlatforms = await prisma.creatorPlatform.findMany({
      where: { creatorId: creatorProfile.id },
    });

    const platformIds = creatorPlatforms
      .map(cp => cp.platformId)
      .filter((id): id is string => Boolean(id));

    const platforms = platformIds.length
      ? await prisma.platform.findMany({
          where: { id: { in: platformIds } },
        })
      : [];

    const platformMap = platforms.reduce<Record<string, (typeof platforms)[number]>>((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {});

    // Fetch basic user info
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, creatorHandleName: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Format the response
    const profileData = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        creatorHandleName: user.creatorHandleName,
        role: user.role
      },
      profile: {
        id: creatorProfile.id,
        bio: creatorProfile.bio,
        location: creatorProfile.location,
        website: creatorProfile.website,
        followers: creatorProfile.followers,
        engagementRate: creatorProfile.engagementRate,
        categories: categories
      },
      platforms: creatorPlatforms.map(cp => {
        const platformInfo = cp.platformId ? platformMap[cp.platformId] : undefined;
        return {
        id: cp.id,
        platformName: platformInfo?.name || '',
        platformDisplayName: platformInfo?.displayName || '',
        handle: cp.handle,
        followers: cp.followers,
        engagementRate: cp.engagementRate,
        isVerified: cp.isVerified,
        lastUpdated: cp.lastUpdated
        };
      })
    };

    return NextResponse.json(profileData);

  } catch (error: any) {
    console.error('Error fetching creator profile:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch creator profile' },
      { status: 500 }
    );
  }
}
