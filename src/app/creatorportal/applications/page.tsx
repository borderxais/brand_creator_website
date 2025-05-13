'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Clock, Eye, ArrowRight, Calendar, DollarSign } from 'lucide-react';
import Link from 'next/link';

interface CampaignClaim {
  id: string;
  campaign_id: string;
  creator_id: string;
  status: string;
  sample_text: string;
  sample_video_url?: string;
  created_at: string;
  campaign_title: string;
  campaign_brand_name: string;
  campaign_deadline: string;
  campaign_budget_range: string;
  campaign_brief?: string;
}

export default function Applications() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [applications, setApplications] = useState<CampaignClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<CampaignClaim | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
      return;
    }

    if (session.user.role !== 'CREATOR') {
      router.push('/login');
      return;
    }

    // Check if there's an ID in the query params for direct viewing
    const urlParams = new URLSearchParams(window.location.search);
    const applicationId = urlParams.get('id');

    const fetchApplications = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/creator/campaign-claims');
        
        if (!response.ok) {
          throw new Error('Failed to fetch applications');
        }

        const data = await response.json();
        setApplications(data);
        
        // If an ID was specified in the URL, select that application for detailed view
        if (applicationId && data.length > 0) {
          const selected = data.find((app: CampaignClaim) => app.id === applicationId);
          if (selected) {
            setSelectedApplication(selected);
            setShowDetails(true);
          }
        }
      } catch (err: any) {
        console.error('Error fetching applications:', err);
        setError(err.message || 'Failed to load applications');
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [session, status, router]);

  // Helper function to render status badge
  const renderStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Clock className="w-3 h-3 mr-1" />
            In Progress
          </span>
        );
      case 'finished':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Finished
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 text-sm text-red-600 hover:text-red-800"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Application Details Modal */}
      {showDetails && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-xl font-bold text-gray-900">{selectedApplication.campaign_title}</h2>
              <button 
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-gray-600">by {selectedApplication.campaign_brand_name}</p>
              {renderStatusBadge(selectedApplication.status)}
            </div>
            
            <div className="border-t border-gray-200 pt-4 mb-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Campaign Details</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500">Budget Range</p>
                  <p className="text-sm text-gray-900">{selectedApplication.campaign_budget_range}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Deadline</p>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedApplication.campaign_deadline).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              {selectedApplication.campaign_brief && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500">Brief</p>
                  <p className="text-sm text-gray-900">{selectedApplication.campaign_brief}</p>
                </div>
              )}
            </div>
            
            <div className="border-t border-gray-200 pt-4 mb-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Your Submission</h3>
              <div className="bg-gray-50 p-3 rounded mb-3">
                <p className="text-xs text-gray-500 mb-1">Sample Text</p>
                <p className="text-sm text-gray-900 whitespace-pre-line">{selectedApplication.sample_text}</p>
              </div>
              
              {selectedApplication.sample_video_url && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Sample Video</p>
                  <a
                    href={selectedApplication.sample_video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-600 hover:text-purple-800 text-sm inline-flex items-center"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View Sample Video
                  </a>
                </div>
              )}
            </div>
            
            <div className="border-t border-gray-200 pt-4 mb-4">
              <p className="text-xs text-gray-500">Application Date</p>
              <p className="text-sm text-gray-900">
                {new Date(selectedApplication.created_at).toLocaleString()}
              </p>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => setShowDetails(false)}
                className="px-4 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Campaign Applications</h1>
        <Link
          href="/campaigns"
          className="text-purple-600 hover:text-purple-800 flex items-center"
        >
          Browse Campaigns <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </div>

      {applications.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
          <p className="text-gray-600 mb-4">
            You haven't applied to any campaigns yet. Browse available campaigns to get started.
          </p>
          <Link
            href="/campaigns"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700"
          >
            Browse Campaigns
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {applications.map((application) => (
            <div key={application.id} className="bg-white rounded-lg shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-lg font-medium text-gray-900">
                      {application.campaign_title}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {application.campaign_brand_name}
                    </p>
                  </div>
                  {renderStatusBadge(application.status)}
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Applied on:</span>
                    <span className="font-medium text-gray-900">
                      {new Date(application.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Campaign budget:</span>
                    <span className="font-medium text-gray-900">
                      {application.campaign_budget_range}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Deadline:</span>
                    <span className="font-medium text-gray-900">
                      {new Date(application.campaign_deadline).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Your Submission</h3>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {application.sample_text}
                  </p>
                  {application.sample_video_url && (
                    <a
                      href={application.sample_video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:text-purple-800 text-sm inline-flex items-center"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View Sample Video
                    </a>
                  )}
                </div>

                <div className="mt-4">
                  <button
                    onClick={() => {
                      setSelectedApplication(application);
                      setShowDetails(true);
                    }}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
