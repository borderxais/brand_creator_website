import { Creator } from '@/types/creator';
import Image from 'next/image';
import { Card } from './Card';

interface CreatorCardProps {
  creator: Creator;
}

export function CreatorCard({ creator }: CreatorCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="relative h-48">
        {creator.user.image ? (
          <Image
            src={creator.user.image}
            alt={creator.user.name || 'Creator'}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400">No Image</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          {creator.user.name || 'Anonymous Creator'}
        </h3>
        <p className="text-sm text-gray-600 mb-2">{creator.location}</p>
        <p className="text-sm text-gray-500 mb-4">{creator.bio}</p>
        <div className="flex justify-between text-sm text-gray-600">
          <div>
            <span className="font-semibold">{(creator.followers / 1000000).toFixed(1)}M</span>
            <span className="ml-1">followers</span>
          </div>
          <div>
            <span className="font-semibold">{creator.engagementRate.toFixed(1)}%</span>
            <span className="ml-1">engagement</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
