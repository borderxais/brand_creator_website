'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface PearStore {
  id: string;
  created_at: string;
  store_name: string;
  store_link: string;
  store_intro: string;
  store_logo?: string;
}

export default function PearPage() {
  const [stores, setStores] = useState<PearStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Check authentication status
  const checkAuthStatus = async () => {
    try {
      setAuthLoading(true);
      const response = await fetch('/api/pear/auth', {
        method: 'GET',
        credentials: 'include'
      });
      
      if (response.ok) {
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsLoggedIn(false);
    } finally {
      setAuthLoading(false);
    }
  };

  const fetchStores = async (search?: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) {
        params.append('search', search);
      }
      
      const response = await fetch(`/api/pear?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch stores');
      }
      
      const data = await response.json();
      setStores(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching stores:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
    checkAuthStatus();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStores(searchTerm);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    fetchStores();
  };

  const handleAffiliateClick = (e: React.MouseEvent) => {
    if (!isLoggedIn) {
      e.preventDefault();
      setShowLoginModal(true);
    }
    // If logged in, the link will work normally
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading stores...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl mb-6">Pear</h1>
          
          {/* Company Introduction - Fancy Section */}
          <div className="relative bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 rounded-3xl p-8 mb-12 mx-auto max-w-5xl overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-purple-200 to-transparent rounded-full opacity-50 -translate-y-20 translate-x-20"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-pink-200 to-transparent rounded-full opacity-50 translate-y-16 -translate-x-16"></div>
            
            {/* Content */}
            <div className="relative z-10">
              <div className="flex items-center justify-center mb-6">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                  Next-Gen Social Selling Platform
                </div>
              </div>
              
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 leading-tight">
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">The Future of Social Commerce</span>
              </h2>
              
              <p className="text-lg md:text-xl text-gray-700 leading-relaxed mb-8 max-w-4xl mx-auto">
                Pear is the next-gen social selling tool that helps you thrive in social-commerce. Centered around Shoppable-Posts to meet your ever-evolving needs to thrive in social selling, and amplify your hard work through promoters reselling into their communities.
              </p>
            </div>
          </div>
          
          {/* Secondary description */}
          <div className="max-w-3xl mx-auto">
            <p className="text-xl text-gray-600 mb-4">
              Discover amazing stores and brands powered by Pear's social commerce platform
            </p>
            <p className="text-gray-500">
              Explore curated stores with unique products and services, all enhanced with social selling capabilities
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="flex gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search stores by name or description..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Search
              </button>
              {searchTerm && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stores Grid */}
        {stores.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stores.map((store) => (
              <div
                key={store.id}
                className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
              >
                {/* Store Logo */}
                {store.store_logo && (
                  <div className="w-full h-32 bg-gray-100 flex items-center justify-center p-4">
                    <img
                      src={store.store_logo}
                      alt={`${store.store_name} logo`}
                      className="max-w-24 max-h-20 object-contain"
                      onError={(e) => {
                        // Hide image if it fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                
                <div className="p-6">
                  <div className="flex items-start gap-3 mb-3">
                    {/* Fallback logo if main logo doesn't exist or fails to load */}
                    {!store.store_logo && (
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-bold text-purple-600">
                          {store.store_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 leading-tight">
                        {store.store_name}
                      </h3>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {store.store_intro}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <a
                      href={store.store_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Visit Store
                      <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                    
                    <span className="text-xs text-gray-400">
                      {new Date(store.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
              <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No stores found</h3>
            <p className="text-gray-600">
              {searchTerm ? 'Try adjusting your search terms.' : 'No stores are available at the moment.'}
            </p>
          </div>
        )}

        {/* Store Count */}
        {stores.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Showing {stores.length} store{stores.length !== 1 ? 's' : ''}
              {searchTerm && ` for "${searchTerm}"`}
            </p>
          </div>
        )}

        {/* Affiliate Link Section */}
        <div className="mt-16 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 rounded-3xl p-8 mx-auto max-w-4xl text-center">
          <div className="relative">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-200 to-transparent rounded-full opacity-30 -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-pink-200 to-transparent rounded-full opacity-30 translate-y-12 -translate-x-12"></div>
            
            {/* Content */}
            <div className="relative z-10">
              <div className="mb-6">
                <span className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg mb-4">
                  Join the Community
                </span>
              </div>
              
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
                Get Your Own Affiliate Link from 
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"> Cricher.ai</span>
              </h2>
              
              <p className="text-lg text-gray-700 mb-8 max-w-2xl mx-auto">
                Start your journey with Pear's social commerce platform and earn while you grow your community. 
                Join thousands of successful affiliates already building their networks.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                {authLoading ? (
                  <div className="inline-flex items-center px-8 py-4 bg-gray-200 text-gray-500 text-lg font-semibold rounded-lg cursor-not-allowed">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400 mr-2"></div>
                    Checking...
                  </div>
                ) : isLoggedIn ? (
                  <a
                    href="https://pear.us/cricher-ai/invitation?invitationCode=akgy4a"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-lg font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    Get a Try
                    <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                ) : (
                  <button
                    onClick={handleAffiliateClick}
                    className="inline-flex items-center px-8 py-4 bg-gray-400 text-white text-lg font-semibold rounded-lg cursor-not-allowed opacity-75 hover:opacity-80 transition-opacity"
                  >
                    Login Required
                    <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </button>
                )}
                
                <div className="text-sm text-gray-600">
                  <p className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    {isLoggedIn ? 'Ready to join' : 'Login required'}
                  </p>
                  <p className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Instant access
                  </p>
                </div>
              </div>

              {/* Signup Prompt */}
              {!isLoggedIn && (
                <div className="mt-6 text-center">
                  <p className="text-gray-600 text-sm">
                    Don't have an account? Join as{' '}
                    <Link
                      href="/join-creator"
                      className="text-purple-600 hover:text-purple-700 font-medium underline transition-colors"
                    >
                      creator
                    </Link>
                    {' '}or{' '}
                    <Link
                      href="/join-brand"
                      className="text-purple-600 hover:text-purple-700 font-medium underline transition-colors"
                    >
                      brand
                    </Link>
                    {' '}right now!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Login Modal */}
        {showLoginModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-purple-100 mb-4">
                  <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Login Required</h3>
                <p className="text-gray-600 mb-6">
                  You need to be logged in to access the affiliate link. Please log in to continue.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    href="/auth/signin"
                    className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Sign Up
                  </Link>
                  <button
                    onClick={() => setShowLoginModal(false)}
                    className="inline-flex items-center px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
