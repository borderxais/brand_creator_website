import { SearchBar } from '@/components/ui/SearchBar';
import PlatformSection from '@/components/ui/PlatformSection';
import { SearchParamsHandler } from '@/components/ui/SearchHandler';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { Suspense } from 'react';

// Add dynamic rendering for this page
export const dynamic = 'force-dynamic';
export const revalidate = 0;

type PlatformWithCreators = {
  name: string;
  description: string;
  creators: {
    id: string;
    user: {
      name: string;
      image: string | null;
    };
    platforms: {
      handle: string;
      platform: {
        name: string;
        displayName: string;
      };
    }[];
    categories: string;
    followers: number;
    engagementRate: number;
  }[];
};

async function getPlatformCreators(): Promise<PlatformWithCreators[]> {
  const platforms = await prisma.platform.findMany({
    where: { isActive: true },
    include: {
      creatorPlatforms: {
        include: {
          creator: {
            include: {
              user: {
                select: {
                  name: true,
                  image: true
                }
              },
              platforms: {
                include: {
                  platform: true
                }
              }
            }
          }
        }
      }
    }
  });

  return platforms.map(platform => ({
    name: platform.displayName,
    description: platform.description || `Connect with top ${platform.displayName} creators`,
    creators: platform.creatorPlatforms.map(cp => ({
      id: cp.creator.id,
      user: {
        name: cp.creator.user.name || '',
        image: cp.creator.user.image
      },
      platforms: cp.creator.platforms.map(p => ({
        handle: p.handle || '',
        platform: {
          name: p.platform.name,
          displayName: p.platform.displayName
        }
      })),
      categories: cp.creator.categories,
      followers: cp.followers,
      engagementRate: cp.engagementRate
    }))
  }));
}

export default async function Home() {
  const platformData = await getPlatformCreators();

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
          {platformData.map(({ name, creators, description }) => (
            creators.length > 0 && (
              <PlatformSection
                key={name}
                platform={name}
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
