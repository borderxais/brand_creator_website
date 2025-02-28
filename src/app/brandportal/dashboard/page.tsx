'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { MessageSquare } from 'lucide-react';
import { DollarSign, Users, ShoppingBag, TrendingUp, Plus, Target, Smile } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Link from 'next/link';
import CreateCampaignModal from '@/components/campaigns/CreateCampaignModal';

const revenueData = [
  { name: 'Jan', revenue: 4000 },
  { name: 'Feb', revenue: 3000 },
  { name: 'Mar', revenue: 5000 },
  { name: 'Apr', revenue: 4500 },
  { name: 'May', revenue: 6000 },
  { name: 'Jun', revenue: 5500 },
  { name: 'Jul', revenue: 7000 },
];

const stats = [
  { name: 'Total Revenue', value: '$45,231', change: '+20.1%', trend: 'up', icon: DollarSign },
  { name: 'Active Creators', value: '2,345', change: '+15.2%', trend: 'up', icon: Users },
  { name: 'Products Promoted', value: '12,543', change: '+12.3%', trend: 'up', icon: ShoppingBag },
  { name: 'Conversion Rate', value: '3.8%', change: '-2.1%', trend: 'down', icon: TrendingUp },
];

const topCreators = [
  {
    name: 'Sarah Johnson',
    handle: '@sarahjstyle',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    engagement: '4.8%',
    followers: '125K',
    category: 'Fashion & Lifestyle',
    recentPost: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200'
  },
  {
    name: 'Michael Chen',
    handle: '@techreviewmike',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    engagement: '5.2%',
    followers: '89K',
    category: 'Tech Reviews',
    recentPost: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200'
  },
  {
    name: 'Emma Rodriguez',
    handle: '@emmafitness',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100',
    engagement: '6.1%',
    followers: '250K',
    category: 'Fitness & Health',
    recentPost: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=200'
  },
  {
    name: 'David Kim',
    handle: '@davidtravels',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
    engagement: '4.5%',
    followers: '180K',
    category: 'Travel & Adventure',
    recentPost: 'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=200'
  }
];

const activeCampaigns = [
  {
    title: 'Summer Collection Launch',
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=200',
    status: 'Active',
    progress: 75,
    creators: 12,
    budget: '$5,000',
    endDate: '2024-03-15'
  },
  {
    title: 'Tech Gadget Review Series',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200',
    status: 'Active',
    progress: 45,
    creators: 8,
    budget: '$3,500',
    endDate: '2024-03-20'
  },
  {
    title: 'Fitness Challenge Campaign',
    image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=200',
    status: 'Active',
    progress: 60,
    creators: 15,
    budget: '$4,200',
    endDate: '2024-03-25'
  }
];

const topCategories = [
  {
    name: 'Fashion & Style',
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=200',
    growth: '+25%',
    engagement: '4.8%',
    creators: 856,
    campaigns: 12,
    revenue: '$25.2K'
  },
  {
    name: 'Tech & Gaming',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200',
    growth: '+18%',
    engagement: '5.2%',
    creators: 634,
    campaigns: 8,
    revenue: '$18.7K'
  },
  {
    name: 'Health & Fitness',
    image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=200',
    growth: '+22%',
    engagement: '4.5%',
    creators: 742,
    campaigns: 10,
    revenue: '$21.5K'
  },
  {
    name: 'Travel & Adventure',
    image: 'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=200',
    growth: '+15%',
    engagement: '4.2%',
    creators: 528,
    campaigns: 6,
    revenue: '$15.8K'
  }
];

