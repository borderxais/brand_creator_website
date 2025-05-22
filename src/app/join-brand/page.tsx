'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle } from 'lucide-react';

// Update the FormData interface to include termsAccepted
interface FormData {
  companyName: string;
  website: string;
  email: string;
  password: string;
  confirmPassword: string;
  industry: string;
  size: string;
  marketingBudget: string;
  goals: string[];
  termsAccepted: boolean; // Add this field
}

export default function JoinAsBrand() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<FormData>({
    companyName: '',
    website: '',
    email: '',
    password: '',
    confirmPassword: '',
    industry: '',
    size: '',
    marketingBudget: '',
    goals: [],
    termsAccepted: false, // Initialize as false
  });

  const industries = [
    'Fashion & Apparel',
    'Beauty & Cosmetics',
    'Health & Wellness',
    'Food & Beverage',
    'Travel & Hospitality',
    'Technology',
    'Finance & Fintech',
    'E-commerce',
    'Entertainment',
    'Education',
  ] as const;

  const companySizes = [
    'Startup (1-10 employees)',
    'Small (11-50 employees)',
    'Medium (51-200 employees)',
    'Large (201-1000 employees)',
    'Enterprise (1000+ employees)',
  ] as const;

  const marketingBudgets = [
    'Under $5,000/month',
    '$5,000 - $10,000/month',
    '$10,000 - $25,000/month',
    '$25,000 - $50,000/month',
    '$50,000+/month',
  ] as const;

  const goals = [
    'Brand Awareness',
    'Product Launch',
    'Sales & Conversions',
    'Social Media Growth',
    'Content Creation',
    'Community Building',
  ] as const;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGoalToggle = (goal: string) => {
    setFormData(prev => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter(g => g !== goal)
        : [...prev.goals, goal]
    }));
  };

  // Add checkbox change handler if it doesn't already exist
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
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

        // Register the user
        const response = await fetch('/api/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            name: formData.companyName,
            role: 'BRAND'
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Registration failed');
        }

        // Redirect to login with success message
        router.push('/login?registered=true');
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
            <span className="text-sm text-black">Company</span>
            <span className="text-sm text-black">Details</span>
            <span className="text-sm text-black">Goals</span>
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
                <h2 className="text-2xl font-bold text-black">Company Information</h2>
                <div>
                  <label className="block text-sm font-medium text-black">
                    Company Name
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-black"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black">
                    Company Website
                    <span className="text-gray-500 text-sm font-normal ml-1">(optional)</span>
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-black"
                    placeholder="https://www.example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black">Business Email</label>
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
                <h2 className="text-2xl font-bold text-black">Company Details</h2>
                <div>
                  <label className="block text-sm font-medium text-black">Industry</label>
                  <select
                    name="industry"
                    value={formData.industry}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-black"
                    required
                  >
                    <option value="">Select your industry</option>
                    {industries.map((industry) => (
                      <option key={industry} value={industry}>
                        {industry}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-black">Company Size</label>
                  <select
                    name="size"
                    value={formData.size}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-black"
                    required
                  >
                    <option value="">Select company size</option>
                    {companySizes.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-black">
                    Monthly Marketing Budget
                  </label>
                  <select
                    name="marketingBudget"
                    value={formData.marketingBudget}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-black"
                    required
                  >
                    <option value="">Select budget range</option>
                    {marketingBudgets.map((budget) => (
                      <option key={budget} value={budget}>
                        {budget}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-black">Campaign Goals</h2>
                <div className="grid grid-cols-2 gap-4">
                  {goals.map((goal) => (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => handleGoalToggle(goal)}
                      className={`p-4 border rounded-lg flex items-center justify-between ${
                        formData.goals.includes(goal)
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-300'
                      }`}
                    >
                      <span className="text-black">{goal}</span>
                      {formData.goals.includes(goal) && (
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
