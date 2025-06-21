'use client';

import { useState, useEffect } from 'react';
import { Calendar, Users, DollarSign, Clock, MapPin, Star, Eye, Heart, MessageCircle } from 'lucide-react';
import Link from 'next/link';

// Mission data structure to match API response
interface Mission {
  id: string;
  task_title: string;
  campaign_objective: string;
  brand_name?: string;
  brand_id: string;
  platform: string;
  task_start_at: string;
  task_end_at: string;
  follower_min: number;
  follower_max: number;
  reward_model: string;
  fixed_reward?: number;
  cps_rate?: number;
  tiered_table?: string;
  niche_tags: string[];
  region_priority: string;
  created_at: string;
  updated_at: string;
  content_quality_floor?: string;
  deliverables?: string;
  mandatory_elements?: string;
  creative_guidelines?: string;
  prohibited_elements?: string;
  kpi_baseline?: string;
}

function MissionCard({ mission }: { mission: Mission }) {
  // Fix date formatting to prevent hydration errors
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
    } catch (error) {
      return dateString;
    }
  };

  const getRewardDisplay = () => {
    if (mission.reward_model === 'fixed' && mission.fixed_reward) {
      return `$${mission.fixed_reward}`;
    } else if (mission.reward_model === 'cps' && mission.cps_rate) {
      return `$${mission.cps_rate}/view`;
    } else if (mission.reward_model === 'tiered') {
      return 'Tiered rewards';
    }
    return 'TBD';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-semibold text-gray-900">{mission.task_title}</h3>
            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
              OPEN
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-2">by {mission.brand_name || 'Unknown Brand'}</p>
          <p className="text-gray-700 text-sm leading-relaxed line-clamp-2">{mission.campaign_objective}</p>
        </div>
      </div>

      {/* Mission Details Grid - Basic Info Only */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="flex items-center space-x-2">
          <DollarSign className="w-4 h-4 text-green-600" />
          <div>
            <p className="text-xs text-gray-500">Reward</p>
            <p className="font-semibold text-green-600">{getRewardDisplay()}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Users className="w-4 h-4 text-blue-600" />
          <div>
            <p className="text-xs text-gray-500">Followers</p>
            <p className="font-semibold">{mission.follower_min?.toLocaleString() || 0}+</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-orange-600" />
          <div>
            <p className="text-xs text-gray-500">Platform</p>
            <p className="font-semibold capitalize">{mission.platform || 'Not specified'}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <MapPin className="w-4 h-4 text-purple-600" />
          <div>
            <p className="text-xs text-gray-500">Region</p>
            <p className="font-semibold capitalize">{mission.region_priority?.replace('_', ' ') || 'Global'}</p>
          </div>
        </div>
      </div>

      {/* Schedule Information - Simplified */}
      <div className="bg-gray-50 rounded-lg p-3 mb-4">
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-1">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-gray-600">
              {formatDate(mission.task_start_at)} - {formatDate(mission.task_end_at)}
            </span>
          </div>
        </div>
      </div>

      {/* Tags - Limited */}
      <div className="flex flex-wrap gap-1 mb-4">
        {mission.niche_tags && mission.niche_tags.length > 0 ? (
          <>
            {mission.niche_tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="px-2 py-1 bg-blue-50 text-blue-600 rounded-full text-xs">
                #{tag}
              </span>
            ))}
            {mission.niche_tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-50 text-gray-600 rounded-full text-xs">
                +{mission.niche_tags.length - 3} more
              </span>
            )}
          </>
        ) : (
          <span className="px-2 py-1 bg-gray-50 text-gray-600 rounded-full text-xs">
            No tags available
          </span>
        )}
      </div>

      {/* Action Button */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500">
          Posted {formatDate(mission.created_at)}
        </div>
        <Link
          href={`/entertainment-live/${mission.id}`}
          className="px-6 py-2 rounded-lg font-medium text-sm transition-colors bg-purple-600 text-white hover:bg-purple-700"
        >
          Learn More
        </Link>
      </div>
    </div>
  );
}

export default function EntertainmentLive() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [platform, setPlatform] = useState<string>('all');
  const [region, setRegion] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const platforms = ['all', 'instagram', 'twitch', 'youtube', 'tiktok'];
  const regions = ['all', 'global', 'north_america', 'europe', 'asia'];
  const rewardModels = ['all', 'fixed', 'cps', 'tiered'];

  // Fetch missions from API
  const fetchMissions = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams();
      if (search && search.trim()) params.append('search', search);
      if (platform !== 'all') params.append('platform', platform);
      if (region !== 'all') params.append('region', region);
      if (filter !== 'all') params.append('reward_model', filter);
      params.append('limit', '50');

      const queryString = params.toString() ? `?${params.toString()}` : '';
      const response = await fetch(`/api/entertainment-live${queryString}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch missions: ${response.status}`);
      }

      const data = await response.json();
      console.log('Fetched missions:', data);

      // Handle both array response and object with missions property
      const missionsData = Array.isArray(data) ? data : (data.missions || []);
      setMissions(missionsData);

      if (!Array.isArray(data) && data.error) {
        console.warn('API Warning:', data.error);
      }
    } catch (error) {
      console.error('Error fetching missions:', error);
      setError(error instanceof Error ? error.message : 'Failed to load missions');
      setMissions([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMissions();
  }, []); // Initial load

  // Handle filter changes
  const handleFilterChange = () => {
    fetchMissions();
  };

  // Client-side filtering (backup in case server filtering doesn't work)
  const filteredMissions = missions.filter(mission => {
    const platformMatch = platform === 'all' || mission.platform === platform;
    const regionMatch = region === 'all' || mission.region_priority === region;
    const rewardMatch = filter === 'all' || mission.reward_model === filter;
    return platformMatch && regionMatch && rewardMatch;
  });

  // Sort missions by creation date
  const sortedMissions = [...filteredMissions].sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Entertainment Live Streaming
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-purple-100">
              Join exciting live streaming missions and earn rewards while entertaining audiences
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Engage Audiences</h3>
                <p className="text-purple-100">Connect with viewers through interactive live streaming experiences</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Earn Rewards</h3>
                <p className="text-purple-100">Get paid for hosting entertaining live streaming sessions</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Build Your Brand</h3>
                <p className="text-purple-100">Grow your audience and establish yourself as a live streaming expert</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <input
                  type="text"
                  placeholder="Search missions..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleFilterChange()}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Platform</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {platforms.map(p => (
                    <option key={p} value={p}>
                      {p === 'all' ? 'All Platforms' : p.charAt(0).toUpperCase() + p.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Region</label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {regions.map(r => (
                    <option key={r} value={r}>
                      {r === 'all' ? 'All Regions' : r.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reward Model</label>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {rewardModels.map(r => (
                    <option key={r} value={r}>
                      {r === 'all' ? 'All Models' : r.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleFilterChange}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                >
                  Apply Filters
                </button>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              Showing {sortedMissions.length} missions
            </div>
          </div>
        </div>

        {/* Mission Cards */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading missions</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={fetchMissions}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
              >
                Try Again
              </button>
            </div>
          ) : sortedMissions.length > 0 ? (
            sortedMissions.map((mission) => (
              <MissionCard key={mission.id} mission={mission} />
            ))
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No missions found</h3>
              <p className="text-gray-600">Try adjusting your filters to see more missions.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
