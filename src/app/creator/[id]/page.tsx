import { notFound } from 'next/navigation';
import { SocialLinks } from '@/components/ui/SocialLinks';
import { Stats } from '@/components/ui/Stats';
import { PortfolioGallery } from '@/components/ui/PortfolioGallery';
import ErrorHandlingImage from '@/components/ui/ErrorHandlingImage';
import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';

// Function to get creator profile from database
async function getCreatorProfile(id: string) {
  try {
    const creator = await prisma.findCreator.findUnique({
      where: { id }
    });
    
    if (!creator) return null;
    
    // Format the creator data to match the structure expected by the component
    return {
      id: creator.id,
      bio: creator.bio || '',
      location: "TikTok Creator", // Placeholder since we don't have location from TikTok API
      categories: creator.content_label_name ? JSON.stringify([creator.content_label_name]) : '[]',
      user: {
        id: creator.id,
        name: creator.display_name || '',
        image: creator.profile_image || ''
      },
      platforms: [
        {
          id: '1',
          platform: {
            id: '1',
            name: 'tiktok',
            displayName: 'TikTok',
            iconUrl: '/icons/tiktok.svg'
          },
          followers: creator.follower_count || 0,
          engagementRate: creator.engagement_rate || 0,
          handle: `@${creator.creator_handle_name}`
        }
      ],
      portfolioItems: [],
      posts: []
    };
  } catch (error) {
    console.error('Error fetching creator profile:', error);
    return null;
  }
}

// Parse categories helper function
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

// Generate metadata for the page
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const { id } = params;
  const creator = await getCreatorProfile(id);
  
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

export default async function CreatorProfile({ params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const creator = await getCreatorProfile(id);

    if (!creator) {
      notFound();
    }

    const categories = parseCategories(creator.categories);
    
    // Calculate metrics from real data only
    const totalFollowers = creator.platforms.reduce((sum: number, cp) => sum + (cp.followers || 0), 0);
    const averageEngagementRate = creator.platforms[0]?.engagementRate || 0;

    // Create social links from real data
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
                  <p className="text-gray-500">{creator.location || 'TikTok Creator'}</p>
                </div>
                <Stats
                  followers={totalFollowers}
                  engagementRate={averageEngagementRate}
                />
              </div>
              
              <div className="mt-6">
                <p className="text-gray-700">{creator.bio || 'No bio available'}</p>
              </div>

              {/* Creator Metrics Card - Only show real data */}
              <div className="mt-8 bg-gray-50 rounded-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Creator Metrics</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Stats */}
                  <div className="bg-white p-4 rounded-md shadow-sm">
                    <h3 className="text-sm font-medium text-gray-500">Followers</h3>
                    <p className="mt-1 text-2xl font-bold text-gray-900">
                      {totalFollowers.toLocaleString()}
                    </p>
                  </div>

                  {/* Engagement Rate */}
                  <div className="bg-white p-4 rounded-md shadow-sm">
                    <h3 className="text-sm font-medium text-gray-500">Engagement Rate</h3>
                    <p className="mt-1 text-2xl font-bold text-gray-900">
                      {averageEngagementRate.toFixed(2)}%
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
