'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ErrorHandlingImage from '@/components/ui/ErrorHandlingImage';

// Type definitions for creator data
interface Platform {
  platform: {
    name: string;
    displayName: string;
    iconUrl: string;
  };
  followers: number;
  engagementRate: number;
  handle: string;
}

interface Creator {
  id: string;
  bio: string | null;
  location: string;
  categories: string[];
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
  platforms: Platform[];
}

interface CreatorsResponse {
  creators: Creator[];
  totalCount: number;
  hasMore: boolean;
  error?: string;
}

export default function FindCreators() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [noCreators, setNoCreators] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasNewCreators, setHasNewCreators] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshProgress, setRefreshProgress] = useState({ current: 0, total: 0 });

  // Check for creators (both new and existing)
  const checkForCreators = useCallback(async (refreshAll = false) => {
    try {
      const url = refreshAll 
        ? '/api/creators/check-new?refresh=true'
        : '/api/creators/check-new';
        
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to check for creators');
      }

      const data = await response.json();
      setHasNewCreators(data.hasNewCreators);
      
      return {
        hasNewCreators: data.hasNewCreators,
        hasCreators: data.hasCreators,
        allCreators: data.allCreators,
        newCreators: data.newCreators,
      };
    } catch (err) {
      console.error('Error checking for creators:', err);
      return {
        hasNewCreators: false,
        hasCreators: false,
        allCreators: [],
        newCreators: [],
      };
    }
  }, []);

  // Fetch creators data from API
  const fetchCreators = useCallback(async () => {
    setLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (searchQuery) params.append('query', searchQuery);
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedPlatform) params.append('platform', selectedPlatform);

      // Add a cache-busting parameter to ensure fresh data
      params.append('_t', Date.now().toString());

      const response = await fetch(`/api/creators?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch creators');

      const data: CreatorsResponse = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setCreators(data.creators || []);
      setNoCreators(data.totalCount === 0);
      setError('');
    } catch (err) {
      console.error('Error fetching creators:', err);
      setError('Failed to load creators. Please try again later.');
      setCreators([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, selectedPlatform]);

  // Function to sync TikTok creators (new or refresh all)
  const syncCreators = useCallback(async (refreshAll = false) => {
    try {
      setIsSyncing(true);
      
      // Step 1: Get creators to sync (all or just new ones)
      const creatorsData = await checkForCreators(refreshAll);
      const creatorsToSync = refreshAll ? creatorsData.allCreators : creatorsData.newCreators;
      
      if (!creatorsToSync.length) {
        // No creators to sync
        await fetchCreators();
        return;
      }
      
      setRefreshProgress({ current: 0, total: creatorsToSync.length });
      setIsRefreshing(true);
      
      // Step 2: Sync each creator individually to show progress
      for (let i = 0; i < creatorsToSync.length; i++) {
        const handle = creatorsToSync[i];
        
        // Update progress
        setRefreshProgress({ current: i + 1, total: creatorsToSync.length });
        
        // Sync this creator
        try {
          await fetch(`/api/creators/sync?handle_name=${encodeURIComponent(handle)}`);
        } catch (err) {
          console.error(`Failed to sync creator ${handle}:`, err);
        }
      }
      
      setHasNewCreators(false);
      
      // After syncing, fetch creators again
      await fetchCreators();
    } catch (err) {
      console.error('Error syncing creators:', err);
      setError('Failed to sync creators. Please try again later.');
    } finally {
      setIsSyncing(false);
      setIsRefreshing(false);
    }
  }, [checkForCreators, fetchCreators]);

  // Function to refresh all creators
  const handleRefreshAllCreators = () => {
    syncCreators(true);
  };

  // Function to sync only new creators
  const handleSyncNewCreators = () => {
    syncCreators(false);
  };

  // Initial load logic - check for new creators and fetch
  useEffect(() => {
    const initPage = async () => {
      const creatorsData = await checkForCreators();
      if (creatorsData.hasNewCreators) {
        // Auto-sync new creators on page load
        await syncCreators(false);
      } else {
        await fetchCreators();
      }
    };

    initPage();
  }, [checkForCreators, syncCreators, fetchCreators]);

  // Re-fetch when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchCreators();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedCategory, selectedPlatform, fetchCreators]);

  // Function to handle filter clearing
  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedPlatform('');
  };

  // Function to refresh the page and check for new creators
  const handleRefreshCreators = async () => {
    const creatorsData = await checkForCreators(true);
    if (creatorsData.hasNewCreators) {
      await syncCreators(false); // Only sync new creators by default
    } else if (creatorsData.hasCreators) {
      // Ask if user wants to refresh all creators
      if (confirm("No new creators found. Do you want to refresh data for all existing creators?")) {
        await syncCreators(true);
      } else {
        await fetchCreators();
      }
    } else {
      await fetchCreators();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-purple-900 text-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold">Find Creators</h1>
            <p className="mt-2 text-lg">Discover and connect with top content creators for your next campaign</p>
          </div>
          <div className="flex space-x-2">
            {hasNewCreators && (
              <button
                onClick={handleSyncNewCreators}
                disabled={isSyncing}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                <svg className="-ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
                Sync New Creators
              </button>
            )}
            
            <button
              onClick={handleRefreshAllCreators}
              disabled={isSyncing}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
            >
              {isSyncing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isRefreshing ? `Refreshing ${refreshProgress.current}/${refreshProgress.total}` : 'Refreshing...'}
                </>
              ) : (
                <>
                  <svg className="-ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 8 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh All Creators
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="Search creators by name, bio, or handle"
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="Comedy">Comedy</option>
              <option value="Beauty">Beauty</option>
              <option value="Fashion">Fashion</option>
              <option value="Fitness">Fitness</option>
              <option value="News & Entertainment">News & Entertainment</option>
              <option value="Sports">Sports</option>
            </select>
          </div>
          <div>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
            >
              <option value="">All Platforms</option>
              <option value="tiktok">TikTok</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
          <p className="mt-2 text-gray-600">Loading creators...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <p className="text-red-500">{error}</p>
          <button
            onClick={handleClearFilters}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            Clear Filters & Try Again
          </button>
        </div>
      )}

      {/* Show refreshing progress indicator if applicable */}
      {isRefreshing && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="animate-spin h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Refreshing Creator Data</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>Refreshing {refreshProgress.current} of {refreshProgress.total} creators...</p>
                  <div className="mt-1 w-full bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(refreshProgress.current / refreshProgress.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Creator List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {!loading && !error && creators.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No creators found matching your criteria</p>
            {noCreators && (
              <button
                onClick={() => syncCreators(false)}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Sync TikTok Creators
              </button>
            )}
            {!noCreators && (
              <button
                onClick={handleClearFilters}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          // Only render grid if not loading, no error, and we have creators
          !loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
              {creators.map((creator) => (
                <Link
                  key={creator.id}
                  href={`/creator/${creator.id}`}
                  className="block hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="bg-white rounded-lg shadow overflow-hidden h-full">
                    <div className="p-6">
                      <div className="flex items-center">
                        <div className="relative h-16 w-16 mr-4">
                          {creator.user.image ? (
                            <ErrorHandlingImage
                              src={creator.user.image}
                              alt={creator.user.name || 'Creator'}
                              fill
                              className="rounded-full object-cover"
                              sizes="64px"
                              fallback={
                                <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
                                  <span className="text-gray-500">{creator.user.name?.[0] || '?'}</span>
                                </div>
                              }
                            />
                          ) : (
                            <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-500">{creator.user.name?.[0] || '?'}</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{creator.user.name || 'Unknown Creator'}</h3>
                          <p className="text-sm text-gray-500">{creator.location || 'TikTok Creator'}</p>
                        </div>
                      </div>

                      <p className="mt-4 text-gray-600 line-clamp-2">{creator.bio || 'No bio available'}</p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {creator.categories && creator.categories.length > 0 ? (
                          creator.categories.map((category, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                            >
                              {category}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-gray-400">No categories</span>
                        )}
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex space-x-2">
                          {creator.platforms.map((platform, index) => (
                            <div key={index} className="flex items-center">
                              {platform.platform.name === 'tiktok' && (
                                <Image
                                  src="/icons/tiktok.svg"
                                  alt="TikTok"
                                  width={20}
                                  height={20}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="text-sm text-gray-500">
                          {creator.platforms[0]?.followers?.toLocaleString() || '0'} followers
                        </div>
                      </div>

                      <div className="mt-5 pt-5 border-t border-gray-200">
                        <button className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
                          View Profile
                        </button>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
