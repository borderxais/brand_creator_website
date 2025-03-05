import { SearchBar } from '@/components/ui/SearchBar';
import { PlatformSection } from '@/components/ui/PlatformSection';
import { SearchParamsHandler } from '@/components/ui/SearchHandler';
import { prisma } from '@/lib/prisma';
import { Creator } from '@/types/creator';
import { Suspense } from 'react';

// Add dynamic rendering for this page
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getCreatorsByPlatform(platformName: string): Promise<Creator[]> {
  try {
    // Get platform
    const platform = await prisma.platform.findUnique({
      where: { name: platformName }
    });

    if (!platform) {
      console.error(`Platform ${platformName} not found`);
      return [];
    }

    // Get creators from database
    const creatorPlatforms = await prisma.creatorPlatform.findMany({
      where: {
        platformId: platform.id
      },
      include: {
        creator: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                image: true
              }
            }
          }
        }
      },
      orderBy: {
        followers: 'desc'
      }
    });

    // Transform data to match Creator type
    return creatorPlatforms.map(cp => ({
      ...cp.creator,
      user: cp.creator.user,
      followers: cp.followers,
      engagementRate: cp.engagementRate,
      handle: cp.handle || undefined
    }));
  } catch (error) {
    console.error(`Error fetching ${platformName} creators:`, error);
    return [];
  }
}

export default async function Home() {
  // Get all active platforms
  const platforms = await prisma.platform.findMany({
    where: { isActive: true }
  });

  // Get creators for each platform
  const platformSections = await Promise.all(
    platforms.map(async platform => {
      const creators = await getCreatorsByPlatform(platform.name);
      return {
        platform: platform.displayName,
        creators,
        description: platform.description || `Connect with ${platform.displayName} content creators.`
      };
    })
  );

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
