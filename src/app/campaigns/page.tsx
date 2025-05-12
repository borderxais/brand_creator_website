'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

// Campaign type definition based on Supabase schema
interface Campaign {
  id: string;
  brand_id: string;
  brand_name?: string;
  title: string;
  brief: string;
  requirements: string;
  budget_range: string;
  commission: string;
  platform: string;
  deadline: string;
  max_creators: number;
  is_open: boolean;
  created_at: string;
}

export default function Campaigns() {
  const { data: session } = useSession();
  const [searchTerm, setSearchTerm] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch campaigns from the API
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setLoading(true);
        setError(null); // Clear any previous errors
        
        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        if (platformFilter !== 'all') params.append('platform', platformFilter);
        
        console.log(`Fetching campaigns with params: ${params.toString()}`);
        
        const response = await fetch(`/api/campaigns?${params.toString()}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          console.error('API response error:', response.status, errorData);
          throw new Error(
            errorData?.error || errorData?.message || 
            `Failed to fetch campaigns (status: ${response.status})`
          );
        }
        
        const data = await response.json();
        console.log(`Received ${data.length} campaigns from API`);
        setCampaigns(Array.isArray(data) ? data : []);
      } catch (err: any) {
        console.error('Error fetching campaigns:', err);
        setError(err.message || 'Failed to load campaigns. Please try again later.');
        setCampaigns([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, [searchTerm, platformFilter]);

  // Filter campaigns based on search term and platform
  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = !searchTerm || 
                         campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (campaign.brand_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlatform = platformFilter === 'all' || campaign.platform.toLowerCase() === platformFilter.toLowerCase();
    return matchesSearch && matchesPlatform;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-purple-900 text-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-extrabold">Active Campaigns</h1>
          <p className="mt-2 text-lg">Find and apply to brand campaigns that match your profile</p>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search campaigns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-500 shadow-sm focus:ring-2focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          <div className="flex gap-4">
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-500 shadow-sm focus:ring-2focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="all">All Platforms</option>
              <option value="instagram">Instagram</option>
              <option value="tiktok">TikTok</option>
              <option value="youtube">YouTube</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-500 shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="all">All Categories</option>
              <option value="fashion">Fashion</option>
              <option value="beauty">Beauty</option>
              <option value="fitness">Fitness</option>
              <option value="tech">Technology</option>
            </select>
          </div>
        </div>
      </div>

      {/* Campaign List */}
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="text-center py-10">
            <p className="text-gray-600">Loading campaigns...</p>
          </div>
        ) : error ? (
          <div className="text-center py-10">
            <p className="text-red-600">{error}</p>
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-600">No campaigns found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredCampaigns.map((campaign) => (
              <div key={campaign.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">{campaign.title}</h2>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      campaign.is_open ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {campaign.is_open ? 'Active' : 'Closed'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">by {campaign.brand_name || 'Unknown Brand'}</p>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {campaign.budget_range}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {campaign.commission}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Deadline: {new Date(campaign.deadline).toLocaleDateString()}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {campaign.platform}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      Max creators: {campaign.max_creators}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{campaign.brief}</p>
                  <div className="mt-4">
                    {session ? (
                      <a
                        href={`/campaigns/${campaign.id}`}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                      >
                        View Details
                      </a>
                    ) : (
                      <a
                        href="/login"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                      >
                        Apply
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
