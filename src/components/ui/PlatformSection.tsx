'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRef } from 'react';
import { Creator } from '@/types/creator';
import { ChevronLeft, ChevronRight, Instagram, Youtube, Globe } from 'lucide-react';

interface PlatformSectionProps {
  platform: string;
  creators: Creator[];
  description: string;
}

export function PlatformSection({ platform, creators, description }: PlatformSectionProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = 400;
    const targetScroll = container.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
    
    container.scrollTo({
      left: targetScroll,
      behavior: 'smooth'
    });
  };

  const getPlatformIcon = (platformName: string) => {
    switch (platformName.toLowerCase()) {
      case 'instagram':
        return <Instagram className="w-6 h-6 text-gray-600" />;
      case 'youtube':
        return <Youtube className="w-6 h-6 text-gray-600" />;
      default:
        return <Globe className="w-6 h-6 text-gray-600" />;
    }
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{platform}</h2>
          <p className="mt-1 text-gray-600">{description}</p>
        </div>
      </div>

      <div className="relative group">
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-6 h-6 text-gray-600" />
        </button>

        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-6 h-6 text-gray-600" />
        </button>

        <div
          ref={scrollContainerRef}
          className="flex overflow-x-auto gap-6 pb-4 scrollbar-hide scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {creators.map((creator) => (
            <Link
              key={creator.id}
              href={`/creator/${creator.id}`}
              className="group flex-none w-[300px] bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="relative h-48">
                {creator.user?.image ? (
                  <Image
                    src={creator.user.image}
                    alt={creator.user?.name || ''}
                    className="object-cover"
                    fill
                    sizes="300px"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                    <svg
                      className="h-12 w-12 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                    {creator.user?.name}
                  </h3>
                  {getPlatformIcon(platform)}
                </div>
                <p className="mt-1 text-sm text-gray-600">
                  {creator.followers.toLocaleString()} followers
                </p>
                <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                  {creator.bio || 'No bio available'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
