'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Clock, DollarSign, Tag, Filter, Search, Calendar, X, Link as LinkIcon, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface Platform {
  id: string;
  name: string;
  displayName: string;
}

// Update Campaign interface to match the database schema
interface Campaign {
  id: string;
  brand_id: string;
  title: string;
  brief: string;
  requirements: string | null;
  budget_range: string;
  budget_unit: string;
  commission: string;
  platform: string;
  deadline: string | Date;
  max_creators: number;
  is_open: boolean;
  created_at: string | Date;
  sample_video_url: string | null;
  // Add new fields
  industry_category: string | null;
  primary_promotion_objectives: string | null;
  ad_placement: string | null;
  campaign_execution_mode: string | null;
  creator_profile_preferences_gender: string | null;
  creator_profile_preference_ethnicity: string | null;
  creator_profile_preference_content_niche: string | null;
  preferred_creator_location: string | null;
  language_requirement_for_creators: string | null;
  creator_tier_requirement: string | null;
  send_to_creator: string | null;
  approved_by_brand: string | null;
  kpi_reference_target: string | null;
  prohibited_content_warnings: string | null;
  posting_requirements: string | null;
  // Fix field name to match database
  product_photo: string | null;
  applications?: Array<{ id: string; status: string; creator_id: string; }>;
}

