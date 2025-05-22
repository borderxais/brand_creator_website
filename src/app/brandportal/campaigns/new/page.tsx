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
  
  // Form state
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
    sample_video_url: '', // Add sample video URL field
  });

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
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

    // Validate sample video URL if provided
    if (formData.sample_video_url && !formData.sample_video_url.startsWith('https://')) {
      setFormError('Sample video URL must start with https://');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/brand/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create campaign');
      }

      // Campaign created successfully, redirect to campaigns list
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
      <div className="max-w-3xl mx-auto">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            
            {/* Requirements */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Creator Requirements
              </label>
              <textarea
                name="requirements"
                value={formData.requirements}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Minimum 10k followers, Fashion/Lifestyle niche, High engagement rate"
              />
              <p className="text-xs text-gray-500 mt-1">
                You can use comma-separated values or enter requirements as a list
              </p>
            </div>
            
            {/* Budget Range and Unit (modified) */}
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
                onChange={handleNumberChange}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
