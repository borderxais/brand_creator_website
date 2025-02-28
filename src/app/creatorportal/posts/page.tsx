'use client';

import { useState } from 'react';
import { Search, Filter, Instagram, Youtube, Image as ImageIcon, TrendingUp, DollarSign, MessageSquare } from 'lucide-react';

const mockPosts = [
  {
    id: 1,
    platform: 'Instagram',
    type: 'Post',
    title: 'Spring Collection Showcase',
    image: '/images/placeholder-400.svg',
    caption: 'Loving this new collection from @StyleCo! The quality is amazing 🌟 #ad #StyleCoPartner',
    publishDate: '2024-01-28',
    metrics: {
      likes: 1520,
      comments: 89,
      shares: 45,
      reach: '15.2K',
      engagement: '4.8%',
      earnings: '$450'
    },
    campaign: 'StyleCo Spring Collection',
    status: 'Published'
  },
  {
    id: 2,
    platform: 'TikTok',
    type: 'Video',
    title: 'Summer Vibes',
    image: '/images/placeholder-400.svg',
    caption: 'How I style these amazing pieces from @BeautyBrand ✨ #sponsored #BeautyBrandPartner',
    publishDate: '2024-01-25',
    metrics: {
      likes: 2250,
      comments: 156,
      shares: 89,
      reach: '22.5K',
      engagement: '5.2%',
      earnings: '$600'
    },
    campaign: 'BeautyBrand Summer Launch',
    status: 'Published'
  },
  {
    id: 3,
    platform: 'Instagram',
    type: 'Reel',
    title: 'Autumn Lookbook',
    image: '/images/placeholder-400.svg',
    caption: 'Quick morning routine with @BeautyBrand new skincare line! 💫 #ad',
    publishDate: '2024-01-20',
    metrics: {
      likes: 1850,
      comments: 134,
      shares: 67,
      reach: '18.7K',
      engagement: '4.5%',
      earnings: '$550'
    },
    campaign: 'BeautyBrand Skincare',
    status: 'Published'
  },
  {
    id: 4,
    platform: 'Instagram',
    type: 'Story',
    title: 'Winter Collection',
    image: '/images/placeholder-400.svg',
    caption: "Behind the scenes of today's shoot! 📸 #comingsoon",
    publishDate: 'Draft',
    metrics: {
      likes: 0,
      comments: 0,
      shares: 0,
      reach: '-',
      engagement: '-',
      earnings: '$0'
    },
    campaign: 'FitLife Challenge',
    status: 'Draft'
  }
];

export default function CreatorPosts() {
  const [searchTerm, setSearchTerm] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredPosts = mockPosts.filter(post => {
    const matchesSearch = post.caption.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.campaign.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlatform = platformFilter === 'all' || post.platform.toLowerCase() === platformFilter.toLowerCase();
    const matchesType = typeFilter === 'all' || post.type.toLowerCase() === typeFilter.toLowerCase();
    const matchesStatus = statusFilter === 'all' || post.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesPlatform && matchesType && matchesStatus;
  });

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return Instagram;
      case 'youtube':
        return Youtube;
      default:
        return ImageIcon;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900">Content Posts</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage and track performance of your content across platforms
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search posts..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <select
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
              >
                <option value="all">All Platforms</option>
                <option value="instagram">Instagram</option>
                <option value="tiktok">TikTok</option>
                <option value="youtube">YouTube</option>
              </select>
              <select
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="post">Posts</option>
                <option value="video">Videos</option>
                <option value="reel">Reels</option>
                <option value="story">Stories</option>
              </select>
              <select
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPosts.map((post) => {
          const PlatformIcon = getPlatformIcon(post.platform);
          return (
            <div key={post.id} className="bg-white shadow rounded-lg overflow-hidden">
              {/* Post Image */}
              <div className="relative aspect-square">
                <img
                  src={post.image}
                  alt={`Post ${post.id}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4 flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs font-semibold rounded ${
                    post.status === 'Published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {post.status}
                  </span>
                </div>
                <div className="absolute top-4 right-4">
                  <PlatformIcon className="h-6 w-6 text-white drop-shadow-lg" />
                </div>
              </div>

              {/* Post Details */}
              <div className="p-4">
                <div className="mb-4">
                  <p className="text-sm text-gray-900 line-clamp-2">{post.caption}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    Campaign: {post.campaign}
                  </p>
                  <p className="text-xs text-gray-500">
                    {post.publishDate}
                  </p>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-4 py-3 border-t border-gray-200">
                  <div className="text-center">
                    <TrendingUp className="h-4 w-4 mx-auto text-gray-400" />
                    <p className="mt-1 text-xs font-medium text-gray-900">{post.metrics.reach}</p>
                    <p className="text-xs text-gray-500">Reach</p>
                  </div>
                  <div className="text-center">
                    <MessageSquare className="h-4 w-4 mx-auto text-gray-400" />
                    <p className="mt-1 text-xs font-medium text-gray-900">{post.metrics.engagement}</p>
                    <p className="text-xs text-gray-500">Engagement</p>
                  </div>
                  <div className="text-center">
                    <DollarSign className="h-4 w-4 mx-auto text-gray-400" />
                    <p className="mt-1 text-xs font-medium text-gray-900">{post.metrics.earnings}</p>
                    <p className="text-xs text-gray-500">Earnings</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Post Button */}
      <div className="fixed bottom-8 right-8">
        <button
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <ImageIcon className="h-5 w-5 mr-2" />
          Create Post
        </button>
      </div>
    </div>
  );
}
