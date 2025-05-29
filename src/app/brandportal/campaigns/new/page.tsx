'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar } from 'lucide-react';
import Link from 'next/link';

interface Platform {
  id: string;
  name: string;
  displayName: string;
}

export default function NewCampaign() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  // Form state with new fields
  const [formData, setFormData] = useState({
    title: '',
    brief: '',
    requirements: '',
    budget_range: '',
    budgetUnit: 'total',
    commission: '',
    platform: '',
    deadline: '',
    max_creators: 10,
    is_open: true,
    sample_video_url: '',
    // New fields
    industry_category: '',
    primary_promotion_objectives: [] as string[],
    ad_placement: 'disable',
    campaign_execution_mode: 'direct',
    creator_profile_preferences_gender: [] as string[],
    creator_profile_preference_ethnicity: [] as string[],
    creator_profile_preference_content_niche: [] as string[],
    preferred_creator_location: [] as string[],
    language_requirement_for_creators: 'english',
    creator_tier_requirement: [] as string[],
    send_to_creator: 'yes',
    approved_by_brand: 'yes',
    kpi_reference_target: '',
    prohibited_content_warnings: '',
    posting_requirements: '', // Add this new field
    product_photo: null as File | null,
  });

  // Constants for the dropdown and multi-select options
  const industryCategories = [
    'Fast-Moving Consumer Goods (FMCG)',
    'Apparel & Accessories',
    'Retail',
    'Gaming',
    'Food & Beverage',
    'Utility Software',
    'Lifestyle Services',
    'Culture, Sports & Entertainment',
    'Media & Content',
    '3C & Electronics',
    'Other'
  ];

  const promotionObjectives = [
    'Brand Awareness',
    'E-commerce Sales',
    'App Downloads / Registrations',
    'Drive Traffic to Official Website',
    'Grow TikTok Followers',
    'Other'
  ];

  const contentNiches = [
    'Beauty',
    'Food',
    'Comedy / Skits',
    'Lifestyle',
    'Fashion',
    'Parenting / Family',
    'Reviews',
    'Travel',
    'Automotive',
    'Sports / Fitness',
    'Pets',
    'Other'
  ];

  const locations = [
    'United States (priority)',
    'Any English-speaking country (e.g., US, UK, Canada)',
    'Spanish-speaking countries (e.g., Mexico, Colombia, Spain)',
    'Other countries',
    'No geographic preference'
  ];

  const creatorTiers = [
    'L1 Estimated 1 – 10 orders/month, or new creators',
    'L2 Estimated 10 – 50 orders/month, some experience',
    'L3 Estimated 50 – 200 orders/month, avg. 10 k – 30 k views/video',
    'L4 Estimated 200 – 500 orders/month, steady "seeding" ability',
    'L5 Estimated 500 – 1 000 orders/month, proven sales capability',
    'L6 Estimated 1 000 – 5 000 orders/month, team-based production',
    'L7 Estimated 5 000 – 10 000+ orders/month, high content quality',
    'L8 10 000+ orders/month, outstanding past performance & compliance'
  ];

  useEffect(() => {
    // Redirect if not authenticated or not a brand
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'BRAND') {
      router.push('/login');
    }
    
    fetchPlatforms();
  }, [status, session, router]);

  const fetchPlatforms = async () => {
    try {
      const response = await fetch('/api/platforms');
      if (!response.ok) {
        throw new Error('Failed to fetch platforms');
      }
      const data = await response.json();
      setPlatforms(data);
    } catch (error) {
      console.error('Error fetching platforms:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, product_photo: e.target.files![0] }));
    }
  };

  // Handle multi-select options
  const handleMultiSelectToggle = (field: string, value: string) => {
    setFormData(prev => {
      const currentValues = prev[field as keyof typeof prev] as string[];
      if (Array.isArray(currentValues)) {
        return {
          ...prev,
          [field]: currentValues.includes(value)
            ? currentValues.filter(v => v !== value)
            : [...currentValues, value]
        };
      }
      return prev;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFormError(null);
    
    // Validate required fields
    if (!formData.title.trim()) {
      setFormError('Campaign title is required');
      setIsLoading(false);
      return;
    }

    // Validate file size if photo is provided
    if (formData.product_photo && formData.product_photo.size > 5 * 1024 * 1024) {
      setFormError('Product photo must be less than 5MB');
      setIsLoading(false);
      return;
    }

    try {
      let productPhotoUrl = null;
      
      // Step 1: Upload product photo if provided
      if (formData.product_photo) {
        console.log('Uploading product photo...');
        
        // Generate a temporary campaign ID for the upload
        const tempCampaignId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const photoFormData = new FormData();
        photoFormData.append('file', formData.product_photo);
        photoFormData.append('brand_id', session?.user?.id || 'unknown');
        photoFormData.append('campaign_id', tempCampaignId);
        
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: photoFormData
        });
        
        if (!uploadResponse.ok) {
          const uploadError = await uploadResponse.json();
          throw new Error(uploadError.error || 'Failed to upload product photo');
        }
        
        const uploadData = await uploadResponse.json();
        productPhotoUrl = uploadData.url;
        console.log('Product photo uploaded successfully:', productPhotoUrl);
      }
      
      // Step 2: Create campaign with photo URL
      const campaignFormData = new FormData();
      
      // Add all form fields except the file
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'product_photo') {
          // Skip the file, we already uploaded it
          return;
        } else if (Array.isArray(value)) {
          campaignFormData.append(key, JSON.stringify(value));
        } else if (typeof value === 'boolean') {
          campaignFormData.append(key, value ? 'true' : 'false');
        } else if (typeof value === 'number') {
          campaignFormData.append(key, value.toString());
        } else if (value === null || value === undefined) {
          return;
        } else {
          campaignFormData.append(key, String(value));
        }
      });
      
      // Add the uploaded photo URL with the correct field name to match database column
      if (productPhotoUrl) {
        campaignFormData.append('product_photo', productPhotoUrl);  // Use product_photo to match database column
      }

      const response = await fetch('/api/brand/campaigns', {
        method: 'POST',
        body: campaignFormData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create campaign');
      }

      // Campaign created successfully
      router.push('/brandportal/campaigns');
      router.refresh();
    } catch (error) {
      console.error('Error creating campaign:', error);
      setFormError(error instanceof Error ? error.message : 'Failed to create campaign');
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <Link 
            href="/brandportal/campaigns"
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Campaigns
          </Link>
        </div>
        
        <h1 className="text-3xl font-bold mb-6">Create New Campaign</h1>
        
        {formError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {formError}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6">
          {/* Basic Information Section */}
          <h2 className="text-xl font-semibold mb-4 pb-2 border-b">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Campaign Title */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Campaign Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Summer Fashion Collection Launch"
                required
              />
            </div>
            
            {/* Industry Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Industry Category <span className="text-red-500">*</span>
              </label>
              <select
                name="industry_category"
                value={formData.industry_category}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select an industry</option>
                {industryCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            {/* Platform */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Platform
              </label>
              <select
                name="platform"
                value={formData.platform}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a platform</option>
                {platforms.map((platform) => (
                  <option key={platform.id} value={platform.name}>
                    {platform.displayName}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Brief */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Campaign Brief
              </label>
              <textarea
                name="brief"
                value={formData.brief}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe what this campaign is about and what you're looking for"
              />
            </div>
            
            {/* Sample Video URL */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sample Video URL
              </label>
              <input
                type="url"
                name="sample_video_url"
                value={formData.sample_video_url}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/video"
                pattern="https://.*"
                title="URL must start with https://"
              />
              <p className="text-xs text-gray-500 mt-1">
                Provide a secure URL (https://) to a sample video showcasing desired content style
              </p>
            </div>
            
            {/* Product Photo Upload */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Photo
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Upload a photo of the product being promoted
              </p>
            </div>
          </div>
          
          {/* Campaign Objectives Section */}
          <h2 className="text-xl font-semibold mb-4 pb-2 border-b">Campaign Objectives & Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Primary Promotion Objectives (Multiple Choice) */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Primary Promotion Objectives (select all that apply)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {promotionObjectives.map(objective => (
                  <div key={objective} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`objective-${objective}`}
                      checked={formData.primary_promotion_objectives.includes(objective)}
                      onChange={() => handleMultiSelectToggle('primary_promotion_objectives', objective)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`objective-${objective}`} className="ml-2 text-sm text-gray-700">
                      {objective}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Posting Requirements - Add this new field */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Posting Requirements
              </label>
              <textarea
                name="posting_requirements"
                value={formData.posting_requirements}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., required topics, hashtags, links, @brand account mentions, etc."
              />
            </div>
            
            {/* Ad Placement */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ad Placement
              </label>
              <div className="mt-1">
                <div className="flex items-center mb-2">
                  <input
                    type="radio"
                    id="ad-disable"
                    name="ad_placement"
                    value="disable"
                    checked={formData.ad_placement === 'disable'}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor="ad-disable" className="ml-2 text-sm text-gray-700">
                    Disable (videos won't go through ad-review)
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="ad-enable"
                    name="ad_placement"
                    value="enable"
                    checked={formData.ad_placement === 'enable'}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor="ad-enable" className="ml-2 text-sm text-gray-700">
                    Enable
                  </label>
                </div>
              </div>
            </div>
            
            {/* Campaign Execution Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Campaign Execution Mode
              </label>
              <div className="mt-1">
                <div className="flex items-center mb-2">
                  <input
                    type="radio"
                    id="mode-direct"
                    name="campaign_execution_mode"
                    value="direct"
                    checked={formData.campaign_execution_mode === 'direct'}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor="mode-direct" className="ml-2 text-sm text-gray-700">
                    Direct Collaboration (one-to-one assignments)
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="mode-open"
                    name="campaign_execution_mode"
                    value="open"
                    checked={formData.campaign_execution_mode === 'open'}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor="mode-open" className="ml-2 text-sm text-gray-700">
                    Open Submission (commission pool, performance-based)
                  </label>
                </div>
              </div>
            </div>
            
            {/* Budget Range and Unit */}
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Budget Range
              </label>
              <div className="flex">
                <input
                  type="text"
                  name="budget_range"
                  value={formData.budget_range}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 1,000-2,000"
                />
                <select
                  name="budgetUnit"
                  value={formData.budgetUnit}
                  onChange={handleInputChange}
                  className="w-28 px-2 py-2 border border-l-0 border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="total">Total</option>
                  <option value="per_person">Per Person</option>
                  <option value="per_video">Per Video</option>
                </select>
              </div>
            </div>
            
            {/* Commission */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Commission
              </label>
              <input
                type="text"
                name="commission"
                value={formData.commission}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 15% per sale"
              />
            </div>
            
            {/* Deadline */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deadline
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="date"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            {/* Max Creators */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maximum Creators
              </label>
              <input
                type="number"
                name="max_creators"
                value={formData.max_creators}
                onChange={handleInputChange}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          {/* Creator Preferences Section */}
          <h2 className="text-xl font-semibold mb-4 pb-2 border-b">Creator Preferences</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Creator Gender Preferences */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender Preferences
              </label>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="gender-none"
                    checked={formData.creator_profile_preferences_gender.includes('No preference')}
                    onChange={() => handleMultiSelectToggle('creator_profile_preferences_gender', 'No preference')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="gender-none" className="ml-2 text-sm text-gray-700">
                    No preference
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="gender-female"
                    checked={formData.creator_profile_preferences_gender.includes('Female')}
                    onChange={() => handleMultiSelectToggle('creator_profile_preferences_gender', 'Female')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="gender-female" className="ml-2 text-sm text-gray-700">
                    Female
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="gender-male"
                    checked={formData.creator_profile_preferences_gender.includes('Male')}
                    onChange={() => handleMultiSelectToggle('creator_profile_preferences_gender', 'Male')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="gender-male" className="ml-2 text-sm text-gray-700">
                    Male
                  </label>
                </div>
              </div>
            </div>
            
            {/* Creator Ethnicity Preferences */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ethnicity Preferences
              </label>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="ethnicity-none"
                    checked={formData.creator_profile_preference_ethnicity.includes('No preference')}
                    onChange={() => handleMultiSelectToggle('creator_profile_preference_ethnicity', 'No preference')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="ethnicity-none" className="ml-2 text-sm text-gray-700">
                    No preference
                  </label>
                </div>
                {['Caucasian', 'Black / African American', 'Asian-American', 'Latinx / Hispanic', 'Mixed / Other'].map(ethnicity => (
                  <div key={ethnicity} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`ethnicity-${ethnicity}`}
                      checked={formData.creator_profile_preference_ethnicity.includes(ethnicity)}
                      onChange={() => handleMultiSelectToggle('creator_profile_preference_ethnicity', ethnicity)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`ethnicity-${ethnicity}`} className="ml-2 text-sm text-gray-700">
                      {ethnicity}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Creator Content Niche Preferences */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content Niche Preferences
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="niche-none"
                    checked={formData.creator_profile_preference_content_niche.includes('No preference')}
                    onChange={() => handleMultiSelectToggle('creator_profile_preference_content_niche', 'No preference')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="niche-none" className="ml-2 text-sm text-gray-700">
                    No preference
                  </label>
                </div>
                {contentNiches.map(niche => (
                  <div key={niche} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`niche-${niche}`}
                      checked={formData.creator_profile_preference_content_niche.includes(niche)}
                      onChange={() => handleMultiSelectToggle('creator_profile_preference_content_niche', niche)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`niche-${niche}`} className="ml-2 text-sm text-gray-700">
                      {niche}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Creator Location Preferences */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Creator Location
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {locations.map(location => (
                  <div key={location} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`location-${location}`}
                      checked={formData.preferred_creator_location.includes(location)}
                      onChange={() => handleMultiSelectToggle('preferred_creator_location', location)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`location-${location}`} className="ml-2 text-sm text-gray-700">
                      {location}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Language Requirement */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Language Requirement for Creators
              </label>
              <select
                name="language_requirement_for_creators"
                value={formData.language_requirement_for_creators}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="english">English</option>
                <option value="spanish">Spanish</option>
                <option value="bilingual">Bilingual Chinese & English</option>
                <option value="none">No restriction</option>
              </select>
            </div>
            
            {/* Creator Tier Requirements */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Creator Tier Requirements
              </label>
              <div className="grid grid-cols-1 gap-2">
                {creatorTiers.map(tier => (
                  <div key={tier} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`tier-${tier.substring(0, 2)}`}
                      checked={formData.creator_tier_requirement.includes(tier)}
                      onChange={() => handleMultiSelectToggle('creator_tier_requirement', tier)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`tier-${tier.substring(0, 2)}`} className="ml-2 text-sm text-gray-700">
                      {tier}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Additional Requirements Section */}
          <h2 className="text-xl font-semibold mb-4 pb-2 border-b">Additional Requirements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Send to Creator */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Will Products Be Sent to Creators?
              </label>
              <div className="mt-1">
                <div className="flex items-center mb-2">
                  <input
                    type="radio"
                    id="send-yes"
                    name="send_to_creator"
                    value="yes"
                    checked={formData.send_to_creator === 'yes'}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor="send-yes" className="ml-2 text-sm text-gray-700">
                    Yes
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="send-no"
                    name="send_to_creator"
                    value="no"
                    checked={formData.send_to_creator === 'no'}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor="send-no" className="ml-2 text-sm text-gray-700">
                    No
                  </label>
                </div>
              </div>
            </div>
            
            {/* Approval by Brand */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Must Content Be Approved by Brand Before Publishing?
              </label>
              <div className="mt-1">
                <div className="flex items-center mb-2">
                  <input
                    type="radio"
                    id="approve-yes"
                    name="approved_by_brand"
                    value="yes"
                    checked={formData.approved_by_brand === 'yes'}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor="approve-yes" className="ml-2 text-sm text-gray-700">
                    Yes, first draft must be approved before posting
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="approve-no"
                    name="approved_by_brand"
                    value="no"
                    checked={formData.approved_by_brand === 'no'}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor="approve-no" className="ml-2 text-sm text-gray-700">
                    No, creators may publish directly
                  </label>
                </div>
              </div>
            </div>
            
            {/* KPI Reference Targets */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                KPI Reference Targets (optional)
              </label>
              <textarea
                name="kpi_reference_target"
                value={formData.kpi_reference_target}
                onChange={handleInputChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Example: Each video must reach at least 50k views with a like-rate above 6%"
              />
            </div>
            
            {/* Prohibited Content Warnings */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prohibited Content or Risk Warnings (optional)
              </label>
              <textarea
                name="prohibited_content_warnings"
                value={formData.prohibited_content_warnings}
                onChange={handleInputChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Example: Avoid certain words, visuals, or tonal pitfalls, etc."
              />
            </div>
            
            {/* Is Open */}
            <div>
              <div className="flex items-center h-full">
                <input
                  type="checkbox"
                  id="is_open"
                  name="is_open"
                  checked={formData.is_open}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_open" className="ml-2 block text-sm text-gray-700">
                  Open for Applications
                </label>
              </div>
            </div>
          </div>
          
          <div className="mt-8 flex justify-end">
            <Link
              href="/brandportal/campaigns"
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 mr-4 hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className={`px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? 'Creating...' : 'Create Campaign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
