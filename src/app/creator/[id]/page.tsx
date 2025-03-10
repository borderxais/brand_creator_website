import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { SocialLinks } from '@/components/ui/SocialLinks';
import { Stats } from '@/components/ui/Stats';
import { PortfolioGallery } from '@/components/ui/PortfolioGallery';
import ErrorHandlingImage from '@/components/ui/ErrorHandlingImage';
import { Metadata } from 'next';
import { Prisma } from '@prisma/client';

type CreatorWithRelations = Prisma.CreatorProfileGetPayload<{
  include: {
    user: true;
    platforms: {
      include: {
        platform: true;
      };
    };
    portfolioItems: true;
    posts: true;
  };
}>;

interface PageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function getCreatorProfile(id: string) {
  try {
    const creator = await prisma.creatorProfile.findUnique({
      where: { id },
      include: {
        user: true,
        platforms: {
          include: {
            platform: true
          }
        },
        portfolioItems: {
          orderBy: {
            createdAt: 'desc'
          }
        },
        posts: {
          orderBy: {
            createdAt: 'desc'
          },
          where: {
            published: true
          }
        }
      },
    }) as CreatorWithRelations;

    if (!creator) {
      return null;
    }

    return creator;
  } catch (error) {
    console.error('Error fetching creator profile:', error);
    return null;
  }
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
  const { id } = await params;
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

export default async function CreatorProfile({ params }: PageProps) {
  try {
    const { id } = await params;
    const creator = await getCreatorProfile(id);

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

    // Get active platforms
    const activePlatforms = creator.platforms.reduce((acc: string[], cp) => {
      if (cp.platform && cp.platform.displayName) {
        acc.push(cp.platform.displayName);
      }
      return acc;
    }, []);

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
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Profile Header */}
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
