import { SearchBar } from '@/components/ui/SearchBar';
import { PlatformSection } from '@/components/ui/PlatformSection';
import { SearchParamsHandler } from '@/components/ui/SearchHandler';
import { prisma } from '@/lib/prisma';
import { Creator } from '@/types/creator';
import { Suspense } from 'react';

// Add dynamic rendering for this page
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getCreatorsByPlatform(platform: string): Promise<Creator[]> {
  try {
    // Get creators from database
    const creators = await prisma.creatorProfile.findMany({
      where: {
        [platform.toLowerCase()]: true
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            image: true
          }
        }
      },
      orderBy: {
        followers: 'desc'
      }
    });

    return creators;
  } catch (error) {
    console.error(`Error fetching ${platform} creators:`, error);
    return [];
  }
}

export default async function Home() {
  const instagramCreators = await getCreatorsByPlatform('instagram');
  const tiktokCreators = await getCreatorsByPlatform('tiktok');
  const youtubeCreators = await getCreatorsByPlatform('youtube');
  const douyinCreators = await getCreatorsByPlatform('douyin');
  const xiaohongshuCreators = await getCreatorsByPlatform('xiaohongshu');
  const weiboCreators = await getCreatorsByPlatform('weibo');

  const platformSections = [
    {
      platform: 'Instagram',
      creators: instagramCreators,
      description: 'Connect with Instagram influencers who create engaging visual content and stories.'
    },
    {
      platform: 'TikTok',
      creators: tiktokCreators,
      description: 'Partner with TikTok creators who make viral short-form videos.'
    },
    {
      platform: 'YouTube',
      creators: youtubeCreators,
      description: 'Collaborate with YouTube content creators for in-depth product reviews and tutorials.'
    },
    {
      platform: 'Douyin',
      creators: douyinCreators,
      description: 'Reach Chinese audiences through Douyin\'s top content creators.'
    },
    {
      platform: 'Xiaohongshu',
      creators: xiaohongshuCreators,
      description: 'Partner with RED\'s lifestyle and beauty content creators.'
    },
    {
      platform: 'Weibo',
      creators: weiboCreators,
      description: 'Connect with influential Weibo users for broader social media reach.'
    }
  ];

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section with Search */}
      <div className="relative bg-gradient-to-b from-purple-900 to-indigo-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl tracking-tight font-extrabold sm:text-5xl md:text-6xl">
              Find Your Perfect Creator
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-300 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Connect with influencers across major social media platforms to amplify your brand's reach.
            </p>
            <Suspense>
              <SearchParamsHandler />
            </Suspense>
            <div className="mt-10 max-w-xl mx-auto">
              <Suspense fallback={<div className="h-12 bg-white/10 rounded animate-pulse" />}>
                <SearchBar />
              </Suspense>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-16">
          {platformSections.map(({ platform, creators, description }) => (
            creators.length > 0 && (
              <PlatformSection
                key={platform}
                platform={platform}
                creators={creators}
                description={description}
              />
            )
          ))}
        </div>
      </div>
    </main>
  );
}
