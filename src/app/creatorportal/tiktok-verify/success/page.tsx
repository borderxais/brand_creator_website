'use client';

import { useEffect } from 'react';
import { CheckCircle, Home, User, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function VerificationSuccess() {
  // Track page view
  useEffect(() => {
    // You could add analytics tracking here if needed
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-indigo-50 to-white">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="bg-purple-600 p-6 flex justify-center">
          <CheckCircle className="h-16 w-16 text-white" />
        </div>
        
        <div className="p-6 space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-purple-900">Application Submitted!</h1>
            <p className="mt-2 text-base text-gray-600">
              Your TikTok verification application has been received and is being processed.
            </p>
          </div>
          
          <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
            <h2 className="font-medium text-purple-800">What happens next?</h2>
            <ul className="mt-2 text-sm text-purple-700 space-y-1 list-disc list-inside">
              <li>Our team will review your application</li>
              <li>You'll receive an email confirmation shortly</li>
              <li>Processing typically takes 5-7 business days</li>
              <li>You may be contacted for additional information</li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Application Reference:</h3>
            <div className="bg-indigo-50 p-3 border border-indigo-100 rounded text-center">
              <span className="font-mono text-indigo-800 tracking-wider">
                TKT-{Math.floor(Math.random() * 10000).toString().padStart(4, '0')}-{
                  Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}
              </span>
            </div>
            <p className="text-xs text-gray-500">Save this reference number for future inquiries.</p>
          </div>
          
          <div className="pt-4 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
            <Link
              href="/creatorportal/dashboard"
              className="inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              <User className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Link>
            <Link
              href="/"
              className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              <Home className="mr-2 h-4 w-4" />
              Return Home
            </Link>
          </div>
          
          <div className="border-t border-gray-200 pt-4">
            <p className="text-sm text-gray-600">
              Have questions? <a href="mailto:creator-support@bytedance.com" className="text-purple-600 hover:text-purple-500">Contact our support team</a>.
            </p>
          </div>
        </div>
      </div>
      
      <div className="mt-8">
        <div className="p-4 bg-white rounded-lg shadow-md border border-purple-100">
          <h3 className="text-lg font-medium text-purple-800 mb-2">Ready to grow your audience?</h3>
          <p className="text-sm text-gray-600 mb-3">
            While we verify your account, explore our resources for creators to enhance your content strategy.
          </p>
          <a 
            href="https://www.tiktok.com/creators" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center text-sm font-medium text-purple-600 hover:text-purple-800"
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            Explore TikTok Creator Resources
          </a>
        </div>
      </div>
    </div>
  );
}
