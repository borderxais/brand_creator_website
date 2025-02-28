'use client';

import { useRef } from 'react';
import { Card } from './Card';
import { ScrollButtons } from './ScrollButtons';
import { PlatformIcon } from './PlatformIcon';
import { Creator } from '@/types/creator';

interface PlatformSectionProps {
  platform: string;
  creators: Creator[];
  description?: string;
}

export function PlatformSection({ platform, creators, description }: PlatformSectionProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return 'text-pink-600';
      case 'tiktok':
        return 'text-black';
      case 'youtube':
        return 'text-red-600';
      case 'douyin':
        return 'text-blue-600';
      case 'xiaohongshu':
        return 'text-red-500';
      case 'weibo':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

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

  const platformColor = getPlatformColor(platform);

  return (
    <div className="mb-12">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <PlatformIcon platform={platform} className={`w-8 h-8 ${platformColor}`} />
          <h2 className="text-2xl font-bold text-gray-900">{platform}</h2>
          {description && (
            <p className="mt-2 text-gray-600">{description}</p>
          )}
        </div>
        <a
          href={`/find-creators?platform=${platform.toLowerCase()}`}
          className={`${platformColor} hover:opacity-80 font-medium`}
        >
          View all
        </a>
      </div>
      <div className="relative group">
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ScrollButtons
            direction="left"
            onScrollLeft={() => scroll('left')}
            className="bg-white shadow-lg rounded-full p-2 bg-gray-600"
          />
        </div>
        <div 
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ScrollButtons
            direction="right"
            onScrollRight={() => scroll('right')}
            className="bg-white shadow-lg rounded-full p-2 bg-gray-600"
          />
        </div>
        <div 
          ref={scrollContainerRef}
          className="flex overflow-x-auto gap-6 pb-4 scrollbar-hide px-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {creators.map((creator) => (
            <Card key={creator.id} className="p-6 hover:shadow-lg transition-shadow bg-white flex-none w-[350px]">
              <div className="flex items-center space-x-4">
                <img
                  src={creator.user.image || '/default-avatar.png'}
                  alt={creator.user.name || 'Creator'}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{creator.user.name}</h3>
                  <p className="text-gray-500">{creator.location}</p>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-gray-600 line-clamp-2">{creator.bio}</p>
              </div>
              <div className="mt-4 flex justify-between text-sm text-gray-500">
                <span>{creator.followers.toLocaleString()} followers</span>
                <span>{creator.engagementRate.toFixed(1)}% engagement</span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
