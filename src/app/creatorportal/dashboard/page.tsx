'use client';

import { useState, useEffect } from 'react';
import { BarChart3, DollarSign, Eye, ThumbsUp, MessageSquare, Calendar, Bell, ArrowRight, Image } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AnalyticsCharts from '@/components/ui/AnalyticsCharts';

// Mock data - replace with actual API calls
const stats = [
  {
    name: 'Total Reach',
    value: '125.8K',
    change: '+12%',
    trend: 'up',
    icon: Eye,
    description: 'Total audience reached this month'
  },
  {
    name: 'Active Campaigns',
    value: '4',
    change: '+2',
    trend: 'up',
    icon: BarChart3,
    description: 'Current brand collaborations'
  },
  {
    name: 'Engagement Rate',
    value: '4.8%',
    change: '+0.5%',
    trend: 'up',
    icon: ThumbsUp,
    description: 'Average engagement across platforms'
  },
  {
    name: 'Monthly Earnings',
    value: '$3,250',
    change: '+15%',
    trend: 'up',
    icon: DollarSign,
    description: 'Revenue from all campaigns'
  }
];

const recentPosts = [
  {
    id: 1,
    platform: 'Instagram',
    content: 'Just dropped my latest fashion haul with @StyleCo! Check out their amazing spring collection 🌸 #ad',
    reach: '25.2K',
    engagement: '5.8%',
    earnings: '$800',
    date: '2024-02-25',
    image: '/mock/post1.jpg'
  },
  {
    id: 2,
    platform: 'TikTok',
    content: 'My morning skincare routine featuring @BeautyBrand new products ✨ #sponsored',
    reach: '32.5K',
    engagement: '6.2%',
    earnings: '$1,200',
    date: '2024-02-20',
    image: '/mock/post2.jpg'
  },
  {
    id: 3,
    platform: 'Instagram',
    content: 'Living my best life with these new accessories from @StyleCo 💫 #brandpartner',
    reach: '28.7K',
    engagement: '5.5%',
    earnings: '$750',
    date: '2024-02-15',
    image: '/mock/post3.jpg'
  }
];

const notifications = [
  {
    id: 1,
    type: 'campaign',
    message: 'New campaign invitation from BeautyBrand',
    time: '2 hours ago'
  },
  {
    id: 2,
    type: 'payment',
    message: 'Payment received for StyleCo campaign',
    time: '1 day ago'
  }
];

interface CampaignClaim {
  id: string;
  campaign_id: string;
  status: string;
  campaign_title: string;
  campaign_brand_name: string;
  campaign_deadline: string;
  campaign_budget_range: string;
  created_at: string;
}

export default function CreatorDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [recentApplications, setRecentApplications] = useState<CampaignClaim[]>([]);

  console.log('Creator Dashboard - Session:', session);
  console.log('Creator Dashboard - Status:', status);

  // Protect the route
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (status === 'unauthenticated' || !session?.user?.role || session.user.role !== 'CREATOR') {
    console.log('Unauthorized access attempt - redirecting to login');
    router.push('/login');
    return null;
  }

  useEffect(() => {
    const fetchRecentApplications = async () => {
      try {
        const response = await fetch('/api/creator/campaign-claims?limit=2');
        if (response.ok) {
          const data = await response.json();
          setRecentApplications(data);
        }
      } catch (error) {
        console.error('Error fetching recent applications:', error);
      }
    };

    if (session?.user?.role === 'CREATOR') {
      fetchRecentApplications();
    }
  }, [session, status, router]);

  const [selectedTab, setSelectedTab] = useState('overview');

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {session.user.name}!</h1>
          <p className="text-gray-600">Here's what's happening with your content</p>
        </div>
        <div className="flex space-x-4">
          <button className="bg-white p-2 rounded-full text-gray-600 hover:bg-gray-100">
            <Bell className="h-6 w-6" />
          </button>
          <Link
            href="/creatorportal/campaigns"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            View Campaigns
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 mb-6 lg:grid-cols-4">
        {stats.map((item) => (
          <div
            key={item.name}
            className="bg-white overflow-hidden shadow rounded-lg"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <item.icon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {item.name}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {item.value}
                      </div>
                      <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                        item.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {item.change}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
              <div className="mt-4">
                <div className="text-sm text-gray-500">{item.description}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Performance Analytics */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Performance Analytics</h2>
            <button className="text-sm text-purple-600 hover:text-purple-900">
              View All
              <ArrowRight className="inline-block w-4 h-4 ml-1" />
            </button>
          </div>
          <div className="h-[350px]">
            <AnalyticsCharts />
          </div>
        </div>

        {/* Recent Posts */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Recent Posts</h2>
            <Link
              href="/creatorportal/posts"
              className="text-sm text-purple-600 hover:text-purple-900 flex items-center"
            >
              View All
              <ArrowRight className="inline-block w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="space-y-6">
            {recentPosts.map((post) => (
              <div key={post.id} className="flex items-start space-x-4 p-4 rounded-lg bg-gray-50">
                <div className="flex-shrink-0 h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                  {post.platform === 'Instagram' ? (
                    <Image className="h-6 w-6 text-purple-600" />
                  ) : (
                    <MessageSquare className="h-6 w-6 text-purple-600" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {post.content}
                  </p>
                  <div className="mt-2 flex items-center text-sm text-gray-500 space-x-4">
                    <div className="flex items-center">
                      <Eye className="h-4 w-4 mr-1" />
                      {post.reach}
                    </div>
                    <div className="flex items-center">
                      <ThumbsUp className="h-4 w-4 mr-1" />
                      {post.engagement}
                    </div>
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-1" />
                      {post.earnings}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(post.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Applications */}
        <div className="bg-white shadow rounded-lg p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Recent Applications</h2>
            <Link
              href="/creatorportal/applications"
              className="text-sm text-purple-600 hover:text-purple-900 flex items-center"
            >
              View All
              <ArrowRight className="inline-block w-4 h-4 ml-1" />
            </Link>
          </div>
          
          {recentApplications.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">You haven't applied to any campaigns yet.</p>
              <Link
                href="/campaigns"
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700"
              >
                Browse Campaigns
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recentApplications.map((application) => (
                <div key={application.id} className="p-4 rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-medium text-gray-900">{application.campaign_title}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      application.status === 'approved' 
                        ? 'bg-green-100 text-green-800' 
                        : application.status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">{application.campaign_brand_name}</p>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <div className="flex items-center text-gray-500">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(application.campaign_deadline).toLocaleDateString()}
                    </div>
                    <div className="font-medium text-purple-600">{application.campaign_budget_range}</div>
                  </div>
                  <div className="mt-4">
                    <Link 
                      href={`/creatorportal/applications?id=${application.id}`}
                      className="text-sm text-purple-600 hover:text-purple-800"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Notifications */}
      <div className="mt-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Notifications</h2>
            <button className="text-sm text-purple-600 hover:text-purple-900">
              Mark all as read
              <ArrowRight className="inline-block w-4 h-4 ml-1" />
            </button>
          </div>
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div key={notification.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <Bell className="h-5 w-5 text-purple-500 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-900">{notification.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
