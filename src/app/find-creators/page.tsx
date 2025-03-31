'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

// Mock creators data - no API calls needed
const mockCreators = [
  {
    id: '1',
    bio: 'Lifestyle and travel content creator with a passion for sustainable living.',
    location: 'Los Angeles, CA',
    categories: ['Travel', 'Lifestyle', 'Sustainability'],
    user: {
      id: '1',
      name: 'Jamie Smith',
      image: 'https://randomuser.me/api/portraits/women/44.jpg'
    },
    platforms: [
      {
        platform: {
          name: 'instagram',
          displayName: 'Instagram',
          iconUrl: '/icons/instagram.svg'
        },
        followers: 125000,
        engagementRate: 3.8,
        handle: '@jamiesmith'
      },
      {
        platform: {
          name: 'tiktok',
          displayName: 'TikTok',
          iconUrl: '/icons/tiktok.svg'
        },
        followers: 250000,
        engagementRate: 5.2,
        handle: '@jamiesmith'
      }
    ]
  },
  {
    id: '2',
    bio: 'Fitness enthusiast and wellness coach sharing workout routines and nutrition tips.',
    location: 'Miami, FL',
    categories: ['Fitness', 'Health', 'Nutrition'],
    user: {
      id: '2',
      name: 'Alex Johnson',
      image: 'https://randomuser.me/api/portraits/men/32.jpg'
    },
    platforms: [
      {
        platform: {
          name: 'instagram',
          displayName: 'Instagram',
          iconUrl: '/icons/instagram.svg'
        },
        followers: 185000,
        engagementRate: 4.2,
        handle: '@alexjfit'
      },
      {
        platform: {
          name: 'youtube',
          displayName: 'YouTube',
          iconUrl: '/icons/youtube.svg'
        },
        followers: 320000,
        engagementRate: 6.1,
        handle: '@alexjfitness'
      }
    ]
  },
  {
    id: '3',
    bio: 'Food blogger and cooking enthusiast sharing recipes and culinary adventures from around the world.',
    location: 'New York, NY',
    categories: ['Food', 'Cooking', 'Travel'],
    user: {
      id: '3',
      name: 'Sophia Chen',
      image: 'https://randomuser.me/api/portraits/women/68.jpg'
    },
    platforms: [
      {
        platform: {
          name: 'instagram',
          displayName: 'Instagram',
          iconUrl: '/icons/instagram.svg'
        },
        followers: 210000,
        engagementRate: 4.5,
        handle: '@sophiascooking'
      },
      {
        platform: {
          name: 'youtube',
          displayName: 'YouTube',
          iconUrl: '/icons/youtube.svg'
        },
        followers: 175000,
        engagementRate: 6.8,
        handle: '@sophiachencooking'
      }
    ]
  },
  {
    id: '4',
    bio: 'Beauty and skincare expert with a focus on natural and organic products.',
    location: 'Chicago, IL',
    categories: ['Beauty', 'Skincare', 'Wellness'],
    user: {
      id: '4',
      name: 'Taylor Reed',
      image: 'https://randomuser.me/api/portraits/women/22.jpg'
    },
    platforms: [
      {
        platform: {
          name: 'instagram',
          displayName: 'Instagram',
          iconUrl: '/icons/instagram.svg'
        },
        followers: 145000,
        engagementRate: 4.9,
        handle: '@taylorbeauty'
      },
      {
        platform: {
          name: 'tiktok',
          displayName: 'TikTok',
          iconUrl: '/icons/tiktok.svg'
        },
        followers: 290000,
        engagementRate: 7.1,
        handle: '@taylorbeauty'
      }
    ]
  },
  {
    id: '5',
    bio: 'Tech reviewer and gaming enthusiast covering the latest gadgets and games.',
    location: 'Seattle, WA',
    categories: ['Technology', 'Gaming', 'Reviews'],
    user: {
      id: '5',
      name: 'Marcus Kim',
      image: 'https://randomuser.me/api/portraits/men/56.jpg'
    },
    platforms: [
      {
        platform: {
          name: 'youtube',
          displayName: 'YouTube',
          iconUrl: '/icons/youtube.svg'
        },
        followers: 430000,
        engagementRate: 5.8,
        handle: '@marcustech'
      },
      {
        platform: {
          name: 'twitter',
          displayName: 'Twitter',
          iconUrl: '/icons/twitter.svg'
        },
        followers: 175000,
        engagementRate: 3.2,
        handle: '@marcustech'
      }
    ]
  },
  {
    id: '6',
    bio: 'Fashion influencer showcasing street style and upcoming trends.',
    location: 'New York, NY',
    categories: ['Fashion', 'Style', 'Shopping'],
    user: {
      id: '6',
      name: 'Zoe Martinez',
      image: 'https://randomuser.me/api/portraits/women/35.jpg'
    },
    platforms: [
      {
        platform: {
          name: 'instagram',
          displayName: 'Instagram',
          iconUrl: '/icons/instagram.svg'
        },
        followers: 265000,
        engagementRate: 4.1,
        handle: '@zoestyle'
      },
      {
        platform: {
          name: 'tiktok',
          displayName: 'TikTok',
          iconUrl: '/icons/tiktok.svg'
        },
        followers: 380000,
        engagementRate: 6.7,
        handle: '@zoestyle'
      }
    ]
  }
];

