'use client';

import { ArrowRight, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function HowItWorks() {
  const [activeTab, setActiveTab] = useState('creator');

  const creatorSteps = [
    {
      title: 'Create Your Profile',
      description: 'Sign up and build your professional profile showcasing your expertise, audience demographics, and past collaborations.',
      icon: '👤',
    },
    {
      title: 'Browse Opportunities',
      description: 'Explore brand campaigns that match your niche and style. Filter by industry, budget, and content type.',
      icon: '🔍',
    },
    {
      title: 'Submit Proposals',
      description: 'Apply to campaigns with your creative ideas and pricing. Stand out with your unique value proposition.',
      icon: '✍️',
    },
    {
      title: 'Create Content',
      description: 'Once approved, create authentic content that resonates with your audience while meeting brand guidelines.',
      icon: '🎨',
    },
    {
      title: 'Get Paid',
      description: 'Receive secure payments for your work through our platform. Track earnings and manage your income.',
      icon: '💰',
    },
  ];

  const brandSteps = [
    {
      title: 'Create Brand Profile',
      description: 'Set up your brand profile with your company details, brand guidelines, and campaign preferences.',
      icon: '🏢',
    },
    {
      title: 'Launch Campaign',
      description: 'Create detailed campaign briefs specifying your goals, requirements, and budget. Set targeting criteria for creators.',
      icon: '📢',
    },
    {
      title: 'Review Proposals',
      description: 'Evaluate creator applications, review their portfolios, and select the best matches for your campaign.',
      icon: '📋',
    },
    {
      title: 'Collaborate',
      description: 'Work directly with creators, provide feedback, and approve content before publication.',
      icon: '🤝',
    },
    {
      title: 'Track Results',
      description: 'Monitor campaign performance, engagement metrics, and ROI through our analytics dashboard.',
      icon: '📊',
    },
  ];

  const creatorBenefits = [
    'Direct access to top brands',
    'Flexible content creation',
    'Competitive compensation',
    'Professional growth opportunities',
    'Dedicated support team',
    'Performance analytics',
  ];

  const brandBenefits = [
    'Access to verified creators',
    'Campaign management tools',
    'Content rights management',
    'Performance tracking',
    'Brand safety controls',
    'Dedicated account manager',
  ];

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative bg-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              How BorderX Works
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              A powerful platform connecting brands with creators for authentic collaborations.
            </p>
            
            {/* Tabs */}
            <div className="flex justify-center space-x-4 mb-12">
              <button
                onClick={() => setActiveTab('creator')}
                className={`px-6 py-2 rounded-full text-lg font-medium transition-colors duration-200 ${
                  activeTab === 'creator'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                For Creators
              </button>
              <button
                onClick={() => setActiveTab('brand')}
                className={`px-6 py-2 rounded-full text-lg font-medium transition-colors duration-200 ${
                  activeTab === 'brand'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                For Brands
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Steps Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {activeTab === 'creator' ? 'Your Journey to Success' : 'Launch Your Campaign'}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {activeTab === 'creator'
              ? 'Follow these simple steps to start earning from your content creation skills.'
              : 'Connect with the perfect creators for your brand in just a few steps.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {(activeTab === 'creator' ? creatorSteps : brandSteps).map((step, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-lg shadow-lg border border-gray-100 hover:border-purple-200 transition-colors duration-200"
            >
              <div className="text-4xl mb-4">{step.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {step.title}
              </h3>
              <p className="text-gray-600">{step.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose BorderX?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {activeTab === 'creator'
                ? 'We provide everything you need to succeed as a content creator.'
                : 'Everything you need to run successful influencer marketing campaigns.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {(activeTab === 'creator' ? creatorBenefits : brandBenefits).map((benefit, index) => (
              <div
                key={index}
                className="flex items-start space-x-3 p-4 bg-white rounded-lg shadow-sm"
              >
                <CheckCircle className="h-6 w-6 text-purple-500 flex-shrink-0" />
                <span className="text-gray-700">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              {activeTab === 'creator'
                ? 'Ready to Start Your Journey?'
                : 'Ready to Launch Your Campaign?'}
            </h2>
            <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
              {activeTab === 'creator'
                ? 'Join thousands of creators who are already earning through BorderX.'
                : 'Connect with our diverse network of talented creators today.'}
            </p>
            <div className="space-x-4">
              <Link
                href={activeTab === 'creator' ? '/join-creator' : '/join-brand'}
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              {activeTab === 'creator'
                ? 'Ready to Start Your Journey?'
                : 'Ready to Launch Your Campaign?'}
            </h2>
            <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
              {activeTab === 'creator'
                ? 'Join thousands of creators who are already earning through BorderX.'
                : 'Connect with our diverse network of talented creators today.'}
            </p>
            <div className="space-x-4">
              {activeTab === 'creator' ? (
                <Link
                  href="/join-creator"
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-purple-600 bg-white hover:bg-purple-50"
                >
                  Join as Creator
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              ) : (
                <Link
                  href="/join-brand"
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-purple-600 bg-white hover:bg-purple-50"
                >
                  Join as Brand
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
