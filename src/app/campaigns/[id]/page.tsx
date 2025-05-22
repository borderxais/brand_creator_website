'use client';

import { useState } from 'react';
import Image from 'next/image';

// Mock data - replace with actual API calls
const mockCampaign = {
  id: 1,
  title: "Summer Fashion Collection Launch",
  brand: "StyleCo",
  brandLogo: "/brand-logo.png", // Add actual logo path
  budget: "$1,000-$2,000",
  budget_unit: "total", // Add budget unit
  platform: "Instagram",
  requirements: [
    "Fashion & Lifestyle creators with 10K+ followers",
    "Strong engagement rate (>3%)",
    "Previous experience with fashion brands",
    "High-quality photography skills",
    "Based in United States"
  ],
  deadline: "2024-02-28",
  description: "We're looking for fashion influencers to showcase our new summer collection through creative posts and stories. This campaign aims to highlight the versatility and style of our latest pieces while connecting with fashion-forward audiences.",
  deliverables: [
    "2 Instagram feed posts",
    "3 Instagram stories",
    "1 Reel",
    "Usage rights for 6 months"
  ],
  timeline: "Campaign duration: 2 weeks",
  status: "Active",
  category: "Fashion",
  brandInfo: "StyleCo is a contemporary fashion brand known for its modern, sustainable approach to style. Our pieces are designed for the fashion-conscious individual who values both aesthetics and ethics.",
  sample_video_url: "https://www.example.com/sample-video" // Add sample video URL
};

export default function CampaignDetail() {
  const [isApplying, setIsApplying] = useState(false);
  const [application, setApplication] = useState({
    pitch: '',
    rate: '',
    portfolio: '',
    availability: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement application submission logic
    setIsApplying(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Campaign Header */}
      <div className="bg-purple-900 text-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-extrabold">{mockCampaign.title}</h1>
              <div className="mt-2 flex items-center">
                <Image
                  src={mockCampaign.brandLogo}
                  alt={`${mockCampaign.brand} logo`}
                  width={32}
                  height={32}
                  className="rounded-full mr-2"
                />
                <p className="text-lg">{mockCampaign.brand}</p>
              </div>
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              {mockCampaign.status}
            </span>
          </div>
        </div>
      </div>

      {/* Campaign Content */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Overview */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Campaign Overview</h2>
              <p className="text-gray-600 mb-6">{mockCampaign.description}</p>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <h3 className="font-medium text-gray-900">Platform</h3>
                  <p className="text-gray-600">{mockCampaign.platform}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Category</h3>
                  <p className="text-gray-600">{mockCampaign.category}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Budget Range</h3>
                  <p className="text-gray-600">
                    {mockCampaign.budget} 
                    <span className="text-xs text-gray-500 ml-1">
                      ({mockCampaign.budget_unit === 'total' ? 'Total Budget' : 
                        mockCampaign.budget_unit === 'per_person' ? 'Per Creator' : 
                        mockCampaign.budget_unit === 'per_video' ? 'Per Video' : 
                        mockCampaign.budget_unit})
                    </span>
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Deadline</h3>
                  <p className="text-gray-600">{mockCampaign.deadline}</p>
                </div>
              </div>
              
              {/* Add Sample Video Section if available */}
              {mockCampaign.sample_video_url && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Sample Video</h3>
                  <div className="flex items-center">
                    <svg className="h-5 w-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <a 
                      href={mockCampaign.sample_video_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:text-purple-800 font-medium"
                    >
                      View sample video for reference
                    </a>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Watch this sample to understand the preferred content style for this campaign
                  </p>
                </div>
              )}

            </div>

            {/* Requirements */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Requirements</h2>
              <ul className="space-y-2">
                {mockCampaign.requirements.map((req, index) => (
                  <li key={index} className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-600">{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Deliverables */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4">Deliverables</h2>
              <ul className="space-y-2">
                {mockCampaign.deliverables.map((deliverable, index) => (
                  <li key={index} className="flex items-start">
                    <svg className="h-5 w-5 text-purple-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span className="text-gray-600">{deliverable}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Brand Info */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">About the Brand</h2>
              <p className="text-gray-600 mb-4">{mockCampaign.brandInfo}</p>
              <a href="#" className="text-purple-600 hover:text-purple-500 font-medium">
                View brand profile →
              </a>
            </div>

            {/* Application */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              {!isApplying ? (
                <button
                  onClick={() => setIsApplying(true)}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Apply for Campaign
                </button>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="pitch" className="block text-sm font-medium text-gray-700">
                      Why are you a good fit?
                    </label>
                    <textarea
                      id="pitch"
                      rows={4}
                      value={application.pitch}
                      onChange={(e) => setApplication({...application, pitch: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="rate" className="block text-sm font-medium text-gray-700">
                      Proposed rate
                    </label>
                    <input
                      type="text"
                      id="rate"
                      value={application.rate}
                      onChange={(e) => setApplication({...application, rate: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="portfolio" className="block text-sm font-medium text-gray-700">
                      Relevant portfolio links
                    </label>
                    <input
                      type="text"
                      id="portfolio"
                      value={application.portfolio}
                      onChange={(e) => setApplication({...application, portfolio: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="availability" className="block text-sm font-medium text-gray-700">
                      Availability
                    </label>
                    <input
                      type="text"
                      id="availability"
                      value={application.availability}
                      onChange={(e) => setApplication({...application, availability: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="submit"
                      className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    >
                      Submit Application
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsApplying(false)}
                      className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
