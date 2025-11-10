'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Campaign type definition based on Supabase schema
interface Campaign {
  id: string;
  brand_id: string;
  brand_name?: string;
  title: string;
  brief: string;
  requirements: string;
  budget_range: string;
  budget_unit: string; // Add budget_unit field
  commission: string;
  platform: string;
  deadline: string;
  max_creators: number;
  is_open: boolean;
  created_at: string;
  sample_video_url: string | null; // Add sample_video_url field
  product_photo: string | null; // Add product_photo field
}

export default function Campaigns() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applyingTo, setApplyingTo] = useState<string | null>(null);
  const [applicationSuccess, setApplicationSuccess] = useState<boolean | null>(null);
  const [applicationMessage, setApplicationMessage] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [sampleText, setSampleText] = useState('');
  const [sampleVideoUrl, setSampleVideoUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
        
        const response= await fetch(`/api/campaigns?${params.toString()}`);
        
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

  // Open application modal
  const openApplicationModal = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setShowModal(true);
    setSampleText('');
    setSampleVideoUrl('');
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setSelectedCampaign(null);
    setSampleText('');
    setSampleVideoUrl('');
  };

  // Handle campaign application
  const handleApply = async (campaignId: string, campaignTitle: string) => {
    console.log("Apply button clicked for campaign:", campaignId);
    
    if (status === 'unauthenticated') {
      console.log("User not authenticated, redirecting to login");
      router.push('/login');
      return;
    }

    if (session?.user?.role !== 'CREATOR') {
      console.log("User not a creator:", session?.user?.role);
      setApplicationSuccess(false);
      setApplicationMessage('Only creators can apply to campaigns');
      return;
    }

    console.log("Opening application modal for campaign:", campaignTitle);
    // Find the campaign to display in the modal
    const campaign = campaigns.find(c => c.id === campaignId);
    if (campaign) {
      setSelectedCampaign(campaign);
      setShowModal(true);
      setSampleText('');
      setSampleVideoUrl('');
    } else {
      console.error("Campaign not found:", campaignId);
    }
  };

  // Submit application with samples
  const submitApplication = async () => {
    if (!selectedCampaign) {
      console.error("No campaign selected for application");
      return;
    }

    console.log("Submitting application for campaign:", selectedCampaign.id);
    try {
      setSubmitting(true);
      
      // Get user ID from session instead of creatorId
      const userId = session?.user?.id;
      
      console.log("User ID from session:", userId);
      if (!userId) {
        console.error("User ID not found in session");
        setApplicationSuccess(false);
        setApplicationMessage('User ID not found. Please try logging in again.');
        closeModal();
        return;
      }

      const payload = {
        campaignId: selectedCampaign.id,
        userId, // Send userId instead of creatorId
        sampleText,
        sampleVideoUrl,
      };
      console.log("Sending application payload:", payload);

      const response = await fetch('/api/campaigns/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log("Application response status:", response.status);
      const data = await response.json();
      console.log("Application response data:", data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to apply to campaign');
      }

      setApplicationSuccess(true);
      setApplicationMessage(data.status === 'already_applied' 
        ? 'You have already applied to this campaign'
        : 'Application submitted successfully!');
      
      // Close modal after successful submission
      closeModal();
      
      // Set the campaign ID for displaying success message
      setApplyingTo(selectedCampaign.id);
      
      // Reset states after delay
      setTimeout(() => {
        setApplyingTo(null);
        setTimeout(() => {
          setApplicationSuccess(null);
          setApplicationMessage('');
        }, 3000);
      }, 500);
      
    } catch (err: any) {
      console.error('Error applying to campaign:', err);
      setApplicationSuccess(false);
      setApplicationMessage(err.message || 'Failed to apply. Please try again.');
      closeModal();
    } finally {
      setSubmitting(false);
    }
  };

  // Check if user can apply (is authenticated and has CREATOR role)
  const canApply = status === 'authenticated' && session?.user?.role === 'CREATOR';

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
              className="w-full px-4 py-2 text-black border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-500 shadow-sm focus:ring-2focus:ring-purple-500 focus:border-purple-500"
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
              <div key={campaign.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                {/* Product Photo */}
                {campaign.product_photo && (
                  <div className="w-full h-48 bg-gray-100 relative">
                    <img
                      src={campaign.product_photo}
                      alt={`Product for ${campaign.title}`}
                      className="w-full h-full object-cover"
                      onLoad={(e) => {
                        console.log(`Campaign card image loaded: ${campaign.product_photo}`);
                        // Hide loading indicator
                        const loader = e.currentTarget.parentElement?.querySelector('.loading-placeholder') as HTMLElement;
                        if (loader) loader.style.display = 'none';
                      }}
                      onError={(e) => {
                        console.error(`Failed to load campaign card image: ${campaign.product_photo}`);
                        // Hide the image container if it fails to load
                        const container = e.currentTarget.closest('.w-full.h-48') as HTMLElement;
                        if (container) container.style.display = 'none';
                      }}
                    />
                    {/* Loading placeholder */}
                    <div className="loading-placeholder absolute inset-0 flex items-center justify-center bg-gray-200">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                )}
                
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
                      {campaign.budget_unit && (
                        <span className="ml-1 text-xs text-gray-500">
                          ({campaign.budget_unit === 'total' ? 'Total' : 
                            campaign.budget_unit === 'per_person' ? 'Per Creator' : 
                            campaign.budget_unit === 'per_video' ? 'Per Video' : 
                            campaign.budget_unit})
                        </span>
                      )}
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
                    
                    {/* Add Sample Video URL display */}
                    {campaign.sample_video_url && (
                      <div className="flex items-center text-sm text-blue-600 hover:text-blue-800">
                        <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <a 
                          href={campaign.sample_video_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          View Sample Video
                        </a>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{campaign.brief}</p>
                  
                  {/* Application status message */}
                  {applicationSuccess !== null && applyingTo === campaign.id && (
                    <div className={`mb-4 p-2 text-sm rounded ${
                      applicationSuccess 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {applicationMessage}
                    </div>
                  )}
                  
                  <div className="mt-4 flex space-x-2">
                    <Link
                      href={`/campaigns/${campaign.id}`}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    >
                      View Details
                    </Link>
                    {status === 'authenticated' ? (
                      canApply ? (
                        <button
                          onClick={() => handleApply(campaign.id, campaign.title)}
                          disabled={applyingTo === campaign.id}
                          className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white 
                            ${applyingTo === campaign.id
                              ? 'bg-purple-400 cursor-not-allowed'
                              : 'bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500'
                            }`}
                        >
                          {applyingTo === campaign.id ? 'Applying...' : 'Apply Now'}
                        </button>
                      ) : (
                        <div className="text-sm text-amber-600 mb-2">
                          Only creator accounts can apply to campaigns.
                        </div>
                      )
                    ) : (
                      <Link
                        href="/login"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                      >
                        Log in to Apply
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Application Modal - Ensure it's properly rendered with high z-index */}
      {showModal && selectedCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
            <h2 className="text-xl font-bold mb-4">Apply to Campaign: {selectedCampaign.title}</h2>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Please provide additional information to support your application:
              </p>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sample Script or Content Idea
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                rows={4}
                placeholder="Share your content idea or script for this campaign..."
                value={sampleText}
                onChange={(e) => setSampleText(e.target.value)}
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sample Video URL (optional)
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                placeholder="e.g., https://www.youtube.com/watch?v=example"
                value={sampleVideoUrl}
                onChange={(e) => setSampleVideoUrl(e.target.value)}
              />
              <p className="mt-1 text-xs text-gray-500">
                Link to a previous video that demonstrates your content style
              </p>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  console.log("Modal close button clicked");
                  closeModal();
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  console.log("Submit button clicked");
                  submitApplication();
                }}
                disabled={submitting || !sampleText.trim()}
                className={`px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                  submitting || !sampleText.trim()
                    ? 'bg-purple-400 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500'
                }`}
              >
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
