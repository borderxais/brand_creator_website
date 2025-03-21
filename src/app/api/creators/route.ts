import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform')?.toLowerCase() || 'all';
    const category = searchParams.get('category')?.toUpperCase() || 'all';

    console.log('API Request - Filtering creators by:', { platform, category });

    // Get all creators with their profiles, platforms, and user info
    const creators = await prisma.creatorProfile.findMany({
      where: {
        // Filter by platform if specified
        ...(platform !== 'all' && {
          platforms: {
            some: {
              platform: {
                name: platform
              }
            }
          }
        }),
        // Filter by category if specified
        ...(category !== 'all' && {
          categories: {
            contains: category,
          }
        })
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        },
        platforms: {
          include: {
            platform: true
          }
        }
      }
    });

    console.log('Total creators found:', creators.length);

    // Transform the data to match what the find-creators page expects
    const transformedCreators = creators.map(creator => {
      // Extract platform flags
      const platformFlags = {
        instagram: false,
        tiktok: false,
        youtube: false,
        weibo: false,
        xiaohongshu: false,
        douyin: false
      };
      
      // Set platform flags based on the creator's platforms
      creator.platforms.forEach(platform => {
        const platformName = platform.platform.name.toLowerCase();
        if (platformName in platformFlags) {
          // Use type assertion to tell TypeScript this is a valid key
          platformFlags[platformName as keyof typeof platformFlags] = true;
        }
      });
      
      return {
        ...creator,
        ...platformFlags
      };
    });

    return NextResponse.json(transformedCreators);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch creators' }, { status: 500 });
  }
}
