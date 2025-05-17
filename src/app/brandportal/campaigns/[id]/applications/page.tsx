'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { CheckCircle, XCircle, ChevronLeft, UserCircle, FileText, Link as LinkIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

// Types for our application data
interface Creator {
  id: string;
  userId: string;
  username?: string;
  bio?: string;
  categories?: string;
  followerCount?: number;
  engagementRate?: string;
}

interface Application {
  id: string;
  campaign_id: string;
  creator_id: string;
  status: string;
  sample_text: string | null;
  sample_video_url: string | null;
  created_at: string;
  creator?: Creator;
}

interface Campaign {
  id: string;
  title: string;
  brief: string;
  requirements: string | null;
  budget_range: string;
  commission: string;
  platform: string;
  deadline: string | Date;
  applications: Application[];
}

export default function CampaignApplications() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const campaignId = params?.id || '';

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
      return;
    }

    if (session.user.role !== 'BRAND') {
      router.push('/login');
      return;
    }

    if (campaignId) {
      fetchCampaignWithApplications();
    } else {
      setError('Invalid campaign ID');
      setIsLoading(false);
    }
  }, [session, status, router, campaignId]);

  const fetchCampaignWithApplications = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch the specific campaign with its applications
      const response = await fetch(`/api/brand/campaigns/${campaignId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load campaign details');
      }
      
      const data = await response.json();
      console.log('Campaign data with applications:', data);
      setCampaign(data);
    } catch (error) {
      console.error('Error fetching campaign details:', error);
      setError('Failed to load campaign details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (applicationId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/applications/${applicationId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update application status');
      }

      // Refresh the data
      fetchCampaignWithApplications();
    } catch (error) {
      console.error('Error updating application status:', error);
      alert('Failed to update application status. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error || 'Campaign not found'}</p>
          <button
            onClick={() => router.back()}
            className="mt-2 text-sm text-red-600 hover:text-red-800 flex items-center"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <button 
        onClick={() => router.back()} 
        className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
      >
        <ChevronLeft className="w-4 h-4 mr-1" /> Back to Campaigns
      </button>
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{campaign.title} - Applications</h1>
        <p className="text-gray-600 mt-2">
          {campaign.applications?.length || 0} applications received
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Campaign Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Brief</h3>
            <p className="mt-1">{campaign.brief || 'No brief provided'}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Requirements</h3>
            <p className="mt-1">{campaign.requirements || 'No specific requirements'}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Budget Range</h3>
            <p className="mt-1">{campaign.budget_range || 'Not specified'}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Platform</h3>
            <p className="mt-1 capitalize">{campaign.platform || 'Not specified'}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Applications</h2>
        
        {(!campaign.applications || campaign.applications.length === 0) ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No applications received yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {campaign.applications.map((application) => (
              <div key={application.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-100">
                        {application.creator?.userId ? (
                          <div className="h-10 w-10 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full">
                            {application.creator.username?.charAt(0).toUpperCase() || 'C'}
                          </div>
                        ) : (
                          <UserCircle className="w-10 h-10 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium">
                          {application.creator?.username || 'Creator ' + application.creator_id.substring(0, 6)}
                        </h3>
                        <p className="text-xs text-gray-500">
                          Applied on {formatDate(application.created_at)}
                        </p>
                      </div>
                    </div>
                    
                    {application.creator && (
                      <div className="mb-3 text-sm">
                        <div className="mb-2">
                          <span className="font-medium">Bio:</span> {application.creator.bio || 'No bio provided'}
                        </div>
                        {(application.creator.followerCount !== undefined || application.creator.engagementRate) && (
                          <div className="flex flex-wrap gap-2 mb-2">
                            {application.creator.followerCount !== undefined && (
                              <span>
                                <span className="font-medium">Followers:</span> {application.creator.followerCount.toLocaleString()}
                              </span>
                            )}
                            {application.creator.engagementRate && (
                              <span>
                                <span className="font-medium ml-2">Engagement:</span> {application.creator.engagementRate}
                              </span>
                            )}
                          </div>
                        )}
                        {application.creator.categories && (
                          <div className="mb-2">
                            <span className="font-medium">Categories:</span> {application.creator.categories}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {application.sample_text && (
                      <div className="mb-3">
                        <h4 className="text-sm font-medium flex items-center gap-1">
                          <FileText className="w-4 h-4" /> Sample Content
                        </h4>
                        <p className="mt-1 text-sm bg-gray-50 p-3 rounded-md">
                          {application.sample_text}
                        </p>
                      </div>
                    )}
                    
                    {application.sample_video_url && (
                      <div>
                        <h4 className="text-sm font-medium flex items-center gap-1">
                          <LinkIcon className="w-4 h-4" /> Video Sample
                        </h4>
                        <a 
                          href={application.sample_video_url.startsWith('http') 
                            ? application.sample_video_url 
                            : `https://${application.sample_video_url}`}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          View video sample
                        </a>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <div>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs ${
                        application.status === 'approved' ? 'bg-green-100 text-green-800' :
                        application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                      </span>
                    </div>
                    
                    {application.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleStatusChange(application.id, 'approved')}
                          className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm"
                          title="Approve Application"
                        >
                          <CheckCircle className="w-4 h-4" /> Approve
                        </button>
                        <button
                          onClick={() => handleStatusChange(application.id, 'rejected')}
                          className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
                          title="Reject Application"
                        >
                          <XCircle className="w-4 h-4" /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
