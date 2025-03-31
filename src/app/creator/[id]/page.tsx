import { notFound } from 'next/navigation';
import { SocialLinks } from '@/components/ui/SocialLinks';
import { Stats } from '@/components/ui/Stats';
import { PortfolioGallery } from '@/components/ui/PortfolioGallery';
import ErrorHandlingImage from '@/components/ui/ErrorHandlingImage';
import { Metadata } from 'next';

// NOTICE: This page uses completely mocked data and does not require any API or database connection
// This avoids the "Environment variable not found: DATABASE_URL" error

// Mock data for creator metrics
const mockCreatorMetrics = {
  vacationStartDate: '2023-08-15',
  vacationEndDate: '2023-08-30',
  audienceLocales: ['United States (68%)', 'United Kingdom (12%)', 'Canada (8%)', 'Australia (5%)', 'Other (7%)'],
  averageViews: 45000,
  engagementRate: 4.8,
  completionRate: 62.3,
  followersGrowthRate: 2.7,
  averageLikes: 3200,
  averageShares: 520,
  averageComments: 175,
  creatorRate: '$1,500 per post'
};

// Mock creator profile data to replace database queries
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
    ],
    portfolioItems: [
      {
        id: '201',
        title: 'Sustainable Travel Guide',
        description: 'My guide to eco-friendly travel',
        imageUrl: 'https://images.unsplash.com/photo-1530521954074-e64f6810b32d',
        createdAt: new Date()
      },
      {
        id: '202',
        title: 'Brand Partnership',
        description: 'Collaboration with eco-friendly brand',
        imageUrl: 'https://images.unsplash.com/photo-1542435503-956c469947f6',
        createdAt: new Date()
      }
    ],
    posts: [
      {
        id: '301',
        title: 'My Trip to Costa Rica',
        content: 'Exploring sustainable tourism in Costa Rica...',
        imageUrl: 'https://images.unsplash.com/photo-1580237072353-751d01f15cac',
        published: true,
        createdAt: new Date()
      },
      {
        id: '302',
        title: 'Zero Waste Home Tips',
        content: 'Simple ways to reduce waste in your daily life...',
        imageUrl: 'https://images.unsplash.com/photo-1605600659453-719282out6aa',
        published: true,
        createdAt: new Date()
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
    ],
    portfolioItems: [
      {
        id: '203',
        title: 'Home Workout Series',
        description: 'No equipment needed workouts',
        imageUrl: 'https://images.unsplash.com/photo-1607962837359-5e7e89f86776',
        createdAt: new Date()
      }
    ],
    posts: [
      {
        id: '303',
        title: '30-Day Fitness Challenge',
        content: 'Join me for a month of daily workouts...',
        imageUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61',
        published: true,
        createdAt: new Date()
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
    ],
    portfolioItems: [
      {
        id: '204',
        title: 'Taste of Asia Series',
        description: 'Exploring authentic Asian cuisines',
        imageUrl: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd',
        createdAt: new Date()
      },
      {
        id: '205',
        title: 'Holiday Recipes Collection',
        description: 'Festive dishes for special occasions',
        imageUrl: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543',
        createdAt: new Date()
      },
      {
        id: '206',
        title: 'Food Brand Partnership',
        description: 'Collaboration with premium ingredients brand',
        imageUrl: 'https://images.unsplash.com/photo-1601314002592-b8734bca6604',
        createdAt: new Date()
      }
    ],
    posts: [
      {
        id: '304',
        title: 'Ultimate Pasta Guide',
        content: 'Everything you need to know about making perfect pasta at home...',
        imageUrl: 'https://images.unsplash.com/photo-1576007736119-9a0696c7be46',
        published: true,
        createdAt: new Date()
      },
      {
        id: '305',
        title: 'Street Food Adventures in Thailand',
        content: 'My journey through the vibrant street food scene in Bangkok...',
        imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836',
        published: true,
        createdAt: new Date()
      }
    ]
  }
};

interface PageProps {
  params: {
    id: string;
  };
}

// Get mock creator profile instead of database query
function getCreatorProfile(id: string) {
  return mockCreatorProfiles[id] || null;
}

