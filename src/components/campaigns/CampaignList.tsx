'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Platform, PLATFORMS, PLATFORM_LABELS } from '@/types/platform';
import { Category, CATEGORIES, CATEGORY_LABELS } from '@/types/category';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Image from 'next/image';

interface Brand {
  name: string;
  logo: string;
}

interface Campaign {
  id: string;
  brand: Brand;
  title: string;
  description: string;
  platform: Platform[];
  category: Category;
  compensation: string;
  startDate: Date;
  endDate: Date;
  deadline: string;
  status?: string;
  requirements: string[];
  createdAt: Date;
  platformIds: string[];
  categories: string;
  deliverables: string;
  budget: number;
}

interface CampaignListProps {
  currentCampaigns: Campaign[];
  availableCampaigns: Campaign[];
}

export function CampaignList({ currentCampaigns, availableCampaigns }: CampaignListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [platformFilter, setPlatformFilter] = useState<'all' | Platform>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | Category>('all');

  const filterCampaigns = (campaigns: Campaign[]): Campaign[] => {
    return campaigns.filter(campaign => {
      const matchesSearch = 
        campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.brand.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesPlatform =
        platformFilter === 'all' ||
        campaign.platformIds.includes(platformFilter);
      
      const matchesCategory =
        categoryFilter === 'all' ||
        JSON.parse(campaign.categories).includes(categoryFilter);

      return matchesSearch && matchesPlatform && matchesCategory;
    });
  };

  const filteredCurrentCampaigns = filterCampaigns(currentCampaigns);
  const filteredAvailableCampaigns = filterCampaigns(availableCampaigns);

  return (
    <div>
      {/* Filters */}
      <div className="bg-primary-light/30 rounded-lg p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search campaigns..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-4">
            <select
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 bg-white"
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value as 'all' | Platform)}
            >
              <option value="all">All Platforms</option>
              {PLATFORMS.map(platform => (
                <option key={platform} value={platform}>
                  {PLATFORM_LABELS[platform]}
                </option>
              ))}
            </select>
            <select
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 bg-white"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as 'all' | Category)}
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map(category => (
                <option key={category} value={category}>
                  {CATEGORY_LABELS[category]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <Tabs defaultValue="available" className="space-y-4">
          <TabsList className="bg-gray-100/80 p-1 rounded-lg">
            <TabsTrigger value="current" className="rounded-md px-6 py-2 data-[state=active]:bg-white">My Campaigns</TabsTrigger>
            <TabsTrigger value="available" className="rounded-md px-6 py-2 data-[state=active]:bg-white">Available Campaigns</TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="space-y-4">
            {filteredCurrentCampaigns.length === 0 ? (
              <div className="text-center py-12 bg-gray-50/50 rounded-lg">
                <p className="text-gray-600">No campaigns found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCurrentCampaigns.map((campaign) => (
                  <CampaignCard 
                    key={campaign.id} 
                    campaign={campaign}
                    type="current"
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="available" className="space-y-4">
            {filteredAvailableCampaigns.length === 0 ? (
              <div className="text-center py-12 bg-gray-50/50 rounded-lg">
                <p className="text-gray-600">No campaigns found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAvailableCampaigns.map((campaign) => (
                  <CampaignCard 
                    key={campaign.id} 
                    campaign={campaign}
                    type="available"
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function CampaignCard({ campaign, type }: { campaign: Campaign, type: 'current' | 'available' }) {
  const router = useRouter();
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApply = async () => {
    try {
      setIsApplying(true);
      setError(null);
      
      const response = await fetch('/api/creator/campaigns/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaignId: campaign.id
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to apply for campaign');
      }

      router.refresh();
    } catch (error) {
      console.error('Error applying for campaign:', error);
      setError(error instanceof Error ? error.message : 'Failed to apply for campaign');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-white to-primary-light/5 rounded-lg p-6 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="relative w-12 h-12">
            <Image
              src={campaign.brand.logo}
              alt={campaign.brand.name}
              fill
              className="rounded-full object-cover"
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{campaign.title}</h3>
            <p className="text-sm font-medium text-indigo-600">{campaign.brand.name}</p>
          </div>
        </div>
        {type === 'current' ? (
          <div className="flex items-center gap-2">
            {campaign.status && (
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                campaign.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                campaign.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                campaign.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {campaign.status.charAt(0) + campaign.status.slice(1).toLowerCase()}
              </span>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={handleApply}
              disabled={isApplying}
              className={`px-4 py-2 rounded-md text-sm font-medium text-white ${
                isApplying
                  ? 'bg-indigo-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {isApplying ? 'Applying...' : 'Apply Now'}
            </button>
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>
        )}
      </div>

      <div className="mt-4">
        <p className="text-gray-600">{campaign.description}</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {campaign.platformIds.map((platformId) => (
          <span
            key={platformId}
            className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
          >
            {PLATFORM_LABELS[platformId as Platform]}
          </span>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-500">Budget</p>
          <p className="font-medium text-gray-900">{campaign.compensation}</p>
        </div>
        <div>
          <p className="text-gray-500">Deadline</p>
          <p className="font-medium text-gray-900">{campaign.deadline}</p>
        </div>
      </div>

      {campaign.requirements.length > 0 && (
        <div className="mt-4">
          <p className="text-gray-500 text-sm mb-2">Requirements</p>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            {campaign.requirements.map((req, index) => (
              <li key={index}>{req}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
