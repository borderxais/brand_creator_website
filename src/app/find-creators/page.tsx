'use client';

import { SearchBar } from '@/components/ui/SearchBar';
import { Card } from '@/components/ui/Card';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Platform } from '@/types/platform';
import { Category } from '@/types/category';

interface Creator {
  id: string;
  userId: string;
  bio: string;
  location: string;
  website: string;
  categories: string;
  followers: number;
  engagementRate: number;
  instagram: boolean;
  tiktok: boolean;
  youtube: boolean;
  weibo: boolean;
  xiaohongshu: boolean;
  douyin: boolean;
  user: {
    name: string;
    image: string | null;
    email: string;
  };
}

export default function FindCreatorsPage() {
  const searchParams = useSearchParams();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const platform = (searchParams?.get('platform') || 'all') as 'all' | Platform;
  const category = (searchParams?.get('category') || 'all') as 'all' | Category;

  useEffect(() => {
    async function fetchCreators() {
      try {
        setLoading(true);
        setError(null);
        
        // Build query string
        const params = new URLSearchParams();
        if (platform !== 'all') params.set('platform', platform);
        if (category !== 'all') params.set('category', category);
        
        const response = await fetch(`/api/creators?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch creators');
        }

        const data = await response.json();
        setCreators(data);
      } catch (error) {
        console.error('Error fetching creators:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch creators');
      } finally {
        setLoading(false);
      }
    }

    fetchCreators();
  }, [platform, category]);

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section with Search */}
      <section className="bg-gradient-to-b from-purple-900 to-indigo-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-4xl font-bold mb-6">Find Creators</h1>
            <p className="text-xl mb-8 text-gray-100">
              {platform !== 'all' || category !== 'all' ? (
                <>
                  {loading ? (
                    'Loading creators...'
                  ) : (
                    <>
                      Showing {creators.length} creator{creators.length !== 1 ? 's' : ''} 
                      {platform !== 'all' && ` on ${platform}`}
                      {category !== 'all' && ` in ${category}`}
                    </>
                  )}
                </>
              ) : (
                'Browse our diverse community of talented creators'
              )}
            </p>
            <div className="w-full">
              <SearchBar initialPlatform={platform} initialCategory={category} />
            </div>
          </div>
        </div>
      </section>

      {/* Creators Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Error</h2>
              <p className="text-red-600">{error}</p>
            </div>
          ) : creators.length === 0 ? (
            <div className="text-center py-12">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">No Creators Found</h2>
              <p className="text-gray-600">
                We couldn't find any creators matching your filters. Try adjusting your search criteria.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {creators.map((creator) => (
                <Card key={creator.id} className="p-6 hover:shadow-lg transition-shadow bg-white">
                  <div className="flex items-center space-x-4">
                    <img
                      src={creator.user.image || '/default-avatar.png'}
                      alt={creator.user.name}
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

                  <div className="mt-4 flex flex-wrap gap-2">
                    {creator.instagram && (
                      <span className="px-2 py-1 bg-pink-100 text-pink-800 rounded-full text-sm font-medium">
                        Instagram
                      </span>
                    )}
                    {creator.tiktok && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                        TikTok
                      </span>
                    )}
                    {creator.youtube && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                        YouTube
                      </span>
                    )}
                    {creator.weibo && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                        Weibo
                      </span>
                    )}
                    {creator.xiaohongshu && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                        Xiaohongshu
                      </span>
                    )}
                    {creator.douyin && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        Douyin
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex justify-between text-sm text-gray-500">
                    <span>{creator.followers.toLocaleString()} followers</span>
                    <span>{creator.engagementRate.toFixed(1)}% engagement</span>
                  </div>

                  {creator.categories && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {creator.categories.split(',').map((category: string) => (
                        <span
                          key={category}
                          className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                        >
                          {category.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
