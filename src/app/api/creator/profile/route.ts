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
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        creator: {
          include: {
            platforms: {
              include: {
                platform: true
              }
            }
          }
        }
      }
    });

    if (!user || !user.creator) {
      return NextResponse.json(
        { error: 'Creator profile not found' },
        { status: 404 }
      );
    }

    // Parse categories from JSON string
    let categories = [];
    try {
      categories = JSON.parse(user.creator.categories || '[]');
    } catch (e) {
      console.warn('Failed to parse categories:', user.creator.categories);
      categories = [];
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
        id: user.creator.id,
        bio: user.creator.bio,
        location: user.creator.location,
        website: user.creator.website,
        followers: user.creator.followers,
        engagementRate: user.creator.engagementRate,
        categories: categories
      },
      platforms: user.creator.platforms.map(cp => ({
        id: cp.id,
        platformName: cp.platform.name,
        platformDisplayName: cp.platform.displayName,
        handle: cp.handle,
        followers: cp.followers,
        engagementRate: cp.engagementRate,
        isVerified: cp.isVerified,
        lastUpdated: cp.lastUpdated
      }))
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
