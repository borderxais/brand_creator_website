import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const platform = searchParams.get('platform') || 'all';
    const category = searchParams.get('category') || '';
    const query = searchParams.get('query') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    
    // Base query conditions
    let whereCondition: any = {};
    
    // Filter by platform - assuming TikTok for now since we're using TikTok API
    if (platform !== 'all' && platform !== 'tiktok') {
      // If specifically asking for non-TikTok platforms, return empty for now
      return NextResponse.json({ 
        creators: [],
        totalCount: 0,
        hasMore: false
      });
    }
    
    // Filter by content label/category
    if (category) {
      whereCondition.content_label_name = {
        contains: category,
        mode: 'insensitive'
      };
    }
    
    // Filter by search query
    if (query) {
      whereCondition.OR = [
        { display_name: { contains: query, mode: 'insensitive' } },
        { bio: { contains: query, mode: 'insensitive' } },
        { creator_handle_name: { contains: query, mode: 'insensitive' } }
      ];
    }
    
    // Get total count for pagination
    const totalCount = await prisma.findCreator.count({
      where: whereCondition
    });
    
    // Get creators with pagination
    const creators = await prisma.findCreator.findMany({
      where: whereCondition,
      take: limit,
      skip: skip,
      orderBy: {
        follower_count: 'desc'
      }
    });
    
    // Format the response to match the structure expected by the frontend
    const formattedCreators = creators.map(creator => {
      return {
        id: creator.id.toString(),
        bio: creator.bio,
        location: "TikTok Creator",
        categories: creator.content_label_name ? [creator.content_label_name] : [],
        user: {
          id: creator.id.toString(),
          name: creator.display_name,
          image: creator.profile_image
        },
        platforms: [
          {
            platform: {
              name: 'tiktok',
              displayName: 'TikTok',
              iconUrl: '/icons/tiktok.svg'
            },
            followers: creator.follower_count || 0,
            engagementRate: creator.engagement_rate || 0,
            handle: `@${creator.creator_handle_name}`
          }
        ]
      };
    });
    
    return NextResponse.json({ 
      creators: formattedCreators,
      totalCount,
      hasMore: totalCount > skip + limit
    });
  } catch (error) {
    console.error('Error in /api/creators route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch creators', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
