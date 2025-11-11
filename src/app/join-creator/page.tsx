'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, CheckCircle } from 'lucide-react';

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  niches: string[]; // Changed from niche: string to niches: string[]
  platforms: string[];
  audienceSize: string;
  bio: string;
  creatorHandleName: string;
  termsAccepted: boolean;
}

export default function JoinAsCreator() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    niches: [], // Changed from niche: '' to niches: []
    platforms: [],
    audienceSize: '',
    bio: '',
    creatorHandleName: '',
    termsAccepted: false,
  });

  const platforms = [
    'Instagram',
    'TikTok',
    'YouTube',
    'Twitter',
    'LinkedIn',
    'Facebook',
  ] as const;

  const niches = [
    'Fashion & Style',
    'Beauty & Makeup',
    'Health & Fitness',
    'Food & Cooking',
    'Travel & Adventure',
    'Tech & Gaming',
    'Business & Finance',
    'Lifestyle',
    'Entertainment',
    'Education',
  ] as const;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Add checkbox change handler
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handlePlatformToggle = (platform: string) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform]
    }));
  };

  // Add niche toggle handler similar to platform toggle
  const handleNicheToggle = (niche: string) => {
    setFormData(prev => ({
      ...prev,
      niches: prev.niches.includes(niche)
        ? prev.niches.filter(n => n !== niche)
        : [...prev.niches, niche]
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate terms acceptance on step 3
    if (step === 3 && !formData.termsAccepted) {
      setError('You must accept the Terms of Service and Privacy Policy');
      return;
    }
    
    if (step < 3) {
      setStep(step + 1);
    } else {
      try {
        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          return;
        }

        console.log('Submitting registration with data:', {
          email: formData.email,
          name: formData.name,
          role: 'CREATOR',
          creatorHandleName: formData.creatorHandleName,
          niches: formData.niches,
          bio: formData.bio,
          audienceSize: formData.audienceSize,
          platforms: formData.platforms
        });

        // Register the user with enhanced profile data
        const response = await fetch('/api/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            name: formData.name,
            role: 'CREATOR',
            creatorHandleName: formData.creatorHandleName,
            // Send the additional profile data
            niches: formData.niches,
            bio: formData.bio,
            audienceSize: formData.audienceSize,
            platforms: formData.platforms
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Registration failed');
        }

        console.log('Registration successful:', data);
        
        // Check if there's a redirect URL from career application
        const redirectUrl = searchParams?.get('redirect');
        const fromApply = searchParams?.get('from');
        const positionId = searchParams?.get('position');
        
        if (redirectUrl && fromApply === 'apply' && positionId) {
          // Redirect back to career page with parameters to open modal
          router.push(`${redirectUrl}?from=apply&position=${positionId}`);
        } else {
          // Default redirect to login with success message
          router.push('/login?registered=true');
        }
      } catch (error) {
        console.error('Error:', error);
        setError(error instanceof Error ? error.message : 'Registration failed');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((num) => (
              <div key={num} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step >= num ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step > num ? <CheckCircle className="w-5 h-5" /> : num}
                </div>
                {num < 3 && (
                  <div
                    className={`w-24 h-1 mx-2 ${
                      step > num ? 'bg-purple-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-sm text-black">Account</span>
            <span className="text-sm text-black">Profile</span>
            <span className="text-sm text-black">Platforms</span>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6 md:p-8">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-black">Create Your Account</h2>
                <div>
                  <label className="block text-sm font-medium text-black">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-black"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-black"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black">Password</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-black"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black">Confirm Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-black"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="creatorHandleName" className="block text-sm font-medium text-black">
                    Creator Handle Name
                  </label>
                  <div className="mt-1">
                    <input
                      id="creatorHandleName"
                      name="creatorHandleName"
                      type="text"
                      required
                      value={formData.creatorHandleName}
                      onChange={(e) => setFormData({...formData, creatorHandleName: e.target.value})}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-black"
                      placeholder="Your unique creator handle"
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-black">Creator Profile</h2>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Content Niches (Select all that apply)</label>
                  <div className="grid grid-cols-2 gap-4">
                    {niches.map((niche) => (
                      <button
                        key={niche}
                        type="button"
                        onClick={() => handleNicheToggle(niche)}
                        className={`p-3 border rounded-lg flex items-center justify-between ${
                          formData.niches.includes(niche)
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-300'
                        }`}
                      >
                        <span className="text-black">{niche}</span>
                        {formData.niches.includes(niche) && (
                          <CheckCircle className="w-5 h-5 text-purple-500" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-black">Audience Size</label>
                  <select
                    name="audienceSize"
                    value={formData.audienceSize}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-black"
                    required
                  >
                    <option value="">Select your total audience size</option>
                    <option value="1-5k">1,000 - 5,000</option>
                    <option value="5-10k">5,000 - 10,000</option>
                    <option value="10-50k">10,000 - 50,000</option>
                    <option value="50-100k">50,000 - 100,000</option>
                    <option value="100k+">100,000+</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-black">Bio</label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows={4}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-black"
                    required
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-black">Your Platforms</h2>
                <div className="grid grid-cols-2 gap-4">
                  {platforms.map((platform) => (
                    <button
                      key={platform}
                      type="button"
                      onClick={() => handlePlatformToggle(platform)}
                      className={`p-4 border rounded-lg flex items-center justify-between ${
                        formData.platforms.includes(platform)
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-300'
                      }`}
                    >
                      <span className="text-black">{platform}</span>
                      {formData.platforms.includes(platform) && (
                        <CheckCircle className="w-5 h-5 text-purple-500" />
                      )}
                    </button>
                  ))}
                </div>
                
                {/* Terms and Privacy Policy Acceptance */}
                <div className="mt-6">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="termsAccepted"
                        name="termsAccepted"
                        type="checkbox"
                        checked={formData.termsAccepted}
                        onChange={handleCheckboxChange}
                        className="focus:ring-purple-500 h-4 w-4 text-purple-600 border-gray-300 rounded"
                        required
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="termsAccepted" className="font-medium text-gray-700">
                        I agree to the
                      </label>{" "}
                      <a 
                        href="https://ldlxyyctxylgmstfqlzh.supabase.co/storage/v1/object/sign/terms/Terms.pdf?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJ0ZXJtcy9UZXJtcy5wZGYiLCJpYXQiOjE3NDY2MzkzMTMsImV4cCI6MjA2MTk5OTMxM30.ONaP6D4wReFTY5z6MuXzX3cm3WKJHqwxceIwncJpDIQ" 
                        className="text-purple-600 hover:text-purple-500"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Terms of Service
                      </a>{" "}
                      and{" "}
                      <a 
                        href="https://ldlxyyctxylgmstfqlzh.supabase.co/storage/v1/object/sign/terms/Privacy%20Policy.pdf?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJ0ZXJtcy9Qcml2YWN5IFBvbGljeS5wZGYiLCJpYXQiOjE3NDY2Mzg4NDUsImV4cCI6MjA2MTk5ODg0NX0.x-zvJQc76-FnGAyUWhBW95PeaV9_4UNm8n7cKM6vko0" 
                        className="text-purple-600 hover:text-purple-500"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Privacy Policy
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                {step === 3 ? 'Create Account' : 'Next'}
                <ArrowRight className="ml-2 w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
