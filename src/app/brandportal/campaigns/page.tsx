'use client';

import { useState, useEffect } from 'react';
import { Clock, DollarSign, Users, Filter, Search } from 'lucide-react';
import CreateCampaignModal from '@/components/campaigns/CreateCampaignModal';
import Link from 'next/link';
import Image from 'next/image';

interface Campaign {
  id: string;
  title: string;
  description: string;
  budget: number;
  requirements: string | null;
  deadline: string;
  status: string;
  applications: Array<{
    id: string;
    status: string;
    creator: {
      user: {
        name: string;
        image: string | null;
      }
    }
  }>;
}

export default function Campaigns() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/brand/campaigns');
      
      if (!response.ok) {
        throw new Error('Failed to fetch campaigns');
      }

      const data = await response.json();
      setCampaigns(data);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      setError('Failed to load campaigns. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCampaign = async (formData: any) => {
    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to create campaign');
      }

      setIsCreateModalOpen(false);
      fetchCampaigns(); // Refresh the campaigns list
    } catch (error) {
      console.error('Error creating campaign:', error);
    }
  };

  const filteredCampaigns = campaigns.filter(campaign =>
    campaign.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    campaign.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between backdrop-blur-xl bg-white/50 p-6 rounded-2xl border border-white/20 shadow-lg">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Campaigns
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your ongoing and past campaigns
          </p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
        >
          + Campaign
        </button>
      </div>

      <CreateCampaignModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateCampaign}
      />

      {/* Filters */}
      <div className="flex items-center space-x-4 mt-6">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full rounded-xl border border-white/20 bg-white/50 backdrop-blur-xl py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Search campaigns..."
          />
        </div>
      </div>

      {/* Campaigns Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-600">{error}</p>
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No campaigns found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCampaigns.map((campaign) => (
            <Link
              key={campaign.id}
              href={`/brandportal/campaigns/${campaign.id}`}
              className="block transition-transform hover:scale-[1.02]"
            >
              <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold text-gray-900">{campaign.title}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      campaign.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                      campaign.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {campaign.status.charAt(0) + campaign.status.slice(1).toLowerCase()}
                    </span>
                  </div>
                  
                  <p className="mt-2 text-sm text-gray-600 line-clamp-2">{campaign.description}</p>
                  
                  <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-1" />
                      <span>${campaign.budget.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{new Date(campaign.deadline).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      <span>{campaign.applications.length}</span>
                    </div>
                  </div>

                  {campaign.applications.length > 0 && (
                    <div className="mt-4 flex -space-x-2">
                      {campaign.applications.slice(0, 3).map((application) => (
                        <div key={application.id} className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-white">
                          <Image
                            src={application.creator.user.image || "/images/placeholder-40.svg"}
                            alt={application.creator.user.name}
                            fill
                            className="object-cover"
                            sizes="32px"
                          />
                        </div>
                      ))}
                      {campaign.applications.length > 3 && (
                        <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs text-gray-600">
                          +{campaign.applications.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
