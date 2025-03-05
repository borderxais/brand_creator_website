'use client';

import { Creator } from '@/types/creator';
import { Card } from '@/components/ui/Card';
import { Instagram, Youtube, Globe, Video } from 'lucide-react';
import Link from 'next/link';

interface PlatformSectionProps {
  platform: string;
  creators: Creator[];
  description: string;
}

const PlatformIcons: { [key: string]: React.ElementType } = {
  'Instagram': Instagram,
  'TikTok': Video,
  'YouTube': Youtube,
  'Douyin': Video,
  'Xiaohongshu': Globe,
  'Weibo': Globe,
  // Add default icon for other platforms
  'default': Globe
};

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

export function PlatformSection({ platform, creators, description }: PlatformSectionProps) {
  const Icon = PlatformIcons[platform] || PlatformIcons.default;

  return (
    <section>
      <div className="flex items-center space-x-4 mb-6">
        <Icon className="w-8 h-8 text-gray-700" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{platform}</h2>
          <p className="text-gray-600">{description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {creators.map((creator) => (
          <Link key={creator.id} href={`/creator/${creator.id}`}>
            <Card className="h-full transform transition-all hover:scale-105">
              <div className="relative aspect-square">
                <img
                  src={creator.user.image || '/images/placeholder-avatar.png'}
                  alt={creator.user.name || 'Creator'}
                  className="object-cover rounded-t-lg w-full h-full"
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg text-gray-900 truncate">
                  {creator.user.name}
                </h3>
                {creator.handle && (
                  <p className="text-gray-600 text-sm truncate">{creator.handle}</p>
                )}
                <div className="mt-2 text-sm text-gray-600">
                  <p>{new Intl.NumberFormat().format(creator.followers)} followers</p>
                  <p>{creator.engagementRate.toFixed(1)}% engagement</p>
                </div>
                {creator.categories && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {parseCategories(creator.categories).map((category: string) => (
                      <span
                        key={category}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