function parseCategories(categoriesStr: string | null): string[] {
  if (!categoriesStr) return [];
  
  try {
    // Try parsing as JSON first
    const parsed = JSON.parse(categoriesStr);
    
    // Handle both array and string cases
    if (Array.isArray(parsed)) {
      return parsed;
    } else if (typeof parsed === 'string') {
      return [parsed]; // Convert single string to array with one element
    } else {
      return [];
    }
  } catch (e) {
    // If JSON parsing fails, split by comma and trim
    return categoriesStr.split(',').map(cat => cat.trim()).filter(Boolean);
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = params;
  const creator = getCreatorProfile(id);
  
  if (!creator) {
    return {
      title: 'Creator Not Found',
    };
  }

  return {
    title: `${creator.user.name} - Creator Profile`,
    description: creator.bio || `View ${creator.user.name}'s creator profile`,
  };
}

export default function CreatorProfile({ params }: PageProps) {
  try {
    const { id } = params;
    const creator = getCreatorProfile(id);

    if (!creator) {
      notFound();
    }

    const categories = parseCategories(creator.categories);

    // Calculate total followers and engagement
    const totalFollowers = creator.platforms.reduce((sum: number, cp) => sum + (cp.followers || 0), 0);
    
    // Avoid division by zero
    let averageEngagementRate = 0;
    if (totalFollowers > 0) {
      const weightedEngagement = creator.platforms.reduce((sum: number, cp) => 
        sum + ((cp.followers || 0) * (cp.engagementRate || 0)), 0);
      averageEngagementRate = weightedEngagement / totalFollowers;
    }

    // Create social links object
    const socialLinks = creator.platforms.reduce((acc, cp) => {
      if (cp.platform && cp.platform.name && cp.handle) {
        return {
          ...acc,
          [cp.platform.name]: cp.handle
        };
      }
      return acc;
    }, {});

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-purple-900 text-white">
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-extrabold">Creator Profile</h1>
            <p className="mt-2 text-lg">View detailed metrics and performance data</p>
            <div className="mt-4 flex flex-wrap gap-4">
              <button
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Book Collaboration
              </button>
              <button
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Compare Creators
              </button>
              <button
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Send Notification
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <input
              type="text"
              placeholder="Search creators..."
              className="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-500 shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
            <select className="w-full md:w-1/4 px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-500 shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
              <option value="">Filter by Category</option>
              <option value="beauty">Beauty</option>
              <option value="fashion">Fashion</option>
              <option value="travel">Travel</option>
              <option value="food">Food</option>
              <option value="fitness">Fitness</option>
            </select>
            <select className="w-full md:w-1/4 px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-500 shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
              <option value="">Filter by Platform</option>
              <option value="instagram">Instagram</option>
              <option value="tiktok">TikTok</option>
              <option value="youtube">YouTube</option>
              <option value="twitter">Twitter</option>
            </select>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Profile Header and Image */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="relative h-48 bg-gradient-to-r from-purple-600 to-indigo-600">
              {creator.user.image && (
                <div className="absolute -bottom-12 left-8">
                  <div className="relative w-32 h-32">
                    <ErrorHandlingImage
                      src={creator.user.image}
                      alt={creator.user.name || ''}
                      fill
                      sizes="128px"
                      className="rounded-full border-4 border-white object-cover"
                      priority
                      fallback={
                        <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-200 flex items-center justify-center text-gray-400">
                          No Image
                        </div>
                      }
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div className="pt-16 pb-8 px-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{creator.user.name}</h1>
                  <p className="text-gray-500">{creator.location}</p>
                </div>
                <Stats
                  followers={totalFollowers}
                  engagementRate={averageEngagementRate}
                />
              </div>
              
              <div className="mt-6">
                <p className="text-gray-700">{creator.bio}</p>
              </div>

              {/* Creator Metrics Card */}
              <div className="mt-8 bg-gray-50 rounded-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Creator Metrics</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Vacation Period */}
                  <div className="bg-white p-4 rounded-md shadow-sm">
                    <h3 className="text-sm font-medium text-gray-500">Vacation Period</h3>
                    <div className="mt-2 flex flex-col">
                      <span className="text-base font-semibold text-gray-900">
                        Start: {mockCreatorMetrics.vacationStartDate}
                      </span>
                      <span className="text-base font-semibold text-gray-900">
                        End: {mockCreatorMetrics.vacationEndDate}
                      </span>
                    </div>
                  </div>
                  
                  {/* Audience Locales */}
                  <div className="bg-white p-4 rounded-md shadow-sm">
                    <h3 className="text-sm font-medium text-gray-500">Audience Locales</h3>
                    <ul className="mt-2 space-y-1">
                      {mockCreatorMetrics.audienceLocales.map((locale, index) => (
                        <li key={index} className="text-sm text-gray-800">{locale}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Average Views */}
                  <div className="bg-white p-4 rounded-md shadow-sm">
                    <h3 className="text-sm font-medium text-gray-500">Average Views</h3>
                    <p className="mt-1 text-2xl font-bold text-gray-900">
                      {mockCreatorMetrics.averageViews.toLocaleString()}
                    </p>
                  </div>

                  {/* Engagement & Completion */}
                  <div className="bg-white p-4 rounded-md shadow-sm">
                    <h3 className="text-sm font-medium text-gray-500">Engagement Metrics</h3>
                    <div className="mt-2 flex flex-col">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Engagement Rate:</span>
                        <span className="text-sm font-medium text-gray-900">{mockCreatorMetrics.engagementRate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Completion Rate:</span>
                        <span className="text-sm font-medium text-gray-900">{mockCreatorMetrics.completionRate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Followers Growth Rate:</span>
                        <span className="text-sm font-medium text-green-600">+{mockCreatorMetrics.followersGrowthRate}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Average Interactions */}
                  <div className="bg-white p-4 rounded-md shadow-sm">
                    <h3 className="text-sm font-medium text-gray-500">Average Interactions</h3>
                    <div className="mt-2 flex flex-col">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Likes:</span>
                        <span className="text-sm font-medium text-gray-900">{mockCreatorMetrics.averageLikes.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Shares:</span>
                        <span className="text-sm font-medium text-gray-900">{mockCreatorMetrics.averageShares.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Comments:</span>
                        <span className="text-sm font-medium text-gray-900">{mockCreatorMetrics.averageComments.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Creator Rate */}
                  <div className="bg-white p-4 rounded-md shadow-sm">
                    <h3 className="text-sm font-medium text-gray-500">Creator Rate</h3>
                    <p className="mt-1 text-xl font-bold text-purple-600">
                      {mockCreatorMetrics.creatorRate}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Rates may vary based on campaign requirements
                    </p>
                  </div>
                </div>
              </div>

              {categories.length > 0 && (
                <div className="mt-6">
                  <h2 className="text-lg font-semibold text-gray-900">Categories</h2>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {categories.map((category: string) => (
                      <span
                        key={category}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Platform Stats */}
              {creator.platforms.length > 0 && (
                <div className="mt-6">
                  <h2 className="text-lg font-semibold text-gray-900">Platforms</h2>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {creator.platforms.map((cp) => (
                      <div
                        key={cp.platform.id}
                        className="bg-gray-50 rounded-lg p-4 flex items-center space-x-4"
                      >
                        <div className="flex-shrink-0">
                          {cp.platform.iconUrl ? (
                            <ErrorHandlingImage
                              src={cp.platform.iconUrl}
                              alt={cp.platform.displayName}
                              width={24}
                              height={24}
                              fallback={<div className="w-6 h-6 bg-gray-200 rounded"></div>}
                            />
                          ) : (
                            <div className="w-6 h-6 bg-gray-200 rounded" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {cp.platform.displayName}
                          </h3>
                          <div className="text-sm text-gray-500">
                            <p>{new Intl.NumberFormat().format(cp.followers)} followers</p>
                            <p>{cp.engagementRate.toFixed(1)}% engagement</p>
                            {cp.handle && <p className="text-gray-400">{cp.handle}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6">
                <SocialLinks {...socialLinks} />
              </div>
            </div>
          </div>

          {/* Portfolio Gallery */}
          {creator.portfolioItems && creator.portfolioItems.length > 0 && (
            <div className="mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Portfolio</h2>
              <PortfolioGallery items={creator.portfolioItems} />
            </div>
          )}

          {/* Recent Posts */}
          {creator.posts && creator.posts.length > 0 && (
            <div className="mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Posts</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {creator.posts.map((post) => (
                  <div key={post.id} className="bg-white shadow rounded-lg overflow-hidden">
                    {post.imageUrl ? (
                      <div className="relative h-48">
                        <ErrorHandlingImage
                          src={post.imageUrl}
                          alt={post.title}
                          fill
                          className="object-cover"
                          fallback={
                            <div className="h-48 bg-gray-100 flex items-center justify-center">
                              <span className="text-gray-400">Image unavailable</span>
                            </div>
                          }
                        />
                      </div>
                    ) : (
                      <div className="h-48 bg-gray-100 flex items-center justify-center">
                        <span className="text-gray-400">No image</span>
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="font-semibold text-lg">{post.title}</h3>
                      <p className="text-gray-600 mt-2">{post.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error rendering creator profile:', error);
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Error</h1>
          <p className="text-gray-700">An error occurred while rendering the creator profile.</p>
        </div>
      </div>
    );
  }
}
