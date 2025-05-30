'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  Calendar, 
  DollarSign, 
  Users, 
  CheckCircle, 
  Layers, 
  Award, 
  ChevronLeft, 
  Clock,
  Tag,
  Video
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

// Campaign type definition based on Supabase schema
interface Campaign {
  id: string;
  brand_id: string;
  brand_name?: string;
  title: string;
  brief: string;
  requirements: string;
  budget_range: string;
  budget_unit: string;
  commission: string;
  platform: string;
  deadline: string;
  max_creators: number;
  is_open: boolean;
  created_at: string;
  sample_video_url: string | null;
  product_photo: string | null;
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
}

export default function CampaignDetail() {
  // Fix the params type assertion to handle possible null values
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applyingTo, setApplyingTo] = useState<string | null>(null);
  const [applicationSuccess, setApplicationSuccess] = useState<boolean | null>(null);
  const [applicationMessage, setApplicationMessage] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [sampleText, setSampleText] = useState('');
  const [sampleVideoUrl, setSampleVideoUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Access campaignId safely with default value
  const campaignId = params?.id || '';

  // Fetch campaign details
  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        setIsLoading(true);
        
        if (!campaignId) {
          throw new Error('Campaign ID is missing');
        }
        
        const response = await fetch(`/api/campaigns/${campaignId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch campaign details');
        }
        
        const data = await response.json();
        setCampaign(data);
      } catch (err) {
        console.error('Error fetching campaign:', err);
        setError(err instanceof Error ? err.message : 'Failed to load campaign');
      } finally {
        setIsLoading(false);
      }
    };

    if (campaignId) {
      fetchCampaign();
    }
  }, [campaignId]);

  // Format requirements into array
  const formatRequirements = (requirements: string): string[] => {
    try {
      if (!requirements) return [];
      
      // Try to parse as JSON
      try {
        const parsed = JSON.parse(requirements);
        if (Array.isArray(parsed)) return parsed;
        if (parsed.list && Array.isArray(parsed.list)) return parsed.list;
        return [String(parsed)];
      } catch {
        // If not JSON, split by commas or newlines
        if (requirements.includes(',')) return requirements.split(',').map(r => r.trim());
        if (requirements.includes('\n')) return requirements.split('\n').map(r => r.trim());
        return [requirements];
      }
    } catch (e) {
      return [String(requirements)];
    }
  };

  // Handle application modal
  const openModal = () => {
    setShowModal(true);
    setSampleText('');
    setSampleVideoUrl('');
  };

  const closeModal = () => {
    setShowModal(false);
    setSampleText('');
    setSampleVideoUrl('');
  };

  // Handle apply to campaign
  const handleApply = async () => {
    console.log("Apply button clicked");
    
    if (status === 'unauthenticated') {
      console.log("User not authenticated, redirecting to login");
      router.push('/login');
      return;
    }

    if (session?.user?.role !== 'CREATOR') {
      console.log("User not a creator:", session?.user?.role);
      setApplicationSuccess(false);
      setApplicationMessage('Only creators can apply to campaigns');
      return;
    }

    if (campaign) {
      openModal();
    }
  };

  // Submit application with samples
  const submitApplication = async () => {
    if (!campaign) {
      console.error("No campaign selected for application");
      return;
    }

    console.log("Submitting application for campaign:", campaign.id);
    try {
      setSubmitting(true);
      
      // Get user ID from session
      const userId = session?.user?.id;
      
      console.log("User ID from session:", userId);
      if (!userId) {
        console.error("User ID not found in session");
        setApplicationSuccess(false);
        setApplicationMessage('User ID not found. Please try logging in again.');
        closeModal();
        return;
      }

      const payload = {
        campaignId: campaign.id,
        userId,
        sampleText,
        sampleVideoUrl,
      };
      console.log("Sending application payload:", payload);

      const response = await fetch('/api/campaigns/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log("Application response status:", response.status);
      const data = await response.json();
      console.log("Application response data:", data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to apply to campaign');
      }

      setApplicationSuccess(true);
      setApplicationMessage(data.status === 'already_applied' 
        ? 'You have already applied to this campaign'
        : 'Application submitted successfully!');
      
      // Close modal after successful submission
      closeModal();
      
      // Set the campaign ID for displaying success message
      setApplyingTo(campaign.id);
      
      // Reset states after delay
      setTimeout(() => {
        setApplyingTo(null);
        setTimeout(() => {
          setApplicationSuccess(null);
          setApplicationMessage('');
        }, 3000);
      }, 500);
      
    } catch (err) {
      console.error('Error applying to campaign:', err);
      setApplicationSuccess(false);
      setApplicationMessage(err instanceof Error ? err.message : 'Failed to apply. Please try again.');
      closeModal();
    } finally {
      setSubmitting(false);
    }
  };

  // Check if user can apply
  const canApply = status === 'authenticated' && session?.user?.role === 'CREATOR';

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

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-purple-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  // Error state
  if (error || !campaign) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-red-600 text-xl font-semibold mb-4">Error</h1>
          <p className="text-gray-700">{error || 'Campaign not found'}</p>
          <div className="mt-6">
            <Link href="/campaigns" className="text-purple-600 hover:text-purple-800 flex items-center">
              <ChevronLeft className="w-4 h-4 mr-1" /> Back to campaigns
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Format requirements
  const requirementsList = formatRequirements(campaign.requirements);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Campaign Header */}
      <div className="bg-purple-900 text-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-start mb-2">
            <Link href="/campaigns" className="text-white hover:text-purple-200 flex items-center mb-4">
              <ChevronLeft className="w-5 h-5 mr-1" /> Back to campaigns
            </Link>

            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              campaign.is_open ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {campaign.is_open ? 'Active' : 'Closed'}
            </span>
          </div>
          
          <h1 className="text-3xl font-bold">{campaign.title}</h1>
          <div className="mt-2 flex items-center">
            <p className="text-lg">by {campaign.brand_name || 'Unknown Brand'}</p>
          </div>
        </div>
      </div>

      {/* Campaign Content */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Product Photo Section */}
            {campaign.product_photo && (
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h2 className="text-xl font-bold mb-4">Product</h2>
                
                <div className="w-full max-w-lg mx-auto relative">
                  <Image
                    src={campaign.product_photo}
                    alt={`Product for ${campaign.title}`}
                    width={500}
                    height={400}
                    className="w-full h-auto rounded-lg shadow-sm opacity-0 transition-opacity duration-300"
                    onLoad={(e) => {
                      console.log(`Campaign detail image loaded: ${campaign.product_photo}`);
                      e.currentTarget.classList.remove('opacity-0');
                      e.currentTarget.classList.add('opacity-100');
                      // Hide loading indicator
                      const loader = e.currentTarget.parentElement?.querySelector('.loading-indicator') as HTMLElement;
                      if (loader) loader.style.display = 'none';
                    }}
                    onError={(e) => {
                      console.error(`Campaign detail image failed to load: ${campaign.product_photo}`);
                      
                      // Show fallback instead of hiding
                      const fallback = e.currentTarget.parentElement?.querySelector('.image-fallback') as HTMLElement;
                      if (fallback) {
                        fallback.style.display = 'flex';
                        e.currentTarget.style.display = 'none';
                      }
                    }}
                    unoptimized={true} // Disable Next.js optimization for external URLs
                  />
                  
                  {/* Loading indicator */}
                  <div className="loading-indicator absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                    <div className="text-center">
                      <svg className="w-8 h-8 text-gray-400 mx-auto animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <p className="text-xs text-gray-500 mt-2">Loading image...</p>
                    </div>
                  </div>
                  
                  {/* Fallback for when image fails to load */}
                  <div className="image-fallback hidden w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                    <div className="text-center text-gray-500">
                      <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm">Product image unavailable</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Overview */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Campaign Overview</h2>
              <p className="text-gray-600 mb-6">{campaign.brief}</p>
              
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="flex items-center">
                  <Tag className="h-5 w-5 text-purple-500 mr-3" />
                  <div>
                    <h3 className="font-medium text-gray-900">Platform</h3>
                    <p className="text-gray-600">{campaign.platform}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-purple-500 mr-3" />
                  <div>
                    <h3 className="font-medium text-gray-900">Deadline</h3>
                    <p className="text-gray-600">{new Date(campaign.deadline).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <DollarSign className="h-5 w-5 text-purple-500 mr-3" />
                  <div>
                    <h3 className="font-medium text-gray-900">Budget Range</h3>
                    <p className="text-gray-600">
                      {campaign.budget_range}
                      {campaign.budget_unit && (
                        <span className="text-gray-500 text-sm ml-1">
                          ({campaign.budget_unit === 'total' ? 'Total Budget' : 
                            campaign.budget_unit === 'per_person' ? 'Per Creator' : 
                            campaign.budget_unit === 'per_video' ? 'Per Video' : 
                            campaign.budget_unit})
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Award className="h-5 w-5 text-purple-500 mr-3" />
                  <div>
                    <h3 className="font-medium text-gray-900">Commission</h3>
                    <p className="text-gray-600">{campaign.commission || 'None'}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-purple-500 mr-3" />
                  <div>
                    <h3 className="font-medium text-gray-900">Max Creators</h3>
                    <p className="text-gray-600">{campaign.max_creators} creators</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-purple-500 mr-3" />
                  <div>
                    <h3 className="font-medium text-gray-900">Posted</h3>
                    <p className="text-gray-600">{new Date(campaign.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sample Video */}
            {campaign.sample_video_url && (
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h2 className="text-xl font-bold mb-4">Sample Video</h2>
                <div className="flex items-center text-blue-600 mb-2">
                  <Video className="h-5 w-5 mr-2" />
                  <a 
                    href={campaign.sample_video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-blue-800 underline"
                  >
                    View sample video for reference
                  </a>
                </div>
                <p className="text-gray-600 text-sm">
                  This video demonstrates the style and content format the brand is looking for.
                </p>
              </div>
            )}

            {/* Requirements */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Requirements</h2>
              <ul className="space-y-3">
                {requirementsList.length > 0 ? (
                  requirementsList.map((req, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{req}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-gray-600">No specific requirements listed.</li>
                )}
              </ul>
            </div>

            {/* Campaign Details Section */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Campaign Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Industry Category */}
                {campaign.industry_category && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Industry Category</h3>
                    <p className="text-gray-600">{formatTextField(campaign.industry_category)}</p>
                  </div>
                )}

                {/* Campaign Execution Mode */}
                {campaign.campaign_execution_mode && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Execution Mode</h3>
                    <p className="text-gray-600 capitalize">{formatTextField(campaign.campaign_execution_mode)}</p>
                  </div>
                )}

                {/* Language Requirements */}
                {campaign.language_requirement_for_creators && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Language Requirement</h3>
                    <p className="text-gray-600 capitalize">{formatTextField(campaign.language_requirement_for_creators)}</p>
                  </div>
                )}

                {/* Ad Placement */}
                {campaign.ad_placement && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Ad Placement</h3>
                    <p className="text-gray-600 capitalize">{formatTextField(campaign.ad_placement)}</p>
                  </div>
                )}
              </div>

              {/* Promotion Objectives */}
              {campaign.primary_promotion_objectives && (
                <div className="mt-6">
                  <h3 className="font-medium text-gray-900 mb-2">Primary Promotion Objectives</h3>
                  <div className="flex flex-wrap gap-2">
                    {formatArrayField(campaign.primary_promotion_objectives).map((objective, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {objective}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* KPI Reference Target */}
              {campaign.kpi_reference_target && (
                <div className="mt-6">
                  <h3 className="font-medium text-gray-900 mb-2">KPI Reference Target</h3>
                  <p className="text-gray-600">{formatTextField(campaign.kpi_reference_target)}</p>
                </div>
              )}
            </div>

            {/* Creator Preferences Section */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Creator Preferences</h2>
              
              {/* Creator Tier Requirements */}
              {campaign.creator_tier_requirement && (
                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 mb-2">Creator Tier Requirements</h3>
                  <div className="flex flex-wrap gap-2">
                    {formatArrayField(campaign.creator_tier_requirement).map((tier, index) => (
                      <span key={index} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                        {tier}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Gender Preferences */}
              {campaign.creator_profile_preferences_gender && (
                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 mb-2">Gender Preferences</h3>
                  <div className="flex flex-wrap gap-2">
                    {formatArrayField(campaign.creator_profile_preferences_gender).map((gender, index) => (
                      <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                        {gender}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Ethnicity Preferences */}
              {campaign.creator_profile_preference_ethnicity && (
                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 mb-2">Ethnicity Preferences</h3>
                  <div className="flex flex-wrap gap-2">
                    {formatArrayField(campaign.creator_profile_preference_ethnicity).map((ethnicity, index) => (
                      <span key={index} className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                        {ethnicity}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Content Niche Preferences */}
              {campaign.creator_profile_preference_content_niche && (
                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 mb-2">Content Niche Preferences</h3>
                  <div className="flex flex-wrap gap-2">
                    {formatArrayField(campaign.creator_profile_preference_content_niche).map((niche, index) => (
                      <span key={index} className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
                        {niche}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Location Preferences */}
              {campaign.preferred_creator_location && (
                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 mb-2">Preferred Creator Locations</h3>
                  <div className="flex flex-wrap gap-2">
                    {formatArrayField(campaign.preferred_creator_location).map((location, index) => (
                      <span key={index} className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                        {location}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Content Guidelines Section */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Content Guidelines</h2>
              
              {/* Posting Requirements */}
              {campaign.posting_requirements && (
                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 mb-2">Posting Requirements</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-wrap">{formatTextField(campaign.posting_requirements)}</p>
                  </div>
                </div>
              )}

              {/* Prohibited Content Warnings */}
              {campaign.prohibited_content_warnings && (
                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 mb-2">Prohibited Content Warnings</h3>
                  <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
                    <p className="text-red-700 whitespace-pre-wrap">{formatTextField(campaign.prohibited_content_warnings)}</p>
                  </div>
                </div>
              )}

              {/* Campaign Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {campaign.send_to_creator && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Send to Creator</h3>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      campaign.send_to_creator === 'yes' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {campaign.send_to_creator === 'yes' ? 'Yes' : 'No'}
                    </span>
                  </div>
                )}

                {campaign.approved_by_brand && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Approved by Brand</h3>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      campaign.approved_by_brand === 'yes' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {campaign.approved_by_brand === 'yes' ? 'Yes' : 'No'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Application Status Card */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Apply for Campaign</h2>
              
              {/* Show application status message */}
              {applicationSuccess !== null && (
                <div className={`mb-4 p-3 rounded-lg ${
                  applicationSuccess 
                    ? 'bg-green-50 text-green-800 border border-green-200' 
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {applicationMessage}
                </div>
              )}
              
              <div className="mb-4">
                <h3 className="font-medium text-gray-900 mb-2">Campaign Deadline</h3>
                <div className="flex items-center text-gray-600">
                  <Calendar className="h-5 w-5 mr-2 text-purple-500" />
                  <span>{new Date(campaign.deadline).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-2">Compensation</h3>
                <div className="flex items-center text-gray-600 mb-2">
                  <DollarSign className="h-5 w-5 mr-2 text-purple-500" />
                  <span>
                    {campaign.budget_range}
                    {campaign.budget_unit && (
                      <span className="text-gray-500 text-sm ml-1">
                        ({campaign.budget_unit === 'total' ? 'Total Budget' : 
                          campaign.budget_unit === 'per_person' ? 'Per Creator' : 
                          campaign.budget_unit === 'per_video' ? 'Per Video' : 
                          campaign.budget_unit})
                      </span>
                    )}
                  </span>
                </div>
                {campaign.commission && (
                  <div className="flex items-center text-gray-600">
                    <Award className="h-5 w-5 mr-2 text-purple-500" />
                    <span>{campaign.commission}</span>
                  </div>
                )}
              </div>
              
              {status === 'authenticated' ? (
                canApply ? (
                  <button
                    onClick={handleApply}
                    disabled={!campaign.is_open || applyingTo === campaign.id}
                    className={`w-full flex justify-center items-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                      !campaign.is_open
                        ? 'bg-gray-400 cursor-not-allowed'
                        : applyingTo === campaign.id
                          ? 'bg-purple-400 cursor-not-allowed'
                          : 'bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500'
                    }`}
                  >
                    {!campaign.is_open 
                      ? 'Campaign Closed' 
                      : applyingTo === campaign.id 
                        ? 'Applying...' 
                        : 'Apply Now'}
                  </button>
                ) : (
                  <div className="text-sm text-amber-600 mb-2">
                    Only creator accounts can apply to campaigns.
                    <Link
                      href="/creatorportal/dashboard"
                      className="block mt-2 w-full flex justify-center items-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
                    >
                      Go to Creator Dashboard
                    </Link>
                  </div>
                )
              ) : (
                <Link
                  href="/login"
                  className="w-full flex justify-center items-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Log in to Apply
                </Link>
              )}
            </div>
            
            {/* Timeline */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4">How It Works</h2>
              <ol className="relative border-l border-gray-200 ml-3 space-y-6">
                <li className="ml-6">
                  <span className="absolute flex items-center justify-center w-6 h-6 bg-purple-100 rounded-full -left-3 ring-8 ring-white">
                    <span className="text-purple-800 text-sm font-bold">1</span>
                  </span>
                  <h3 className="font-medium text-gray-900">Apply</h3>
                  <p className="text-sm text-gray-600">Submit your application with a sample of your content idea</p>
                </li>
                <li className="ml-6">
                  <span className="absolute flex items-center justify-center w-6 h-6 bg-purple-100 rounded-full -left-3 ring-8 ring-white">
                    <span className="text-purple-800 text-sm font-bold">2</span>
                  </span>
                  <h3 className="font-medium text-gray-900">Get Approved</h3>
                  <p className="text-sm text-gray-600">Brand reviews your application and approves creators</p>
                </li>
                <li className="ml-6">
                  <span className="absolute flex items-center justify-center w-6 h-6 bg-purple-100 rounded-full -left-3 ring-8 ring-white">
                    <span className="text-purple-800 text-sm font-bold">3</span>
                  </span>
                  <h3 className="font-medium text-gray-900">Create Content</h3>
                  <p className="text-sm text-gray-600">Produce and share your content following brand guidelines</p>
                </li>
                <li className="ml-6">
                  <span className="absolute flex items-center justify-center w-6 h-6 bg-purple-100 rounded-full -left-3 ring-8 ring-white">
                    <span className="text-purple-800 text-sm font-bold">4</span>
                  </span>
                  <h3 className="font-medium text-gray-900">Get Paid</h3>
                  <p className="text-sm text-gray-600">Receive payment once your content is approved</p>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      {/* Application Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
            <h2 className="text-xl font-bold mb-4">Apply to Campaign: {campaign.title}</h2>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Please provide additional information to support your application:
              </p>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sample Script or Content Idea <span className="text-red-500">*</span>
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                rows={4}
                placeholder="Share your content idea or script for this campaign..."
                value={sampleText}
                onChange={(e) => setSampleText(e.target.value)}
                required
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sample Video URL (optional)
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                placeholder="e.g., https://www.youtube.com/watch?v=example"
                value={sampleVideoUrl}
                onChange={(e) => setSampleVideoUrl(e.target.value)}
              />
              <p className="mt-1 text-xs text-gray-500">
                Link to a previous video that demonstrates your content style
              </p>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitApplication}
                disabled={submitting || !sampleText.trim()}
                className={`px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                  submitting || !sampleText.trim()
                    ? 'bg-purple-400 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500'
                }`}
              >
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
