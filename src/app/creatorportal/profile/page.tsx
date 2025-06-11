'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { User, Mail, Instagram, Twitter, ShoppingCart, Heart, MessageCircle, Share2, ExternalLink, MapPin, Globe } from 'lucide-react';
import Link from 'next/link';

interface CreatorProfileData {
  user: {
    id: string;
    name: string;
    email: string;
    creatorHandleName: string;
    role: string;
  };
  profile: {
    id: string;
    bio: string;
    location: string;
    website: string;
    followers: number;
    engagementRate: number;
    categories: string[];
  };
  platforms: {
    id: string;
    platformName: string;
    platformDisplayName: string;
    handle: string;
    followers: number;
    engagementRate: number;
    isVerified: boolean;
    lastUpdated: string;
  }[];
}

export default function CreatorProfile() {
  const { data: session } = useSession();
  const [profileData, setProfileData] = useState<CreatorProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch creator profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/creator/profile');
        if (!response.ok) {
          throw new Error('Failed to fetch profile data');
        }
        const data = await response.json();
        setProfileData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile');
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.role === 'CREATOR') {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [session]);

  // Sample posts data - in real app, this would come from an API
  const posts = [
    {
      id: '1',
      content: {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800',
        caption: "My favorite summer outfit essentials! Check out these amazing pieces I've handpicked for you 🌞 #SummerStyle #Fashion"
      },
      products: [
        {
          id: 'p1',
          name: 'Summer Breeze Dress',
          price: '$89.99',
          image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200',
          url: '/product/summer-dress'
        },
        {
          id: 'p2',
          name: 'Straw Beach Hat',
          price: '$34.99',
          image: 'https://images.unsplash.com/photo-1572307480813-ceb0e59d8325?w=200',
          url: '/product/beach-hat'
        }
      ],
      likes: 1234,
      comments: 56,
      timestamp: '2h ago'
    },
    {
      id: '2',
      content: {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800',
        caption: 'Obsessed with these new jewelry pieces! Perfect for any occasion ✨ #Accessories #Style'
      },
      products: [
        {
          id: 'p3',
          name: 'Pearl Necklace Set',
          price: '$79.99',
          image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=200',
          url: '/product/pearl-necklace'
        }
      ],
      likes: 892,
      comments: 34,
      timestamp: '5h ago'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Profile Header */}
      <div className="flex items-center space-x-4">
        {session?.user?.image && (
          <img
            src={session.user.image}
            alt={session.user.name || ''}
            className="h-24 w-24 rounded-full ring-4 ring-purple-100"
          />
        )}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{profileData?.user.name}</h1>
          <p className="text-purple-600">@{profileData?.user.creatorHandleName}</p>
          <p className="text-gray-600 mt-1">{profileData?.profile.bio}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Enhanced Profile Info */}
        <div className="space-y-6">
          {/* Basic Info Card */}
          <div className="bg-white shadow rounded-xl p-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-purple-400" />
                  <span className="text-gray-600">{profileData?.user.name}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-purple-400" />
                  <span className="text-gray-600">{profileData?.user.email}</span>
                </div>
                {profileData?.profile.location && (
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-purple-400" />
                    <span className="text-gray-600">{profileData.profile.location}</span>
                  </div>
                )}
                {profileData?.profile.website && (
                  <div className="flex items-center space-x-3">
                    <Globe className="h-5 w-5 text-purple-400" />
                    <a 
                      href={profileData.profile.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:text-purple-800"
                    >
                      {profileData.profile.website}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Content Categories */}
            {profileData?.profile.categories && profileData.profile.categories.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Content Niches</h2>
                <div className="flex flex-wrap gap-2">
                  {profileData.profile.categories.map((category, index) => (
                    <span 
                      key={index}
                      className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Platform Connections */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Connected Platforms</h2>
              <div className="space-y-3">
                {profileData?.platforms
                  .filter(platform => platform.handle) // Only show platforms with handles
                  .map((platform) => (
                    <div key={platform.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-purple-600">
                            {platform.platformDisplayName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{platform.platformDisplayName}</p>
                          <p className="text-sm text-gray-600">@{platform.handle}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{platform.followers.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">followers</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Account Statistics */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Statistics</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-600">0</div>
                  <div className="text-sm text-gray-500">Active Campaigns</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-600">0</div>
                  <div className="text-sm text-gray-500">Total Posts</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-600">
                    {profileData?.profile.engagementRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-500">Engagement Rate</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-600">
                    {profileData?.profile.followers.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">Total Followers</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Posts and Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Posts Feed - Empty State for New Users */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <div className="text-center">
              {/* Empty State Icon */}
              <div className="mx-auto w-24 h-24 bg-purple-50 rounded-full flex items-center justify-center mb-6">
                <svg className="w-12 h-12 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              
              {/* Empty State Content */}
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                No content yet
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Start your creator journey by applying to campaigns and creating amazing content. Your posts will appear here once you begin collaborating with brands.
              </p>
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/campaigns"
                  className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Browse Campaigns
                </Link>
                <Link
                  href="/creatorportal/applications"
                  className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  View Applications
                </Link>
              </div>
            </div>
          </div>

          {/* Getting Started Tips */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-100">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Getting Started Tips
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">1</span>
                </div>
                <div>
                  <h5 className="font-medium text-gray-900">Complete your profile</h5>
                  <p className="text-sm text-gray-600">Add your bio, social media handles, and content niches to attract brands.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">2</span>
                </div>
                <div>
                  <h5 className="font-medium text-gray-900">Apply to campaigns</h5>
                  <p className="text-sm text-gray-600">Browse active campaigns and submit compelling applications with sample content ideas.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">3</span>
                </div>
                <div>
                  <h5 className="font-medium text-gray-900">Create quality content</h5>
                  <p className="text-sm text-gray-600">Once approved, create authentic content that resonates with your audience.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">4</span>
                </div>
                <div>
                  <h5 className="font-medium text-gray-900">Track your progress</h5>
                  <p className="text-sm text-gray-600">Monitor your earnings and campaign performance in your dashboard.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats for New Users */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Your Creator Journey</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-400">0</div>
                <div className="text-sm text-gray-500">Active Campaigns</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-400">0</div>
                <div className="text-sm text-gray-500">Total Posts</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-400">-</div>
                <div className="text-sm text-gray-500">Success Rate</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {profileData?.profile.followers.toLocaleString() || '0'}
                </div>
                <div className="text-sm text-gray-500">Total Followers</div>
              </div>
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Start collaborating with brands to see your stats grow!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
