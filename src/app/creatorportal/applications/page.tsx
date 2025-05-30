'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Clock, Eye, ArrowRight, Calendar, DollarSign } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

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
  campaign_budget_unit?: string;
  campaign_brief?: string;
  campaign_sample_video_url?: string;
  // Add new fields
  industry_category?: string;
  primary_promotion_objectives?: string[] | string;
  ad_placement?: string;
  campaign_execution_mode?: string;
  creator_profile_preferences_gender?: string[] | string;
  creator_profile_preference_ethnicity?: string[] | string;
  creator_profile_preference_content_niche?: string[] | string;
  preferred_creator_location?: string[] | string;
  language_requirement_for_creators?: string;
  creator_tier_requirement?: string[] | string;
  send_to_creator?: string;
  approved_by_brand?: string;
  kpi_reference_target?: string;
  prohibited_content_warnings?: string;
  posting_requirements?: string;
  product_photo?: string;
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

  // Helper function to format array fields
  const formatArrayField = (field: string[] | string | undefined): string[] => {
    if (!field) return [];
    if (typeof field === 'string') {
      try {
        const parsed = JSON.parse(field);
        return Array.isArray(parsed) ? parsed : [field];
      } catch {
        return [field];
      }
    }
    return Array.isArray(field) ? field : [];
  };

  // Helper function to format text fields
  const formatTextField = (field: string | undefined): string => {
    return field || 'Not specified';
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
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
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
            
            {/* Product Photo Section */}
            {selectedApplication.product_photo && (
              <div className="border-t border-gray-200 pt-4 mb-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Product</h3>
                <div className="w-full max-w-sm mx-auto relative">
                  <Image
                    src={selectedApplication.product_photo}
                    alt={`Product for ${selectedApplication.campaign_title}`}
                    width={300}
                    height={200}
                    className="w-full h-auto rounded-lg shadow-sm opacity-0 transition-opacity duration-300"
                    onLoad={(e) => {
                      e.currentTarget.classList.remove('opacity-0');
                      e.currentTarget.classList.add('opacity-100');
                      // Hide loading indicator
                      const loader = e.currentTarget.parentElement?.querySelector('.loading-indicator') as HTMLElement;
                      if (loader) loader.style.display = 'none';
                    }}
                    onError={(e) => {
                      console.error(`Application product image failed to load: ${selectedApplication.product_photo}`);
                      // Show fallback
                      const fallback = e.currentTarget.parentElement?.querySelector('.image-fallback') as HTMLElement;
                      if (fallback) {
                        fallback.style.display = 'flex';
                        e.currentTarget.style.display = 'none';
                      }
                    }}
                    unoptimized={true}
                  />
                  
                  {/* Loading indicator */}
                  <div className="loading-indicator absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                    <div className="text-center">
                      <svg className="w-6 h-6 text-gray-400 mx-auto animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <p className="text-xs text-gray-500 mt-2">Loading image...</p>
                    </div>
                  </div>
                  
                  {/* Fallback for when image fails to load */}
                  <div className="image-fallback hidden w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                    <div className="text-center text-gray-500">
                      <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm">Product image unavailable</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="border-t border-gray-200 pt-4 mb-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Campaign Details</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500">Budget Range</p>
                  <p className="text-sm text-gray-900">
                    {selectedApplication.campaign_budget_range}
                    {selectedApplication.campaign_budget_unit && (
                      <span className="text-xs text-gray-500 ml-1">
                        ({selectedApplication.campaign_budget_unit === 'total' ? 'Total Budget' : 
                          selectedApplication.campaign_budget_unit === 'per_person' ? 'Per Creator' : 
                          selectedApplication.campaign_budget_unit === 'per_video' ? 'Per Video' : 
                          selectedApplication.campaign_budget_unit})
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Deadline</p>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedApplication.campaign_deadline).toLocaleDateString()}
                  </p>
                </div>
                
                {/* Industry Category */}
                {selectedApplication.industry_category && (
                  <div>
                    <p className="text-xs text-gray-500">Industry Category</p>
                    <p className="text-sm text-gray-900">{formatTextField(selectedApplication.industry_category)}</p>
                  </div>
                )}

                {/* Language Requirements */}
                {selectedApplication.language_requirement_for_creators && (
                  <div>
                    <p className="text-xs text-gray-500">Language Requirement</p>
                    <p className="text-sm text-gray-900 capitalize">{formatTextField(selectedApplication.language_requirement_for_creators)}</p>
                  </div>
                )}
              </div>

              {/* Promotion Objectives */}
              {selectedApplication.primary_promotion_objectives && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-2">Primary Promotion Objectives</p>
                  <div className="flex flex-wrap gap-1">
                    {formatArrayField(selectedApplication.primary_promotion_objectives).map((objective, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                        {objective}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Creator Preferences */}
              {(selectedApplication.creator_tier_requirement || 
                selectedApplication.creator_profile_preferences_gender ||
                selectedApplication.creator_profile_preference_ethnicity ||
                selectedApplication.creator_profile_preference_content_niche ||
                selectedApplication.preferred_creator_location) && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-2">Creator Preferences</p>
                  <div className="space-y-2">
                    {selectedApplication.creator_tier_requirement && (
                      <div>
                        <span className="text-xs font-medium text-gray-700">Tier: </span>
                        <div className="inline-flex flex-wrap gap-1">
                          {formatArrayField(selectedApplication.creator_tier_requirement).map((tier, index) => (
                            <span key={index} className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                              {tier}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {selectedApplication.creator_profile_preferences_gender && (
                      <div>
                        <span className="text-xs font-medium text-gray-700">Gender: </span>
                        <div className="inline-flex flex-wrap gap-1">
                          {formatArrayField(selectedApplication.creator_profile_preferences_gender).map((gender, index) => (
                            <span key={index} className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                              {gender}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {selectedApplication.creator_profile_preference_content_niche && (
                      <div>
                        <span className="text-xs font-medium text-gray-700">Content Niche: </span>
                        <div className="inline-flex flex-wrap gap-1">
                          {formatArrayField(selectedApplication.creator_profile_preference_content_niche).map((niche, index) => (
                            <span key={index} className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs">
                              {niche}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {selectedApplication.preferred_creator_location && (
                      <div>
                        <span className="text-xs font-medium text-gray-700">Location: </span>
                        <div className="inline-flex flex-wrap gap-1">
                          {formatArrayField(selectedApplication.preferred_creator_location).map((location, index) => (
                            <span key={index} className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">
                              {location}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* KPI Reference Target */}
              {selectedApplication.kpi_reference_target && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500">KPI Reference Target</p>
                  <p className="text-sm text-gray-900">{formatTextField(selectedApplication.kpi_reference_target)}</p>
                </div>
              )}

              {/* Content Guidelines */}
              {(selectedApplication.posting_requirements || selectedApplication.prohibited_content_warnings) && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-2">Content Guidelines</p>
                  
                  {selectedApplication.posting_requirements && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-gray-700 mb-1">Posting Requirements:</p>
                      <div className="bg-gray-50 p-3 rounded text-sm text-gray-900">
                        {formatTextField(selectedApplication.posting_requirements)}
                      </div>
                    </div>
                  )}
                  
                  {selectedApplication.prohibited_content_warnings && (
                    <div>
                      <p className="text-xs font-medium text-gray-700 mb-1">Prohibited Content:</p>
                      <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded text-sm text-red-700">
                        {formatTextField(selectedApplication.prohibited_content_warnings)}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {selectedApplication.campaign_sample_video_url && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500">Campaign Sample Video</p>
                  <a
                    href={selectedApplication.campaign_sample_video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm inline-flex items-center"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View Campaign Sample Video
                  </a>
                </div>
              )}
              
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
                      {application.campaign_budget_unit && (
                        <span className="text-xs text-gray-500 ml-1">
                          ({application.campaign_budget_unit === 'total' ? 'Total Budget' : 
                            application.campaign_budget_unit === 'per_person' ? 'Per Creator' : 
                            application.campaign_budget_unit === 'per_video' ? 'Per Video' : 
                            application.campaign_budget_unit})
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Deadline:</span>
                    <span className="font-medium text-gray-900">
                      {new Date(application.campaign_deadline).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {application.campaign_sample_video_url && (
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-gray-600">Campaign Sample:</span>
                    <a 
                      href={application.campaign_sample_video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      View Sample
                    </a>
                  </div>
                )}

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
