'use client';

import { useState } from 'react';
import { Save, Upload } from 'lucide-react';

const mockProfile = {
  personalInfo: {
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    phone: '+1 (555) 123-4567',
    location: 'Los Angeles, CA',
    bio: 'Lifestyle and fashion content creator passionate about sustainable fashion and mindful living.',
    avatar: 'https://via.placeholder.com/150'
  },
  contentPreferences: {
    primaryNiche: 'Fashion & Style',
    secondaryNiches: ['Beauty', 'Lifestyle'],
    contentTypes: ['Photos', 'Reels', 'Stories'],
    postingFrequency: 'Daily',
    preferredBrands: ['Sustainable Fashion', 'Clean Beauty', 'Wellness']
  },
  rateCard: {
    instagram: {
      post: 500,
      story: 250,
      reel: 800
    },
    tiktok: {
      video: 600
    },
    youtube: {
      video: 1200
    }
  },
  notifications: {
    email: {
      newCampaigns: true,
      messages: true,
      paymentUpdates: true
    },
    push: {
      newCampaigns: true,
      messages: true,
      paymentUpdates: false
    }
  }
};

export default function Settings() {
  const [profile, setProfile] = useState(mockProfile);
  const [activeTab, setActiveTab] = useState('profile');

  const handleSave = () => {
    // Handle saving profile changes
    console.log('Saving profile:', profile);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage your profile, preferences, and account settings
          </p>
        </div>
      </div>

      {/* Settings Navigation */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {['profile', 'content', 'rates', 'notifications'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Profile Settings */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <img
                    src={profile.personalInfo.avatar}
                    alt="Profile"
                    className="h-32 w-32 rounded-full object-cover"
                  />
                  <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg">
                    <Upload className="h-5 w-5 text-gray-600" />
                  </button>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">Profile Picture</h3>
                  <p className="text-sm text-gray-500">
                    Upload a professional photo for your profile
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={profile.personalInfo.name}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        personalInfo: { ...profile.personalInfo, name: e.target.value }
                      })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={profile.personalInfo.email}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        personalInfo: { ...profile.personalInfo, email: e.target.value }
                      })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="tel"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={profile.personalInfo.phone}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        personalInfo: { ...profile.personalInfo, phone: e.target.value }
                      })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Location</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={profile.personalInfo.location}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        personalInfo: { ...profile.personalInfo, location: e.target.value }
                      })
                    }
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Bio</label>
                  <textarea
                    rows={4}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={profile.personalInfo.bio}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        personalInfo: { ...profile.personalInfo, bio: e.target.value }
                      })
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {/* Content Preferences */}
          {activeTab === 'content' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Primary Niche</label>
                <select
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={profile.contentPreferences.primaryNiche}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      contentPreferences: {
                        ...profile.contentPreferences,
                        primaryNiche: e.target.value
                      }
                    })
                  }
                >
                  <option>Fashion & Style</option>
                  <option>Beauty</option>
                  <option>Lifestyle</option>
                  <option>Travel</option>
                  <option>Fitness</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Content Types</label>
                <div className="mt-2 space-y-2">
                  {['Photos', 'Reels', 'Stories', 'Videos'].map((type) => (
                    <label key={type} className="inline-flex items-center mr-6">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={profile.contentPreferences.contentTypes.includes(type)}
                        onChange={(e) => {
                          const updatedTypes = e.target.checked
                            ? [...profile.contentPreferences.contentTypes, type]
                            : profile.contentPreferences.contentTypes.filter((t) => t !== type);
                          setProfile({
                            ...profile,
                            contentPreferences: {
                              ...profile.contentPreferences,
                              contentTypes: updatedTypes
                            }
                          });
                        }}
                      />
                      <span className="ml-2 text-sm text-gray-700">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Posting Frequency</label>
                <select
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={profile.contentPreferences.postingFrequency}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      contentPreferences: {
                        ...profile.contentPreferences,
                        postingFrequency: e.target.value
                      }
                    })
                  }
                >
                  <option>Daily</option>
                  <option>2-3 times per week</option>
                  <option>Weekly</option>
                  <option>Bi-weekly</option>
                  <option>Monthly</option>
                </select>
              </div>
            </div>
          )}

          {/* Rate Card */}
          {activeTab === 'rates' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Instagram Rates</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Post Rate ($)</label>
                    <input
                      type="number"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={profile.rateCard.instagram.post}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          rateCard: {
                            ...profile.rateCard,
                            instagram: {
                              ...profile.rateCard.instagram,
                              post: parseInt(e.target.value)
                            }
                          }
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Story Rate ($)</label>
                    <input
                      type="number"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={profile.rateCard.instagram.story}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          rateCard: {
                            ...profile.rateCard,
                            instagram: {
                              ...profile.rateCard.instagram,
                              story: parseInt(e.target.value)
                            }
                          }
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Reel Rate ($)</label>
                    <input
                      type="number"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={profile.rateCard.instagram.reel}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          rateCard: {
                            ...profile.rateCard,
                            instagram: {
                              ...profile.rateCard.instagram,
                              reel: parseInt(e.target.value)
                            }
                          }
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">TikTok Rates</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Video Rate ($)</label>
                  <input
                    type="number"
                    className="mt-1 block w-full md:w-1/3 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={profile.rateCard.tiktok.video}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        rateCard: {
                          ...profile.rateCard,
                          tiktok: { video: parseInt(e.target.value) }
                        }
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">YouTube Rates</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Video Rate ($)</label>
                  <input
                    type="number"
                    className="mt-1 block w-full md:w-1/3 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={profile.rateCard.youtube.video}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        rateCard: {
                          ...profile.rateCard,
                          youtube: { video: parseInt(e.target.value) }
                        }
                      })
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Email Notifications</h3>
                <div className="space-y-4">
                  {Object.entries(profile.notifications.email).map(([key, value]) => (
                    <label key={key} className="flex items-center">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={value}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            notifications: {
                              ...profile.notifications,
                              email: {
                                ...profile.notifications.email,
                                [key]: e.target.checked
                              }
                            }
                          })
                        }
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        {key
                          .replace(/([A-Z])/g, ' $1')
                          .replace(/^./, (str) => str.toUpperCase())}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Push Notifications</h3>
                <div className="space-y-4">
                  {Object.entries(profile.notifications.push).map(([key, value]) => (
                    <label key={key} className="flex items-center">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={value}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            notifications: {
                              ...profile.notifications,
                              push: {
                                ...profile.notifications.push,
                                [key]: e.target.checked
                              }
                            }
                          })
                        }
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        {key
                          .replace(/([A-Z])/g, ' $1')
                          .replace(/^./, (str) => str.toUpperCase())}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <button
            onClick={handleSave}
            className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
