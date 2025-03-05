import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Image from 'next/image';
import { PortfolioGallery } from '@/components/ui/PortfolioGallery';
import { SocialLinks } from '@/components/ui/SocialLinks';
import { Stats } from '@/components/ui/Stats';
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
        portfolioItems: true,
        posts: true
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
    return JSON.parse(categoriesStr);
  } catch (e) {
    // If JSON parsing fails, split by comma and trim
    return categoriesStr.split(',').map(cat => cat.trim()).filter(Boolean);
  }
}

export async function generateMetadata({params}: {params: { id: string }}) {
  const creator = await getCreatorProfile(params.id);
  
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

export default async function CreatorProfile({params}: { params: { id: string }}) {
  const { id } = params;

  const creator = await getCreatorProfile(id);

  if (!creator) {
    notFound();
  }

  const categories = parseCategories(creator.categories);

  // Calculate total followers and engagement
  const totalFollowers = creator.platforms.reduce((sum: number, cp) => sum + cp.followers, 0);
  const weightedEngagement = creator.platforms.reduce((sum: number, cp) => sum + (cp.followers * cp.engagementRate), 0);
  const averageEngagementRate = weightedEngagement / totalFollowers;

  // Get active platforms
  const activePlatforms = creator.platforms.reduce((acc: string[], cp) => {
    acc.push(cp.platform.displayName);
    return acc;
  }, []);

  // Create social links object
  const socialLinks = creator.platforms.reduce((acc, cp) => ({
    ...acc,
    [cp.platform.name]: cp.handle
  }), {});

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="relative h-48 bg-gradient-to-r from-purple-600 to-indigo-600">
            {creator.user.image && (
              <div className="absolute -bottom-12 left-8">
                <div className="relative w-32 h-32">
                  <Image
                    src={creator.user.image}
                    alt={creator.user.name || ''}
                    fill
                    sizes="128px"
                    className="rounded-full border-4 border-white object-cover"
                    priority
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
                          <Image
                            src={cp.platform.iconUrl}
                            alt={cp.platform.displayName}
                            width={24}
                            height={24}
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

        {/* Portfolio Section */}
        {creator.portfolioItems.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Portfolio</h2>
            <PortfolioGallery items={creator.portfolioItems} />
          </div>
        )}

        {/* Recent Posts */}
        {creator.posts.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Posts</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {creator.posts.map((post) => (
                <div key={post.id} className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900">{post.title}</h3>
                    <p className="mt-2 text-gray-600 line-clamp-3">{post.content}</p>
                    <div className="mt-4 text-sm text-gray-500">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