export default function BrandDashboard() {
  const { data: session } = useSession();
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
      // TODO: Refresh dashboard data
    } catch (error) {
      console.error('Error creating campaign:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between backdrop-blur-xl bg-white/50 p-6 rounded-2xl border border-white/20 shadow-lg">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Welcome back, {session?.user?.name}! <Smile className="inline h-10 w-10 mx-1" />
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Here's what's happening with your campaigns today
            </p>
          </div>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
          >
            <Plus className="h-5 w-5 mr-2" />
            New Campaign
          </button>
        </div>

        <CreateCampaignModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateCampaign}
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
          {stats.map((stat) => (
            <div
              key={stat.name}
              className="overflow-hidden rounded-2xl backdrop-blur-xl bg-white/50 border border-white/20 p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
            >
              <dt className="text-sm font-medium text-gray-600 truncate">{stat.name}</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">{stat.value}</dd>
              <div className="mt-2 flex items-center text-sm">
                <span className={stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}>
                  {stat.change}
                </span>
                <span className="ml-2 text-gray-600">from last month</span>
              </div>
            </div>
          ))}
        </div>

        {/* Revenue Trend */}
        <div className="mt-8 overflow-hidden rounded-2xl backdrop-blur-xl bg-white/50 border border-white/20 p-6 shadow-lg">
          <h2 className="text-lg font-semibold text-gray-900">Revenue Trend</h2>
          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3B82F6"
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Categories */}
        <div className="mt-8 rounded-2xl backdrop-blur-xl bg-white/50 border border-white/20 p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4 bg-gradient-to-r from-gray-900 to-purple-600 bg-clip-text text-transparent">
            Top Categories
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {topCategories.map((category) => (
              <div
                key={category.name}
                className="relative overflow-hidden rounded-2xl backdrop-blur-xl bg-white/50 border border-white/20 p-6 shadow-lg"
              >
                <div className="absolute inset-0">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20" />
                </div>
                <div className="relative p-4">
                  <div className="flex flex-col h-full justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">
                        {category.name}
                      </h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {category.growth} growth
                      </span>
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-200">Revenue</span>
                        <span className="text-white font-medium">{category.revenue}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-200">Creators</span>
                        <span className="text-white font-medium">{category.creators}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-200">Engagement</span>
                        <span className="text-white font-medium">{category.engagement}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-200">Campaigns</span>
                        <span className="text-white font-medium">{category.campaigns}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Top Creators */}
          <div className="overflow-hidden rounded-2xl backdrop-blur-xl bg-white/50 border border-white/20 p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Top Creators</h2>
              <Link href="/brandportal/creators/partnered" className="text-sm text-blue-600 hover:text-blue-700">View All</Link>
            </div>
            <div className="space-y-4">
              {topCreators.map((creator) => (
                <div key={creator.handle} className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <img
                    src={creator.avatar}
                    alt={creator.name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{creator.name}</p>
                    <p className="text-sm text-gray-500 truncate">{creator.handle}</p>
                    <p className="text-xs text-gray-500">{creator.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{creator.followers}</p>
                    <p className="text-xs text-gray-500">followers</p>
                    <p className="text-xs text-green-600">{creator.engagement} eng.</p>
                  </div>
                  <img
                    src={creator.recentPost}
                    alt="Recent post"
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Active Campaigns */}
          <div className="overflow-hidden rounded-2xl backdrop-blur-xl bg-white/50 border border-white/20 p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Active Campaigns</h2>
              <Link href="/brandportal/campaigns" className="text-sm text-blue-600 hover:text-blue-700">View All</Link>
            </div>
            <div className="space-y-4">
              {activeCampaigns.map((campaign) => (
                <div key={campaign.title} className="flex space-x-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <img
                    src={campaign.image}
                    alt={campaign.title}
                    className="h-20 w-20 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900">{campaign.title}</h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {campaign.status}
                      </span>
                    </div>
                    <div className="mt-2">
                      <div className="flex items-center text-sm text-gray-500">
                        <Target className="h-4 w-4 mr-1" />
                        <span>{campaign.progress}% complete</span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                        <span>{campaign.creators} creators</span>
                        <span>{campaign.budget}</span>
                        <span>Ends {campaign.endDate}</span>
                      </div>
                    </div>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full"
                        style={{ width: `${campaign.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="relative rounded-lg border border-gray-300 bg-white/50 px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
            <div className="flex-shrink-0">
              <TrendingUp className="h-6 w-6 text-gray-400" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <Link href="/brandportal/analytics" className="focus:outline-none">
                <span className="absolute inset-0" aria-hidden="true" />
                <p className="text-sm font-medium text-gray-900">View Analytics</p>
                <p className="text-sm text-gray-500">Get detailed insights about your campaigns</p>
              </Link>
            </div>
          </div>

          <div className="relative rounded-lg border border-gray-300 bg-white/50 px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
            <div className="flex-shrink-0">
              <MessageSquare className="h-6 w-6 text-gray-400" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <Link href="/brandportal/messages" className="focus:outline-none">
                <span className="absolute inset-0" aria-hidden="true" />
                <p className="text-sm font-medium text-gray-900">Creator Messages</p>
                <p className="text-sm text-gray-500">Check messages from your creators</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
