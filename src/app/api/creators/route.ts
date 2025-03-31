import { NextRequest, NextResponse } from 'next/server';

// NOTICE: This API route uses completely mocked data and does not require any database connection
// This avoids the "Environment variable not found: DATABASE_URL" error

// Import mock creator profiles from the same mock data used in the profile page
const mockCreatorProfiles = {
  '1': {
    id: '1',
    bio: 'Lifestyle and travel content creator with a passion for sustainable living.',
    location: 'Los Angeles, CA',
    categories: JSON.stringify(['Travel', 'Lifestyle', 'Sustainability']),
    user: {
      id: '1',
      name: 'Jamie Smith',
      image: 'https://randomuser.me/api/portraits/women/44.jpg'
    },
    platforms: [
      {
        id: '101',
        platform: {
          id: '1',
          name: 'instagram',
          displayName: 'Instagram',
          iconUrl: '/icons/instagram.svg'
        },
        followers: 125000,
        engagementRate: 3.8,
        handle: '@jamiesmith'
      },
      {
        id: '102',
        platform: {
          id: '2',
          name: 'tiktok',
          displayName: 'TikTok',
          iconUrl: '/icons/tiktok.svg'
        },
        followers: 250000,
        engagementRate: 5.2,
        handle: '@jamiesmith'
      }
    ]
  },
  '2': {
    id: '2',
    bio: 'Fitness enthusiast and wellness coach sharing workout routines and nutrition tips.',
    location: 'Miami, FL',
    categories: JSON.stringify(['Fitness', 'Health', 'Nutrition']),
    user: {
      id: '2',
      name: 'Alex Johnson',
      image: 'https://randomuser.me/api/portraits/men/32.jpg'
    },
    platforms: [
      {
        id: '103',
        platform: {
          id: '1',
          name: 'instagram',
          displayName: 'Instagram',
          iconUrl: '/icons/instagram.svg'
        },
        followers: 185000,
        engagementRate: 4.2,
        handle: '@alexjfit'
      },
      {
        id: '104',
        platform: {
          id: '3',
          name: 'youtube',
          displayName: 'YouTube',
          iconUrl: '/icons/youtube.svg'
        },
        followers: 320000,
        engagementRate: 6.1,
        handle: '@alexjfitness'
      }
    ]
  },
  '3': {
    id: '3',
    bio: 'Food blogger and cooking enthusiast sharing recipes and culinary adventures from around the world.',
    location: 'New York, NY',
    categories: JSON.stringify(['Food', 'Cooking', 'Travel']),
    user: {
      id: '3',
      name: 'Sophia Chen',
      image: 'https://randomuser.me/api/portraits/women/68.jpg'
    },
    platforms: [
      {
        id: '105',
        platform: {
          id: '1',
          name: 'instagram',
          displayName: 'Instagram',
          iconUrl: '/icons/instagram.svg'
        },
        followers: 210000,
        engagementRate: 4.5,
        handle: '@sophiascooking'
      },
      {
        id: '106',
        platform: {
          id: '3',
          name: 'youtube',
          displayName: 'YouTube',
          iconUrl: '/icons/youtube.svg'
        },
        followers: 175000,
        engagementRate: 6.8,
        handle: '@sophiachencooking'
      },
      {
        id: '107',
        platform: {
          id: '4',
          name: 'twitter',
          displayName: 'Twitter',
          iconUrl: '/icons/twitter.svg'
        },
        followers: 95000,
        engagementRate: 2.9,
        handle: '@sophiacooks'
      }
    ]
  }
};

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const platform = searchParams.get('platform') || 'all';
    const category = searchParams.get('category') || '';
    const query = searchParams.get('query') || '';
    
    // Convert mock object to array
    let creators = Object.values(mockCreatorProfiles);
    
    // Filter by platform if specified
    if (platform !== 'all') {
      creators = creators.filter((creator: any) => 
        creator.platforms.some((p: any) => 
          p.platform.name.toLowerCase() === platform.toLowerCase()
        )
      );
    }
    
    // Filter by category if specified
    if (category) {
      creators = creators.filter((creator: any) => {
        try {
          const categories = JSON.parse(creator.categories || '[]');
          return categories.some((c: string) => 
            c.toLowerCase().includes(category.toLowerCase())
          );
        } catch {
          return false;
        }
      });
    }
    
    // Filter by search query if specified
    if (query) {
      creators = creators.filter((creator: any) => 
        creator.user.name.toLowerCase().includes(query.toLowerCase()) ||
        creator.bio.toLowerCase().includes(query.toLowerCase()) ||
        creator.location.toLowerCase().includes(query.toLowerCase())
      );
    }
    
    // Return mocked data
    return NextResponse.json({ 
      creators,
      totalCount: creators.length,
      hasMore: false
    });
  } catch (error) {
    console.error('Error in /api/creators route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch creators' },
      { status: 500 }
    );
  }
}
