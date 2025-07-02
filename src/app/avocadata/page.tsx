'use client';

import { useState } from 'react';

interface FormData {
  hashtags: string[];
  dataCount: number;
  gender: string[];
  ageRange: string[];
  states: string[];
  email: string;
}

export default function PrivateDomainDataService() {
  const [formData, setFormData] = useState<FormData>({
    hashtags: [],
    dataCount: 100,
    gender: [],
    ageRange: [],
    states: [],
    email: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const hashtagOptions = [
    'facial beauty product',
    'health product',
    'sports product'
  ];

  const genderOptions = ['F', 'M'];

  const ageRangeOptions = [
    '18-24',
    '25-34',
    '35-44',
    '45-54',
    '55-64',
    '65 and older',
    'N/A'
  ];

  const stateOptions = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
    'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
    'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
    'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
    'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
    'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
    'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
    'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
    'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
    'West Virginia', 'Wisconsin', 'Wyoming'
  ];

  const handleMultiSelect = (field: keyof FormData, value: string) => {
    const currentValues = formData[field] as string[];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(item => item !== value)
      : [...currentValues, value];
    
    setFormData(prev => ({
      ...prev,
      [field]: newValues
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Form submitted:', formData);
      setSubmitted(true);
    } catch (error) {
      console.error('Submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-green-500 text-6xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Request Submitted!</h2>
          <p className="text-gray-600 mb-6">
            Your data request has been processed. You will receive a CSV file with your filtered data via email within 24 hours.
          </p>
          <button
            onClick={() => {
              setSubmitted(false);
              setFormData({
                hashtags: [],
                dataCount: 100,
                gender: [],
                ageRange: [],
                states: [],
                email: ''
              });
            }}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Submit Another Request
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              Private Domain Data Service
            </h1>
            <p className="text-gray-600">
              Download targeted customer data from our database. Select your filters below and we'll email you a CSV file with the requested information including personal address, city, children status, gender, homeowner status, marital status, and more.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="your.email@example.com"
              />
            </div>

            {/* Data Count */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Records
              </label>
              <select
                value={formData.dataCount}
                onChange={(e) => setFormData(prev => ({ ...prev, dataCount: parseInt(e.target.value) }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={100}>100</option>
                <option value={500}>500</option>
                <option value={1000}>1,000</option>
                <option value={5000}>5,000</option>
                <option value={10000}>10,000</option>
              </select>
            </div>

            {/* Hashtags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Target Audience (Product Categories)
              </label>
              <div className="space-y-2">
                {hashtagOptions.map(option => (
                  <label key={option} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.hashtags.includes(option)}
                      onChange={() => handleMultiSelect('hashtags', option)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-gray-700 capitalize">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Gender
              </label>
              <div className="flex space-x-6">
                {genderOptions.map(option => (
                  <label key={option} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.gender.includes(option)}
                      onChange={() => handleMultiSelect('gender', option)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-gray-700">{option === 'F' ? 'Female' : 'Male'}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Age Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Age Range
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {ageRangeOptions.map(option => (
                  <label key={option} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.ageRange.includes(option)}
                      onChange={() => handleMultiSelect('ageRange', option)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* States */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                States
              </label>
              <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {stateOptions.map(state => (
                    <label key={state} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.states.includes(state)}
                        onChange={() => handleMultiSelect('states', state)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">{state}</span>
                    </label>
                  ))}
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Selected: {formData.states.length} states
              </p>
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={isSubmitting || !formData.email}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing Request...
                  </span>
                ) : (
                  'Submit Data Request'
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-800 mb-2">Important Notes:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• If no filters are selected, the first 100 records will be returned</li>
              <li>• CSV file will be emailed to you within 24 hours</li>
              <li>• Data includes: personal address, city, children status, gender, homeowner status, marital status, and more</li>
              <li>• All data is compliant with privacy regulations</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
