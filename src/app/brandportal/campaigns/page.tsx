'use client';

import { useState } from 'react';
import { Clock, DollarSign, Users, Filter, Search } from 'lucide-react';
import CreateCampaignModal from '@/components/campaigns/CreateCampaignModal';
import Link from 'next/link';
import { Category } from '@/types/category';
import { CategorySelector } from '@/components/ui/CategorySelector';

const campaigns = [
  {
    id: 1,
    title: 'Summer Fashion Collection Launch',
    brand: 'StyleCo',
    image: '/images/campaign1.jpg',
    description: 'Promote our new summer collection focusing on sustainable fashion and beachwear.',
    platforms: ['Instagram', 'TikTok'],
    commission: '15% per sale',
    deadline: '2024-04-15',
    applicants: 24,
    status: 'Active',
    requirements: [
      'Minimum 10K followers',
      'Fashion or lifestyle content focus',
      'High engagement rate (>3%)',
      'Previous collaboration experience'
    ]
  },
  {
    id: 2,
    title: 'Gaming Peripherals Review',
    brand: 'TechGear',
    commission: '20% per sale + $500 base',
    deadline: '2024-04-20',
    applicants: 18,
    requirements: [
      'Minimum 50K followers',
      'Gaming content focus',
      'High engagement rate (>2%)',
      'Previous review experience'
    ],
    status: 'Active',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800',
    category: 'Technology',
    platforms: ['YouTube', 'Twitch'],
    description: 'Seeking tech reviewers to showcase our new line of gaming peripherals. Must have experience in tech reviews and gaming content.',
    deliverables: ['1 detailed review video', '2 livestream features'],
    currentParticipants: [
      {
        name: 'Michael Chen',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
        followers: '89K'
      }
    ]
  },
  {
    id: 3,
    title: 'Healthy Lifestyle Campaign',
    brand: 'VitaFit',
    commission: '25% per sale',
    deadline: '2024-05-01',
    applicants: 32,
    requirements: [
      'Minimum 20K followers',
      'Fitness or wellness content focus',
      'High engagement rate (>2%)',
      'Previous collaboration experience'
    ],
    status: 'Active',
    image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800',
    category: 'Fitness',
    platforms: ['Instagram', 'YouTube'],
    description: 'Looking for fitness enthusiasts to promote our new line of supplements and workout equipment.',
    deliverables: ['4 Instagram posts', '2 YouTube videos', '3 Instagram stories'],
    currentParticipants: [
      {
        name: 'David Kim',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
        followers: '180K'
      }
    ]
  },
  {
    id: 4,
    title: 'Travel Photography Series',
    brand: 'Wanderlust',
    commission: '18% per sale + $1000 base',
    deadline: '2024-05-15',
    applicants: 45,
    requirements: [
      'Minimum 30K followers',
      'Travel photography content focus',
      'High engagement rate (>2%)',
      'Previous collaboration experience'
    ],
    status: 'Scheduled',
    image: 'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=800',
    category: 'Travel',
    platforms: ['Instagram', 'YouTube'],
    description: 'Seeking travel content creators to showcase destinations using our photography gear.',
    deliverables: ['6 Instagram posts', '1 YouTube video', '4 Instagram stories'],
    currentParticipants: [
      {
        name: 'Sophia Patel',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
        followers: '320K'
      }
    ]
  },
  {
    id: 5,
    title: 'Skincare Routine Challenge',
    brand: 'GlowUp',
    commission: '22% per sale',
    deadline: '2024-05-10',
    applicants: 29,
    requirements: [
      'Minimum 15K followers',
      'Skincare content focus',
      'High engagement rate (>2%)',
      'Previous collaboration experience'
    ],
    status: 'Draft',
    image: 'https://images.unsplash.com/photo-1576426863848-c21f53c60b19?w=800',
    category: 'Beauty',
    platforms: ['Instagram', 'TikTok', 'YouTube'],
    description: 'Looking for skincare enthusiasts to participate in our 30-day skincare challenge.',
    deliverables: ['30 daily updates', '1 final review video', '4 tutorial posts'],
    currentParticipants: []
  }
];

const platforms = [
  { id: 'instagram', name: 'Instagram' },
  { id: 'tiktok', name: 'TikTok' },
  { id: 'youtube', name: 'YouTube' },
  { id: 'weibo', name: 'Weibo' },
  { id: 'xiaohongshu', name: 'Xiaohongshu' },
  { id: 'douyin', name: 'Douyin' }
];

export default function Campaigns() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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
      // TODO: Refresh campaigns list
    } catch (error) {
      console.error('Error creating campaign:', error);
    }
  };

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
            className="block w-full rounded-xl border border-white/20 bg-white/50 backdrop-blur-xl py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Search campaigns..."
          />
        </div>
        <select className="rounded-xl border border-white/20 bg-white/50 backdrop-blur-xl py-2 pl-3 pr-10 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 w-48">
          <option>All Status</option>
          <option>Active</option>
          <option>Completed</option>
          <option>Draft</option>
        </select>
        <button className="flex items-center rounded-xl border border-white/20 bg-white/50 backdrop-blur-xl px-4 py-2 text-sm text-gray-700 hover:bg-white/80 transition-all duration-300">
          <Filter className="h-5 w-5 mr-2 text-gray-400" />
          More Filters
        </button>
      </div>

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 gap-6 mt-6">
        {campaigns.map((campaign) => (
          <div
            key={campaign.id}
            className="relative overflow-hidden rounded-2xl backdrop-blur-xl bg-white/50 border border-white/20 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
          >
            <label className={`absolute top-4 right-4 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
              campaign.status === 'Active' ? 'bg-green-100 text-green-800' :
              campaign.status === 'Completed' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {campaign.status}
            </label>
            <div className="p-6">
              <div className="flex items-start space-x-4">
                <img
                  src={campaign.image}
                  alt={campaign.title}
                  className="h-20 w-20 rounded-xl object-cover"
                />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {campaign.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1 max-w-xl">{campaign.description}</p>
                  <div className="flex items-center mt-2 space-x-2">
                    {campaign.platforms.map((platform) => (
                      <span key={platform} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        {platform}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="flex items-center">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                  <div className="ml-2">
                    <dt className="text-sm font-medium text-gray-500">Commission</dt>
                    <dd className="text-sm font-semibold text-green-600">{campaign.commission}</dd>
                  </div>
                </div>
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <div className="ml-2">
                    <dt className="text-sm font-medium text-gray-500">Deadline</dt>
                    <dd className="text-sm text-gray-900">{new Date(campaign.deadline).toLocaleDateString()}</dd>
                  </div>
                </div>
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-gray-400" />
                  <div className="ml-2">
                    <dt className="text-sm font-medium text-gray-500">Applicants</dt>
                    <dd className="text-sm text-gray-900">{campaign.applicants} influencers</dd>
                  </div>
                </div>
              </dl>

              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-500">Requirements</h4>
                <ul className="mt-2 text-sm text-gray-900 space-y-1 list-disc list-inside">
                  {campaign.requirements.map((req, index) => (
                    <li key={index}>{req}</li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <Link 
                  href={`/brandportal/campaigns/${campaign.id}`}
                  className="rounded-xl border border-white/20 bg-white/50 backdrop-blur-xl px-4 py-2 text-sm text-gray-700 hover:bg-white/80 transition-all duration-300"
                >
                  View Campaign
                </Link>
                <button className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm text-white hover:from-blue-700 hover:to-purple-700 transition-all duration-300">
                  View Applicants
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
