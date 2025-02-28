'use client';

import { useState } from 'react';
import { Category } from '@/types/category';
import { CategorySelector } from '@/components/ui/CategorySelector';

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: any) => void;
}

const platforms = [
  { id: 'instagram', name: 'Instagram' },
  { id: 'tiktok', name: 'TikTok' },
  { id: 'youtube', name: 'YouTube' },
  { id: 'weibo', name: 'Weibo' },
  { id: 'xiaohongshu', name: 'Xiaohongshu' },
  { id: 'douyin', name: 'Douyin' }
];

export default function CreateCampaignModal({ isOpen, onClose, onSubmit }: CreateCampaignModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    commissionRate: '',
    minimumCommission: '',
    maximumCommission: '',
    bonusIncentives: '',
    deadline: '',
    requirements: '',
    categories: [] as Category[],
    platforms: [] as string[]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    // Reset form
    setFormData({
      title: '',
      description: '',
      commissionRate: '',
      minimumCommission: '',
      maximumCommission: '',
      bonusIncentives: '',
      deadline: '',
      requirements: '',
      categories: [],
      platforms: []
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (categories: Category[]) => {
    setFormData(prev => ({ ...prev, categories }));
  };

  const handlePlatformChange = (platformId: string) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platformId)
        ? prev.platforms.filter(p => p !== platformId)
        : [...prev.platforms, platformId]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-2xl font-semibold text-gray-900">Create New Campaign</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Campaign Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Campaign Title
            </label>
            <input
              type="text"
              name="title"
              id="title"
              required
              value={formData.title}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Campaign Description
            </label>
            <textarea
              name="description"
              id="description"
              rows={4}
              required
              value={formData.description}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          {/* Commission Rate */}
          <div>
            <label htmlFor="commissionRate" className="block text-sm font-medium text-gray-700">
              Commission Rate (%)
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <input
                type="number"
                name="commissionRate"
                id="commissionRate"
                required
                min="0"
                max="100"
                step="0.1"
                value={formData.commissionRate}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                placeholder="e.g. 15.5"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">%</span>
              </div>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Percentage of sales that will be paid as commission
            </p>
          </div>

          {/* Commission Range */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="minimumCommission" className="block text-sm font-medium text-gray-700">
                Minimum Commission (USD)
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  name="minimumCommission"
                  id="minimumCommission"
                  min="0"
                  value={formData.minimumCommission}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 pl-7 pr-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label htmlFor="maximumCommission" className="block text-sm font-medium text-gray-700">
                Maximum Commission (USD)
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  name="maximumCommission"
                  id="maximumCommission"
                  min="0"
                  value={formData.maximumCommission}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 pl-7 pr-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Bonus Incentives */}
          <div>
            <label htmlFor="bonusIncentives" className="block text-sm font-medium text-gray-700">
              Performance Bonuses & Additional Incentives
            </label>
            <textarea
              name="bonusIncentives"
              id="bonusIncentives"
              rows={3}
              value={formData.bonusIncentives}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              placeholder="e.g. +5% bonus for sales over $10,000, or additional $100 for first 50 sales"
            />
            <p className="mt-1 text-sm text-gray-500">
              Describe any additional performance-based rewards or milestone bonuses
            </p>
          </div>

          {/* Deadline */}
          <div>
            <label htmlFor="deadline" className="block text-sm font-medium text-gray-700">
              Campaign Deadline
            </label>
            <input
              type="date"
              name="deadline"
              id="deadline"
              required
              value={formData.deadline}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          {/* Categories */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categories
            </label>
            <CategorySelector
              selectedCategories={formData.categories}
              onChange={handleCategoryChange}
              maxCategories={3}
            />
          </div>

          {/* Platforms */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Platforms
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {platforms.map((platform) => (
                <div key={platform.id} className="relative flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id={platform.id}
                      type="checkbox"
                      checked={formData.platforms.includes(platform.id)}
                      onChange={() => handlePlatformChange(platform.id)}
                      className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor={platform.id} className="font-medium text-gray-700">
                      {platform.name}
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Requirements */}
          <div>
            <label htmlFor="requirements" className="block text-sm font-medium text-gray-700">
              Campaign Requirements
            </label>
            <textarea
              name="requirements"
              id="requirements"
              rows={4}
              value={formData.requirements}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              placeholder="Specific requirements for creators..."
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Create Campaign
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
