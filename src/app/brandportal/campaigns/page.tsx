'use client';

import { useState, useEffect } from 'react';
import { Clock, DollarSign, Users, Tag, Filter, Search } from 'lucide-react';
import CreateCampaignModal from '@/components/campaigns/CreateCampaignModal';
import Image from 'next/image';

interface Campaign {
  id: string;
  title: string;
  description: string;
  budget: number;
  requirements: string | null;
  startDate: Date;
  endDate: Date;
  status: string;
  categories: string;
  deliverables: string;
  platformIds: string[];
  brand: {
    companyName: string;
  };
  applications: Array<{
    id: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

function CampaignCard({ campaign }: { campaign: Campaign }) {
  const requirements = campaign.requirements ? JSON.parse(campaign.requirements).list : [];
  const categories = JSON.parse(campaign.categories);
  const deliverables = JSON.parse(campaign.deliverables);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-4">
          <div className="relative w-12 h-12">
            <Image
              src="/images/placeholder.svg"
              alt={campaign.brand.companyName}
              fill
              className="rounded-full object-cover"
            />
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">{campaign.title}</h3>
            <p className="text-gray-600 mb-4">{campaign.description}</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm ${
          campaign.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
          campaign.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' :
          campaign.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
          'bg-red-100 text-red-800'
        }`}>
          {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1).toLowerCase()}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center">
          <Clock className="w-5 h-5 text-gray-400 mr-2" />
          <div>
            <p className="text-sm text-gray-600">Duration</p>
            <p className="font-medium">
              {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center">
          <DollarSign className="w-5 h-5 text-gray-400 mr-2" />
          <div>
            <p className="text-sm text-gray-600">Budget</p>
            <p className="font-medium">${campaign.budget.toLocaleString()}</p>
          </div>
        </div>
        <div className="flex items-center">
          <Users className="w-5 h-5 text-gray-400 mr-2" />
          <div>
            <p className="text-sm text-gray-600">Applications</p>
            <p className="font-medium">{campaign.applications.length}</p>
          </div>
        </div>
        <div className="flex items-center">
          <Tag className="w-5 h-5 text-gray-400 mr-2" />
          <div>
            <p className="text-sm text-gray-600">Categories</p>
            <p className="font-medium">{categories.join(', ')}</p>
          </div>
        </div>
      </div>

      <div className="border-t pt-4">
        <h4 className="font-medium mb-2">Requirements:</h4>
        <ul className="list-disc list-inside text-gray-600">
          {requirements.map((req: string, index: number) => (
            <li key={index}>{req}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function Campaigns() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [platforms, setPlatforms] = useState([]);

  useEffect(() => {
    fetchPlatforms();
    fetchCampaigns();
  }, []);

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
      const response = await fetch('/api/brand/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to create campaign');
      }

      await fetchCampaigns();
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert('Failed to create campaign. Please try again.');
    }
  };

  const filteredCampaigns = campaigns.filter(campaign =>
    campaign.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    campaign.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Campaigns</h1>
          <p className="text-gray-600">Manage your campaigns and track their performance</p>
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
        platforms={platforms}
      />

      <div className="mb-6 flex gap-4">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
          <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
        </div>
        <button className="px-4 py-2 border rounded-lg flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Filter
        </button>
      </div>

      <div className="space-y-4">
        {filteredCampaigns.map(campaign => (
          <CampaignCard key={campaign.id} campaign={campaign} />
        ))}
      </div>
    </div>
  );
}
