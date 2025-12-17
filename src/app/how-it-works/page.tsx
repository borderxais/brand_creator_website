'use client';

import { ArrowRight, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useState, useRef } from 'react';
import Image from 'next/image';

export default function HowItWorks() {
  const [activeTab, setActiveTab] = useState('creator');
  const creatorJourneyRef = useRef<HTMLDivElement>(null);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'creator' && creatorJourneyRef.current) {
      // Smooth scroll to The Creator Journey section
      setTimeout(() => {
        creatorJourneyRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 100);
    }
  };

  const creatorSteps = [
    {
      title: 'Create Your Profile',
      description: 'Sign up and build your professional profile showcasing your expertise, audience demographics, and past collaborations.',
      icon: '👤',
      gradient: 'from-purple-400 to-purple-600',
    },
    {
      title: 'Browse Opportunities',
      description: 'Explore brand campaigns that match your niche and style. Filter by industry, budget, and content type.',
      icon: '🔍',
      gradient: 'from-purple-500 to-indigo-600',
    },
    {
      title: 'Submit Proposals',
      description: 'Apply to campaigns with your creative ideas and pricing. Stand out with your unique value proposition.',
      icon: '✍️',
      gradient: 'from-indigo-400 to-purple-600',
    },
    {
      title: 'Create Content',
      description: 'Once approved, create authentic content that resonates with your audience while meeting brand guidelines.',
      icon: '🎨',
      gradient: 'from-purple-600 to-purple-800',
    },
    {
      title: 'Get Paid',
      description: 'Receive secure payments for your work through our platform. Track earnings and manage your income.',
      icon: '💰',
      gradient: 'from-indigo-500 to-purple-700',
    },
  ];

  const brandSteps = [
    {
      title: 'Create Brand Profile',
      description: 'Set up your brand profile with your company details, brand guidelines, and campaign preferences.',
      icon: '🏢',
      gradient: 'from-purple-400 to-indigo-600',
    },
    {
      title: 'Launch Campaign',
      description: 'Create detailed campaign briefs specifying your goals, requirements, and budget. Set targeting criteria for creators.',
      icon: '📢',
      gradient: 'from-indigo-400 to-purple-600',
    },
    {
      title: 'Review Proposals',
      description: 'Evaluate creator applications, review their portfolios, and select the best matches for your campaign.',
      icon: '📋',
      gradient: 'from-purple-500 to-purple-700',
    },
    {
      title: 'Collaborate',
      description: 'Work directly with creators, provide feedback, and approve content before publication.',
      icon: '🤝',
      gradient: 'from-purple-600 to-indigo-700',
    },
    {
      title: 'Track Results',
      description: 'Monitor campaign performance, engagement metrics, and ROI through our analytics dashboard.',
      icon: '📊',
      gradient: 'from-indigo-500 to-purple-800',
    },
  ];

  const creatorBenefits = [
    { text: 'Direct access to top brands', icon: '🎯' },
    { text: 'Flexible content creation', icon: '⏰' },
    { text: 'Competitive compensation', icon: '💵' },
    { text: 'Professional growth opportunities', icon: '📈' },
    { text: 'Dedicated support team', icon: '🤝' },
    { text: 'Performance analytics', icon: '📊' },
  ];

  const brandBenefits = [
    { text: 'Access to verified creators', icon: '✅' },
    { text: 'Campaign management tools', icon: '🛠️' },
    { text: 'Content rights management', icon: '📄' },
    { text: 'Performance tracking', icon: '📈' },
    { text: 'Brand safety controls', icon: '🛡️' },
    { text: 'Dedicated account manager', icon: '👨‍💼' },
  ];

  return (
    <div className="bg-white overflow-hidden">
      {/* Hero Section with Enhanced Background */}
      <div className="relative bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-900 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '0.5s'}}></div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-4 h-4 bg-white/20 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
          <div className="absolute top-40 right-20 w-3 h-3 bg-white/30 rounded-full animate-bounce" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-32 left-20 w-5 h-5 bg-white/15 rounded-full animate-bounce" style={{animationDelay: '2s'}}></div>
          <div className="absolute bottom-20 right-40 w-2 h-2 bg-white/25 rounded-full animate-bounce" style={{animationDelay: '1.5s'}}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="text-center">
            <div className="mb-8">
              <span className="inline-block px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-purple-200 text-sm font-medium border border-white/20 animate-fade-in">
                ✨ Discover Your Path to Success
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-8 bg-gradient-to-r from-white via-purple-100 to-purple-100 bg-clip-text text-transparent animate-fade-in-up">
              How Cricher AI Works
            </h1>
            <p className="text-xl md:text-2xl text-purple-100 max-w-3xl mx-auto mb-12 leading-relaxed animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              A powerful platform connecting brands with creators for authentic collaborations that drive real results.
            </p>
            
            {/* Enhanced Tabs with Glassmorphism */}
            <div className="flex justify-center space-x-6 mb-16 animate-fade-in-up" style={{animationDelay: '0.4s'}}>
              <button
                onClick={() => handleTabChange('creator')}
                className={`group px-8 py-4 rounded-2xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 ${
                  activeTab === 'creator'
                    ? 'bg-white/20 backdrop-blur-md text-white border-2 border-white/30 shadow-xl'
                    : 'bg-white/5 backdrop-blur-sm text-purple-200 border-2 border-white/10 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                <span className="flex items-center">
                  🎨 For Creators
                  <ArrowRight className="ml-2 w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Steps Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 animate-fade-in-up">
            {activeTab === 'creator' ? 'Your Journey to Success' : 'Launch Your Campaign'}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed animate-fade-in-up" style={{animationDelay: '0.1s'}}>
            {activeTab === 'creator'
              ? 'Follow these simple steps to start earning from your content creation skills and build meaningful partnerships.'
              : 'Connect with the perfect creators for your brand in just a few steps.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
          {(activeTab === 'creator' ? creatorSteps : brandSteps).map((step, index) => (
            <div
              key={index}
              className="group relative bg-white p-8 rounded-3xl shadow-xl border border-gray-100 hover:border-purple-200 transition-all duration-500 transform hover:-translate-y-2 hover:shadow-2xl animate-fade-in-up"
              style={{animationDelay: `${index * 0.1}s`}}
            >
              {/* Gradient Background on Hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${step.gradient} opacity-0 group-hover:opacity-5 rounded-3xl transition-opacity duration-500`}></div>
              
              {/* Step Number */}
              <div className="absolute -top-4 -left-4 w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                {index + 1}
              </div>
              
              <div className="relative">
                <div className="text-5xl mb-6 transform group-hover:scale-110 transition-transform duration-300">{step.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-purple-600 transition-colors duration-300">
                  {step.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Enhanced Creator Journey Section */}
      <div ref={creatorJourneyRef} className="w-full bg-gradient-to-b from-gray-50 to-white py-20 md:py-32">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="mb-6">
              <span className="inline-block px-4 py-2 bg-purple-100 text-purple-600 rounded-full text-sm font-medium">
                📍 Visual Guide
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 animate-fade-in-up">
              {activeTab === 'creator' ? 'The Creator Journey' : 'The Brand Experience'}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed animate-fade-in-up" style={{animationDelay: '0.1s'}}>
              {activeTab === 'creator'
                ? 'A visual guide to your path as a creator on Cricher AI - from signup to success'
                : 'How your brand will thrive with Cricher AI creators'}
            </p>
          </div>
          
          <div className="relative w-full rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-white to-gray-50 p-2 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
            <div className="relative w-full rounded-2xl overflow-hidden">
              <div className="min-h-[500px] bg-gradient-to-br from-purple-50 to-purple-50 flex items-center justify-center">
                <Image
                  src="/images/howitworks.jpg"
                  alt={activeTab === 'creator' ? 'Creator journey infographic' : 'Brand journey infographic'}
                  width={1200}
                  height={2500}
                  className="w-full object-contain transform hover:scale-105 transition-transform duration-700"
                  priority={true}
                  unoptimized={true}
                  onError={(e) => {
                    console.error('Image failed to load:', e);
                    if (e.currentTarget) {
                      e.currentTarget.style.display = 'none';
                      const parent = e.currentTarget.parentElement;
                      if (parent) {
                        parent.innerHTML += '<div class="p-8 text-center"><div class="text-6xl mb-4">🎨</div><h3 class="text-xl font-semibold text-gray-700 mb-2">Visual Guide Coming Soon</h3><p class="text-gray-500">We\'re preparing an amazing visual journey for you!</p></div>';
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Benefits Section */}
      <div className="bg-gradient-to-br from-purple-900 via-purple-900 to-indigo-900 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="text-center mb-20">
            <div className="mb-6">
              <span className="inline-block px-4 py-2 bg-white/10 backdrop-blur-sm text-purple-200 rounded-full text-sm font-medium border border-white/20">
                ⭐ Platform Benefits
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 animate-fade-in-up">
              Why Choose Cricher AI?
            </h2>
            <p className="text-xl text-purple-100 max-w-3xl mx-auto leading-relaxed animate-fade-in-up" style={{animationDelay: '0.1s'}}>
              {activeTab === 'creator'
                ? 'We provide everything you need to succeed as a content creator and build lasting partnerships.'
                : 'Everything you need to run successful influencer marketing campaigns.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {(activeTab === 'creator' ? creatorBenefits : brandBenefits).map((benefit, index) => (
              <div
                key={index}
                className="group flex items-start space-x-4 p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 hover:bg-white/20 hover:border-white/30 transition-all duration-300 transform hover:-translate-y-1 animate-fade-in-up"
                style={{animationDelay: `${index * 0.1}s`}}
              >
                <div className="text-2xl transform group-hover:scale-110 transition-transform duration-300">
                  {benefit.icon || <CheckCircle className="h-6 w-6 text-purple-400" />}
                </div>
                <span className="text-white font-medium leading-relaxed">{benefit.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Enhanced CTA Section */}
      <div className="bg-gradient-to-r from-purple-600 via-purple-600 to-indigo-600 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-purple-600/20 via-transparent to-purple-600/20 animate-pulse"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24">
          <div className="text-center">
            <div className="mb-8">
              <span className="inline-block px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-full text-sm font-medium border border-white/30">
                🚀 Ready to Begin?
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 animate-fade-in-up">
              {activeTab === 'creator'
                ? 'Ready to Start Your Journey?'
                : 'Ready to Launch Your Campaign?'}
            </h2>
            <p className="text-xl text-purple-100 mb-12 max-w-3xl mx-auto leading-relaxed animate-fade-in-up" style={{animationDelay: '0.1s'}}>
              {activeTab === 'creator'
                ? 'Join thousands of creators who are already earning through Cricher AI and building their dream careers.'
                : 'Connect with our diverse network of talented creators today.'}
            </p>
            <div className="space-x-6 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              {activeTab === 'creator' ? (
                <Link
                  href="/join-creator"
                  className="group inline-flex items-center justify-center px-8 py-4 border-2 border-white text-lg font-semibold rounded-2xl text-purple-600 bg-white hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl"
                >
                  Join as Creator
                  <ArrowRight className="ml-2 h-5 w-5 transform group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : (
                <Link
                  href="/join-brand"
                  className="group inline-flex items-center justify-center px-8 py-4 border-2 border-white text-lg font-semibold rounded-2xl text-purple-600 bg-white hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl"
                >
                  Join as Brand
                  <ArrowRight className="ml-2 h-5 w-5 transform group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add custom animations */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes fade-in-up {
          from { 
            opacity: 0;
            transform: translateY(30px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
