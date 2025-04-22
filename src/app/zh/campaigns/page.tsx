'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';

// Mock data - replace with actual API calls
const mockCampaigns = [
  {
    id: 1,
    title: "夏季时尚系列发布",
    brand: "StyleCo",
    budget: "￥7,000-￥14,000",
    commission: "每笔销售15%",
    platform: "Instagram",
    requirements: "拥有10K+粉丝的时尚与生活方式创作者",
    deadline: "2024-02-28",
    description: "寻找时尚达人通过创意帖子和故事展示我们的新夏季系列。",
    status: "进行中"
  },
  {
    id: 2,
    title: "健康生活挑战赛",
    brand: "FitLife",
    budget: "￥3,500-￥7,000",
    commission: "每笔销售20%",
    platform: "TikTok",
    requirements: "拥有20K+粉丝的健身与健康创作者",
    deadline: "2024-03-15",
    description: "30天健身挑战活动，推广我们的营养补充剂和健身器材。",
    status: "进行中"
  },
  // Add more mock campaigns as needed
];

export default function CampaignsChinese() {
  const { data: session } = useSession();
  const [searchTerm, setSearchTerm] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const filteredCampaigns = mockCampaigns.filter(campaign => {
    const matchesSearch = campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlatform = platformFilter === 'all' || campaign.platform.toLowerCase() === platformFilter;
    return matchesSearch && matchesPlatform;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-purple-900 text-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-extrabold">活跃广告活动</h1>
          <p className="mt-2 text-lg">查找并申请与您个人资料匹配的品牌活动</p>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="搜索活动..."
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
              <option value="all">所有平台</option>
              <option value="instagram">Instagram</option>
              <option value="tiktok">TikTok</option>
              <option value="youtube">YouTube</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-500 shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="all">所有类别</option>
              <option value="fashion">时尚</option>
              <option value="beauty">美妆</option>
              <option value="fitness">健身</option>
              <option value="tech">科技</option>
            </select>
          </div>
        </div>
      </div>

      {/* Campaign List */}
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCampaigns.map((campaign) => (
            <div key={campaign.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">{campaign.title}</h2>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {campaign.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-4">来自 {campaign.brand}</p>
                <div className="space-y-2 mb-4">
                  {session ? (
                    <div className="flex items-center text-sm text-gray-500">
                      <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {campaign.budget}
                    </div>
                  ) : (
                    <div className="flex items-center text-sm text-gray-500">
                      <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {campaign.commission}
                    </div>
                  )}
                  <div className="flex items-center text-sm text-gray-500">
                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    截止日期: {campaign.deadline}
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {campaign.platform}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">{campaign.description}</p>
                <div className="mt-4">
                  {session ? (
                    <a
                      href={`/zh/campaigns/${campaign.id}`}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    >
                      查看详情
                    </a>
                  ) : (
                    <a
                      href="/zh/login"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    >
                      申请
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
