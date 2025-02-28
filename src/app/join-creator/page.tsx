'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle } from 'lucide-react';

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  niche: string;
  platforms: string[];
  audienceSize: string;
  bio: string;
}

export default function JoinAsCreator() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    niche: '',
    platforms: [],
    audienceSize: '',
    bio: '',
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

  const handlePlatformToggle = (platform: string) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform]
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
    } else {
      try {
        // Add API call here
        router.push('/creatorportal');
      } catch (error) {
        console.error('Error:', error);
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
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-black">Creator Profile</h2>
                <div>
                  <label className="block text-sm font-medium text-black">Content Niche</label>
                  <select
                    name="niche"
                    value={formData.niche}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-black"
                    required
                  >
                    <option value="">Select your primary niche</option>
                    {niches.map((niche) => (
                      <option key={niche} value={niche}>
                        {niche}
                      </option>
                    ))}
                  </select>
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
                    placeholder="Tell brands about yourself and your content..."
                    required
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-black">Your Platforms</h2>
                <div>
                  <label className="block text-sm font-medium text-black mb-3">
                    Select your active social media platforms
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    {platforms.map((platform) => (
                      <button
                        key={platform}
                        type="button"
                        onClick={() => handlePlatformToggle(platform)}
                        className={`p-4 rounded-lg border ${
                          formData.platforms.includes(platform)
                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                            : 'border-gray-200 hover:border-purple-500 text-black'
                        }`}
                      >
                        {platform}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 flex justify-between">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-black bg-white hover:bg-gray-50"
                >
                  Back
                </button>
              )}
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 ml-auto"
              >
                {step === 3 ? 'Complete Sign Up' : 'Next'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