function CampaignCard({ campaign, onEdit, onDelete }: { 
  campaign: Campaign; 
  onEdit: (campaignId: string) => void;
  onDelete: (campaignId: string) => void;
}) {
  // Handle requirements parsing safely
  let requirements = [];
  try {
    if (campaign.posting_requirements) {
      requirements = [campaign.posting_requirements];
    } else if (campaign.requirements) {
      const parsed = JSON.parse(campaign.requirements);
      requirements = Array.isArray(parsed) ? parsed : 
                    (parsed.list && Array.isArray(parsed.list)) ? parsed.list : 
                    [String(parsed)];
    }
  } catch (e) {
    requirements = campaign.requirements ? [campaign.requirements] : [];
  }

  // Format dates safely
  const formatDate = (dateString: string | Date | undefined) => {
    if (!dateString) return 'Not set';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      return String(dateString);
    }
  };

  // Parse array fields from JSON strings
  const parseArrayField = (field: string | null): string[] => {
    if (!field) return [];
    try {
      return JSON.parse(field);
    } catch (e) {
      return field.split(',').map(item => item.trim());
    }
  };

  // Parse objectives for display
  const objectives = parseArrayField(campaign.primary_promotion_objectives);
  const contentNiches = parseArrayField(campaign.creator_profile_preference_content_niche);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold mb-2">{campaign.title || 'Untitled Campaign'}</h3>
          <p className="text-gray-600 mb-2">{campaign.brief || 'No description provided'}</p>
          <p className="text-xs text-gray-500">Created: {formatDate(campaign.created_at)}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm ${
          campaign.is_open ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {campaign.is_open ? 'Open' : 'Closed'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Original fields */}
        <div className="flex items-center">
          <Clock className="w-5 h-5 text-gray-400 mr-2" />
          <div>
            <p className="text-sm text-gray-600">Deadline</p>
            <p className="font-medium">
              {formatDate(campaign.deadline)}
            </p>
          </div>
        </div>
        <div className="flex items-center">
          <DollarSign className="w-5 h-5 text-gray-400 mr-2" />
          <div>
            <p className="text-sm text-gray-600">Budget Range</p>
            <p className="font-medium">
              {campaign.budget_range || 'Not specified'} 
              {campaign.budget_unit && (
                <span className="text-xs text-gray-500 ml-1">
                  ({campaign.budget_unit === 'total' ? 'Total' : 
                    campaign.budget_unit === 'per_person' ? 'Per Person' : 
                    campaign.budget_unit === 'per_video' ? 'Per Video' : 
                    campaign.budget_unit})
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center">
          <Tag className="w-5 h-5 text-gray-400 mr-2" />
          <div>
            <p className="text-sm text-gray-600">Platform</p>
            <p className="font-medium">{campaign.platform || 'Not specified'}</p>
          </div>
        </div>
      </div>

      {/* Additional Fields Section */}
      <div className="border-t border-gray-100 pt-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Industry Category */}
          {campaign.industry_category && (
            <div>
              <span className="text-sm font-medium text-gray-600">Industry:</span>
              <span className="ml-2 text-sm">{campaign.industry_category}</span>
            </div>
          )}

          {/* Campaign Execution Mode */}
          {campaign.campaign_execution_mode && (
            <div>
              <span className="text-sm font-medium text-gray-600">Execution:</span>
              <span className="ml-2 text-sm capitalize">{campaign.campaign_execution_mode}</span>
            </div>
          )}

          {/* Objectives - only show if we have them */}
          {objectives.length > 0 && (
            <div className="col-span-2">
              <span className="text-sm font-medium text-gray-600">Objectives:</span>
              <span className="ml-2 text-sm">{objectives.join(', ')}</span>
            </div>
          )}

          {/* Content Niches - only show if we have them */}
          {contentNiches.length > 0 && (
            <div className="col-span-2">
              <span className="text-sm font-medium text-gray-600">Content Niches:</span>
              <span className="ml-2 text-sm">{contentNiches.join(', ')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Sample Video URL section */}
      {campaign.sample_video_url && (
        <div className="mb-4 py-2 px-2 bg-gray-50 rounded">
          <p className="text-sm text-gray-600 mb-1">Sample Video:</p>
          <a 
            href={campaign.sample_video_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-sm inline-flex items-center"
          >
            <LinkIcon className="w-4 h-4 mr-1" /> View sample video
          </a>
        </div>
      )}

      {/* Product Photo section */}
      {campaign.product_photo && (
        <div className="mb-4 py-2 px-2 bg-gray-50 rounded">
          <p className="text-sm text-gray-600 mb-2">Product Photo:</p>
          <div className="flex items-center space-x-2">
            <img 
              src={campaign.product_photo}
              alt="Product"
              className="w-16 h-16 object-cover rounded border"
              onError={(e) => {
                // Fallback if image fails to load
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'block';
              }}
            />
            <div style={{ display: 'none' }} className="text-sm text-gray-500">
              Image unavailable
            </div>
            <a 
              href={campaign.product_photo}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              View full size
            </a>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-4 px-2 py-1 bg-gray-50 rounded">
        <div>
          <span className="text-sm text-gray-600">Max Creators:</span>
          <span className="ml-2 font-medium">{campaign.max_creators}</span>
        </div>
        <div>
          <span className="text-sm text-gray-600">Status:</span>
          <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
            campaign.is_open ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {campaign.is_open ? 'ACTIVE' : 'CLOSED'}
          </span>
        </div>
      </div>

      <div className="flex justify-between items-center mt-4 pt-4 border-t">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Applications:</span>
          <span className="font-medium">{campaign.applications?.length || 0}</span>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(campaign.id)}
            className="flex items-center px-3 py-1.5 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 text-sm"
          >
            <Edit className="w-4 h-4 mr-1" />
            Edit
          </button>
          <button
            onClick={() => onDelete(campaign.id)}
            className="flex items-center px-3 py-1.5 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 text-sm"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Delete
          </button>
          <a
            href={`/brandportal/campaigns/${campaign.id}/applications`}
            className="flex items-center px-3 py-1.5 text-white bg-blue-600 rounded-lg hover:bg-blue-700 text-sm"
            onClick={(e) => e.stopPropagation()}
          >
            View Applications
          </a>
        </div>
      </div>

      {/* Posting Requirements */}
      {requirements.length > 0 && (
        <div className="border-t pt-4 mt-4">
          <h4 className="font-medium mb-2">Posting Requirements:</h4>
          <ul className="list-disc list-inside text-gray-600">
            {requirements.map((req: string, index: number) => (
              <li key={index}>{req}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function Campaigns() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  
  // Campaign status options
  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'DRAFT', label: 'Draft' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' }
  ];

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
      return;
    }

    if (session.user.role !== 'BRAND') {
      router.push('/login');
      return;
    }

    fetchPlatforms();
    fetchCampaigns();
  }, [session, status, router]);

  const fetchPlatforms = async () => {
    try {
      const response = await fetch('/api/platforms');
      if (!response.ok) {
        throw new Error('Failed to fetch platforms');
      }
      const data = await response.json();
      setPlatforms(data);
    } catch (error) {
      console.error('Error fetching platforms:', error);
    }
  };

  const fetchCampaigns = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Build query parameters for filtering
      const params = new URLSearchParams();
      
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      
      // Your database doesn't have these status values; it only has is_open boolean
      if (statusFilter) {
        params.append('status', statusFilter);
      }
      
      // Your database column names use snake_case but you're sending camelCase
      if (startDateFilter) {
        params.append('startDate', startDateFilter); // Should be start_date to match Python API
      }
      
      if (endDateFilter) {
        params.append('endDate', endDateFilter); // Should be end_date to match Python API
      }
      
      const queryString = params.toString() ? `?${params.toString()}` : '';
      
      // Direct fetch from the Python API via the Next.js API route
      const response = await fetch(`/api/brand/campaigns${queryString}`);
      
      if (!response.ok) {
        console.error(`Failed to fetch campaigns: ${response.status}`);
        const data = await response.json();
        throw new Error(data.error || `Failed to fetch campaigns (status: ${response.status})`);
      }

      const data = await response.json();
      console.log('Received campaigns data:', data);
      
      // Handle both array and object with campaigns property
      const campaignsData = Array.isArray(data) ? data : (data.campaigns || []);
      setCampaigns(campaignsData);
      
      // If there's an error message but status was ok, show it as a warning
      if (!Array.isArray(data) && data.error) {
        console.warn('API Warning:', data.error);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      setError(error instanceof Error ? error.message : 'Failed to load campaigns');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterApply = () => {
    fetchCampaigns();
    setIsFilterVisible(false);
  };

  const clearFilters = () => {
    setStatusFilter('');
    setStartDateFilter('');
    setEndDateFilter('');
    setSearchQuery('');
    fetchCampaigns();
  };

  const handleEdit = (campaignId: string) => {
    router.push(`/brandportal/campaigns/${campaignId}/edit`);
  };

  const handleDelete = async (campaignId: string) => {
    if (deleteConfirm !== campaignId) {
      setDeleteConfirm(campaignId);
      return;
    }

    try {
      const response = await fetch(`/api/brand/campaigns/${campaignId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete campaign');
      }

      // Refresh the campaigns list
      fetchCampaigns();
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting campaign:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete campaign');
    }
  };

  // Server-side filtering
  const filteredCampaigns = campaigns;

  if (status === 'loading' || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== 'BRAND') {
    router.push('/login');
    return null;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-sm text-red-600 hover:text-red-800"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Campaigns</h1>
          <p className="text-gray-600">Manage your campaigns and track their performance</p>
        </div>

        <Link
          href="/brandportal/campaigns/new"
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
        >
          + Campaign
        </Link>
      </div>

      <div className="bg-white rounded-lg p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchCampaigns()}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <button 
            onClick={() => setIsFilterVisible(!isFilterVisible)}
            className="flex items-center px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </button>
          
          {(statusFilter || startDateFilter || endDateFilter) && (
            <button 
              onClick={clearFilters}
              className="flex items-center px-3 py-2 text-red-600 hover:text-red-800"
            >
              <X className="h-4 w-4 mr-1" />
              Clear filters
            </button>
          )}
        </div>
        
        {isFilterVisible && (
          <div className="mt-4 p-4 border rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {/* These options don't match your database schema */}
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="date"
                    value={startDateFilter}
                    onChange={(e) => setStartDateFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="date"
                    value={endDateFilter}
                    onChange={(e) => setEndDateFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleFilterApply}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {campaigns && campaigns.length > 0 ? (
          campaigns.map((campaign) => (
            <div key={campaign.id} className="cursor-default">
              <CampaignCard 
                campaign={campaign} 
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
              {deleteConfirm === campaign.id && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 text-sm mb-2">
                    Are you sure you want to delete "{campaign.title}"? This action cannot be undone.
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleDelete(campaign.id)}
                      className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                    >
                      Confirm Delete
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-500 mb-2">No campaigns found</p>
            <p className="text-sm text-gray-400">
              {statusFilter || startDateFilter || endDateFilter ? 
                'Try adjusting your filters or' : 'Get started by'} creating a new campaign
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