export default function FindCreators() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('');
  
  // Filter creators based on search, category, and platform
  const filteredCreators = mockCreators.filter(creator => {
    // Filter by search query
    const matchesSearch = searchQuery === '' || 
      creator.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      creator.bio.toLowerCase().includes(searchQuery.toLowerCase()) ||
      creator.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by category
    const matchesCategory = selectedCategory === '' || 
      creator.categories.some(cat => cat.toLowerCase() === selectedCategory.toLowerCase());
    
    // Filter by platform
    const matchesPlatform = selectedPlatform === '' || 
      creator.platforms.some(p => p.platform.name.toLowerCase() === selectedPlatform.toLowerCase());
    
    return matchesSearch && matchesCategory && matchesPlatform;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-purple-900 text-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-extrabold">Find Creators</h1>
          <p className="mt-2 text-lg">Discover and connect with top content creators for your next campaign</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="Search creators by name, bio, or location"
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="travel">Travel</option>
              <option value="lifestyle">Lifestyle</option>
              <option value="fitness">Fitness</option>
              <option value="beauty">Beauty</option>
              <option value="fashion">Fashion</option>
              <option value="food">Food</option>
              <option value="technology">Technology</option>
            </select>
          </div>
          <div>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
            >
              <option value="">All Platforms</option>
              <option value="instagram">Instagram</option>
              <option value="tiktok">TikTok</option>
              <option value="youtube">YouTube</option>
              <option value="twitter">Twitter</option>
            </select>
          </div>
        </div>
      </div>

      {/* Creator List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {filteredCreators.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No creators found matching your criteria</p>
            <button 
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('');
                setSelectedPlatform('');
              }}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {filteredCreators.map((creator) => (
              <Link 
                key={creator.id} 
                href={`/creator/${creator.id}`}
                className="block hover:shadow-lg transition-shadow duration-300"
              >
                <div className="bg-white rounded-lg shadow overflow-hidden h-full">
                  <div className="p-6">
                    <div className="flex items-center">
                      <div className="relative h-16 w-16 mr-4">
                        <Image
                          src={creator.user.image}
                          alt={creator.user.name}
                          fill
                          className="rounded-full object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{creator.user.name}</h3>
                        <p className="text-sm text-gray-500">{creator.location}</p>
                      </div>
                    </div>
                    
                    <p className="mt-4 text-gray-600 line-clamp-2">{creator.bio}</p>
                    
                    <div className="mt-4 flex flex-wrap gap-2">
                      {creator.categories.map((category, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                    
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex space-x-2">
                        {creator.platforms.map((platform, index) => (
                          <div key={index} className="flex items-center">
                            {platform.platform.iconUrl && (
                              <div className="relative h-5 w-5">
                                <Image
                                  src={platform.platform.iconUrl}
                                  alt={platform.platform.displayName}
                                  width={20}
                                  height={20}
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="text-sm text-gray-500">
                        {Math.max(...creator.platforms.map(p => p.followers)).toLocaleString()} followers
                      </div>
                    </div>
                    
                    <div className="mt-5 pt-5 border-t border-gray-200">
                      <button className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
                        View Profile
                      </button>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
