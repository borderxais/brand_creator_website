import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Image from 'next/image';
import { PortfolioGallery } from '@/components/ui/PortfolioGallery';
import { SocialLinks } from '@/components/ui/SocialLinks';
import { Stats } from '@/components/ui/Stats';
import { Metadata } from 'next';

async function getCreatorProfile(id: string) {
  try {
    const creator = await prisma.creatorProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            image: true,
          },
        },
        portfolioItems: true,
        posts: {
          where: { published: true },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

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

export async function generateMetadata({params}: {params: Promise<{ id: string }>}) {
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

export default async function CreatorProfile({params}: {params: Promise<{ id: string }>}) {
  const { id } = await params;
  const creator = await getCreatorProfile(id);
  
  if (!creator) {
    notFound();
  }

  const categories = parseCategories(creator.categories);

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
                followers={creator.followers}
                engagementRate={creator.engagementRate}
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

            <div className="mt-6">
              <SocialLinks
                instagram={creator.instagramHandle}
                tiktok={creator.tiktokHandle}
                youtube={creator.youtubeHandle}
                weibo={creator.weiboHandle}
                xiaohongshu={creator.xiaohongshuHandle}
                douyin={creator.douyinHandle}
              />
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
