'use client';

import Link from 'next/link';
import Image from 'next/image';
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
  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-4 text-gray-900">{platform} Creators</h2>
          <p className="text-gray-600">{description}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {creators.map((creator) => {
            const platformData = creator.platforms.find(p => p.platform.name === platform.toLowerCase());
            if (!platformData) return null;
            
            return (
              <Link href={`/creator/${creator.id}`} key={creator.id}>
                <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
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
                        JSON.parse(creator.categories)
                          .slice(0, 2)
                          .join(', ')
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
