'use client';

import { useState } from 'react';
import { Instagram, Youtube, Link as LinkIcon, Plus, Settings as SettingsIcon, RefreshCw } from 'lucide-react';

const mockConnectedAccounts = [
  {
    platform: 'Instagram',
    username: '@sarahstyle',
    followers: '50K',
    engagement: '4.8%',
    posts: 245,
    icon: Instagram,
    connected: true,
    lastSync: '2024-01-30 15:30',
    insights: {
      reachGrowth: '+12%',
      engagementRate: '4.8%',
      topPerformingContent: 'Reels',
      audienceAge: '18-34',
      audienceGender: '75% Female'
    }
  },
  {
    platform: 'TikTok',
    username: '@sarahstyle',
    followers: '75K',
    engagement: '5.2%',
    posts: 120,
    icon: Youtube,
    connected: true,
    lastSync: '2024-01-30 15:30',
    insights: {
      reachGrowth: '+18%',
      engagementRate: '5.2%',
      topPerformingContent: 'Dance',
      audienceAge: '16-24',
      audienceGender: '70% Female'
    }
  },
  {
    platform: 'YouTube',
    username: 'Sarah Style',
    followers: '25K',
    engagement: '3.9%',
    posts: 85,
    icon: Youtube,
    connected: true,
    lastSync: '2024-01-30 15:30',
    insights: {
      reachGrowth: '+8%',
      engagementRate: '3.9%',
      topPerformingContent: 'Tutorials',
      audienceAge: '18-35',
      audienceGender: '65% Female'
    }
  }
];

const availablePlatforms = [
  { name: 'Instagram', icon: Instagram },
  { name: 'TikTok', icon: Youtube },
  { name: 'YouTube', icon: Youtube },
  { name: 'Twitter', icon: LinkIcon },
  { name: 'Facebook', icon: LinkIcon },
];

export default function SocialMedia() {
  const [selectedAccount, setSelectedAccount] = useState(mockConnectedAccounts[0]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900">Social Media Accounts</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage your connected social media accounts and view insights
          </p>
        </div>
      </div>

      {/* Connected Accounts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {mockConnectedAccounts.map((account) => (
          <div
            key={account.platform}
            className={`bg-white shadow rounded-lg p-6 cursor-pointer transition-all ${
              selectedAccount.platform === account.platform ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => setSelectedAccount(account)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <account.icon className="h-8 w-8 text-gray-700" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{account.platform}</h3>
                  <p className="text-sm text-gray-500">{account.username}</p>
                </div>
              </div>
              <button
                className="p-2 text-gray-400 hover:text-gray-600"
                onClick={(e) => {
                  e.stopPropagation();
                  // Handle refresh
                }}
              >
                <RefreshCw className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-lg font-semibold text-gray-900">{account.followers}</p>
                <p className="text-xs text-gray-500">Followers</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900">{account.engagement}</p>
                <p className="text-xs text-gray-500">Engagement</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900">{account.posts}</p>
                <p className="text-xs text-gray-500">Posts</p>
              </div>
            </div>
          </div>
        ))}

        {/* Add Account Card */}
        <div className="bg-gray-50 shadow rounded-lg p-6 border-2 border-dashed border-gray-300">
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <button className="p-3 rounded-full bg-gray-100">
              <Plus className="h-6 w-6 text-gray-600" />
            </button>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-900">Connect New Account</p>
              <p className="text-xs text-gray-500">Add another social media platform</p>
            </div>
          </div>
        </div>
      </div>

      {/* Account Insights */}
      {selectedAccount && (
        <div className="bg-white shadow rounded-lg">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                {selectedAccount.platform} Insights
              </h2>
              <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                <SettingsIcon className="h-4 w-4 mr-2" />
                Account Settings
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500">Reach Growth</h3>
                <p className="mt-2 text-2xl font-semibold text-gray-900">
                  {selectedAccount.insights.reachGrowth}
                </p>
                <p className="mt-1 text-sm text-gray-500">Last 30 days</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500">Engagement Rate</h3>
                <p className="mt-2 text-2xl font-semibold text-gray-900">
                  {selectedAccount.insights.engagementRate}
                </p>
                <p className="mt-1 text-sm text-gray-500">Average per post</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500">Top Content Type</h3>
                <p className="mt-2 text-2xl font-semibold text-gray-900">
                  {selectedAccount.insights.topPerformingContent}
                </p>
                <p className="mt-1 text-sm text-gray-500">Best performing format</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500">Audience Age</h3>
                <p className="mt-2 text-2xl font-semibold text-gray-900">
                  {selectedAccount.insights.audienceAge}
                </p>
                <p className="mt-1 text-sm text-gray-500">Primary age range</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500">Audience Gender</h3>
                <p className="mt-2 text-2xl font-semibold text-gray-900">
                  {selectedAccount.insights.audienceGender}
                </p>
                <p className="mt-1 text-sm text-gray-500">Gender distribution</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500">Last Synced</h3>
                <p className="mt-2 text-2xl font-semibold text-gray-900">
                  {selectedAccount.lastSync}
                </p>
                <p className="mt-1 text-sm text-gray-500">Data updated</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Available Platforms */}
      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Available Platforms</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {availablePlatforms.map((platform) => (
              <button
                key={platform.name}
                className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <platform.icon className="h-8 w-8 text-gray-600" />
                <span className="mt-2 text-sm font-medium text-gray-900">{platform.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
