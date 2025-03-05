'use client';

import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ScrollButtons } from '@/components/ui/ScrollButtons';
import { Prisma } from '@prisma/client';

type CreatorWithPlatforms = {
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
};

interface PlatformSectionProps {
  platform: string;
  creators: CreatorWithPlatforms[];
  description: string;
}

export default function PlatformSection({ platform, creators, description }: PlatformSectionProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -400 : 400;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className="py-8 relative">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-4 text-gray-900">{platform} Creators</h2>
            <p className="text-gray-600">{description}</p>
          </div>
          <Link 
            href={`/find-creators?platform=${platform.toLowerCase()}`}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            View All
          </Link>
        </div>

        {/* Left scroll button */}
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
          <ScrollButtons 
            direction="left"
            onScrollLeft={() => handleScroll('left')}
            className="p-2 rounded-full bg-white shadow-lg hover:bg-gray-50 transition-colors"
          />
        </div>

        {/* Right scroll button */}
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10">
          <ScrollButtons 
            direction="right"
            onScrollRight={() => handleScroll('right')}
            className="p-2 rounded-full bg-white shadow-lg hover:bg-gray-50 transition-colors"
          />
        </div>
        
        <div 
          ref={scrollContainerRef}
          className="flex overflow-x-auto gap-6 pb-4 hide-scrollbar px-12"
          style={{ scrollBehavior: 'smooth' }}
        >
          {creators.slice(0, 6).map((creator) => {
            const platformData = creator.platforms.find(p => p.platform.name === platform.toLowerCase());
            if (!platformData) return null;
            
            return (
              <Link href={`/creator/${creator.id}`} key={creator.id}>
                <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow min-w-[300px]">
                  <div className="flex items-center mb-4">
                    <Image
                      src={creator.user.image || '/images/placeholder-40.svg'}
                      alt={creator.user.name}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                    <div className="ml-3">
                      <h3 className="font-semibold text-gray-900">{creator.user.name}</h3>
                      <p className="text-sm text-gray-600">@{platformData.handle}</p>
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Categories:</span>
                      <span className="text-gray-900">{
                        (() => {
                          try {
                            const parsed = JSON.parse(creator.categories);
                            if (Array.isArray(parsed)) {
                              return parsed.slice(0, 2).join(', ');
                            } else {
                              return parsed;
                            }
                          } catch (e) {
                            return creator.categories || 'N/A';
                          }
                        })()
                      }</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Followers:</span>
                      <span className="text-gray-900">{creator.followers.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
