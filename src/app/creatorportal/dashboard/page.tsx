'use client';

import { useState, useEffect } from 'react';
import { BarChart3, DollarSign, Eye, ThumbsUp, MessageSquare, Calendar, Bell, ArrowRight, Image } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AnalyticsCharts from '@/components/ui/AnalyticsCharts';

// Empty stats instead of mock data
const stats = [
  {
    name: 'Total Reach',
    value: '0',
    change: '0%',
    trend: 'neutral',
    icon: Eye,
    description: 'Total audience reached this month'
  },
  {
    name: 'Active Campaigns',
    value: '0',
    change: '0',
    trend: 'neutral',
    icon: BarChart3,
    description: 'Current brand collaborations'
  },
  {
    name: 'Engagement Rate',
    value: '0%',
    change: '0%',
    trend: 'neutral',
    icon: ThumbsUp,
    description: 'Average engagement across platforms'
  },
  {
    name: 'Monthly Earnings',
    value: '$0',
    change: '0%',
    trend: 'neutral',
    icon: DollarSign,
    description: 'Revenue from all campaigns'
  }
];

// Empty array instead of mock posts
const recentPosts = [];

// Empty array instead of mock notifications
const notifications = [];

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
          
          {/* Show empty state instead of mock posts */}
          <div className="text-center py-10">
            <p className="text-gray-500">You haven't created any posts yet.</p>
            <Link
              href="/creatorportal/posts/create"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700"
            >
              Create Your First Post
            </Link>
          </div>
        </div>

        {/* Recent Applications - Keep as is, already handles empty state */}
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
          
          {/* Show empty state instead of mock notifications */}
          <div className="text-center py-6">
            <p className="text-gray-500">No notifications yet.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
