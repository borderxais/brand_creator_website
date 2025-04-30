'use client';

import { useState } from 'react';
import { Upload, FileText, ExternalLink, Save, Check, Info } from 'lucide-react';

export default function TikTokVerify() {
  // Form state
  const [formData, setFormData] = useState({
    // Identity Information
    passportName: '',
    nationality: '',
    realName: '',
    stageName: '',
    idType: 'passport',
    idNumber: '',
    gender: '',
    dateOfBirth: '',
    idFrontFile: null,
    handheldIdFile: null,
    
    // Influencer Information
    accountIntro: '',
    platformUrl: '',
    followerCount: '',
    backendScreenshotFile: null,
    otherPlatforms: '',
    
    // Cooperation Information
    signedAuthFile: null,
    agentEmail: '@bytedance.com',
    identityVideoFile: null,
    
    // Terms agreement
    termsAgreed: false
  });
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error when field is edited
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };
  
  // Handle file uploads
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files.length > 0) {
      setFormData({
        ...formData,
        [name]: files[0]
      });
      
      // Clear error when field is edited
      if (formErrors[name]) {
        setFormErrors({
          ...formErrors,
          [name]: ''
        });
      }
    }
  };
  
  // Handle checkbox changes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData({
      ...formData,
      [name]: checked
    });
  };

  // Validate form
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    // Required fields validation
    if (!formData.passportName) errors.passportName = 'Passport name is required';
    if (!formData.nationality) errors.nationality = 'Nationality is required';
    if (!formData.realName) errors.realName = 'Real name is required';
    if (!formData.idType) errors.idType = 'ID type is required';
    if (!formData.idNumber) errors.idNumber = 'ID number is required';
    if (!formData.gender) errors.gender = 'Gender is required';
    if (!formData.dateOfBirth) errors.dateOfBirth = 'Date of birth is required';
    if (!formData.idFrontFile) errors.idFrontFile = 'ID front image is required';
    if (!formData.handheldIdFile) errors.handheldIdFile = 'Handheld ID photo is required';
    if (!formData.accountIntro) errors.accountIntro = 'Account introduction is required';
    if (!formData.platformUrl) errors.platformUrl = 'Platform URL is required';
    if (!formData.followerCount) errors.followerCount = 'Follower count is required';
    if (!formData.backendScreenshotFile) errors.backendScreenshotFile = 'Backend screenshot is required';
    if (!formData.signedAuthFile) errors.signedAuthFile = 'Signed authorization file is required';
    if (!formData.agentEmail || !formData.agentEmail.includes('@bytedance.com')) 
      errors.agentEmail = 'Valid ByteDance email is required';
    if (!formData.termsAgreed) errors.termsAgreed = 'You must agree to the terms and conditions';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsSubmitting(true);
      
      // Mock API call
      setTimeout(() => {
        setIsSubmitting(false);
        setSubmitSuccess(true);
        
        // Reset form after success message
        setTimeout(() => {
          setSubmitSuccess(false);
        }, 5000);
      }, 2000);
    } else {
      // Scroll to first error
      const firstErrorField = Object.keys(formErrors)[0];
      const element = document.getElementsByName(firstErrorField)[0];
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };
  
  // Handle save draft
  const handleSaveDraft = () => {
    // Logic to save draft
    alert('Draft saved successfully!');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900">Overseas Influencer Account Registration Application</h1>
          <p className="mt-2 text-sm text-gray-600">
            Complete this form to register as an overseas influencer for TikTok promotional opportunities
          </p>
        </div>
      </div>

      {/* Success Message */}
      {submitSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <Check className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Registration submitted successfully</h3>
              <div className="mt-2 text-sm text-green-700">
                <p>Your application has been received. We will review your information and contact you shortly.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        {/* Section 1: Identity Information */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Identity Information</h2>
            <p className="mt-1 text-sm text-gray-600">Please provide your personal identification details</p>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Passport Name */}
              <div>
                <label htmlFor="passportName" className="block text-sm font-medium text-gray-700">
                  Passport Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="passportName"
                  id="passportName"
                  className={`mt-1 block w-full rounded-md shadow-sm ${
                    formErrors.passportName ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                  value={formData.passportName}
                  onChange={handleChange}
                />
                {formErrors.passportName && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.passportName}</p>
                )}
              </div>
              
              {/* Nationality */}
              <div>
                <label htmlFor="nationality" className="block text-sm font-medium text-gray-700">
                  Nationality <span className="text-red-500">*</span>
                </label>
                <select
                  name="nationality"
                  id="nationality"
                  className={`mt-1 block w-full rounded-md shadow-sm ${
                    formErrors.nationality ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                  value={formData.nationality}
                  onChange={handleChange}
                >
                  <option value="">Select your nationality</option>
                  <option value="US">United States</option>
                  <option value="UK">United Kingdom</option>
                  <option value="CA">Canada</option>
                  <option value="AU">Australia</option>
                  <option value="JP">Japan</option>
                  <option value="KR">South Korea</option>
                  <option value="OTHER">Other</option>
                </select>
                {formErrors.nationality && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.nationality}</p>
                )}
              </div>
              
              {/* Real Name */}
              <div>
                <label htmlFor="realName" className="block text-sm font-medium text-gray-700">
                  Real Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="realName"
                  id="realName"
                  className={`mt-1 block w-full rounded-md shadow-sm ${
                    formErrors.realName ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                  value={formData.realName}
                  onChange={handleChange}
                />
                {formErrors.realName && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.realName}</p>
                )}
              </div>
              
              {/* Stage Name */}
              <div>
                <label htmlFor="stageName" className="block text-sm font-medium text-gray-700">
                  Stage Name (Optional)
                </label>
                <input
                  type="text"
                  name="stageName"
                  id="stageName"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={formData.stageName}
                  onChange={handleChange}
                />
              </div>
              
              {/* ID Type */}
              <div>
                <label htmlFor="idType" className="block text-sm font-medium text-gray-700">
                  ID Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="idType"
                  id="idType"
                  className={`mt-1 block w-full rounded-md shadow-sm ${
                    formErrors.idType ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                  value={formData.idType}
                  onChange={handleChange}
                >
                  <option value="passport">Passport</option>
                  <option value="driverLicense">Driver's License</option>
                  <option value="nationalId">National ID Card</option>
                  <option value="other">Other Government ID</option>
                </select>
                {formErrors.idType && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.idType}</p>
                )}
              </div>
              
              {/* ID Number */}
              <div>
                <label htmlFor="idNumber" className="block text-sm font-medium text-gray-700">
                  ID Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="idNumber"
                  id="idNumber"
                  className={`mt-1 block w-full rounded-md shadow-sm ${
                    formErrors.idNumber ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                  value={formData.idNumber}
                  onChange={handleChange}
                />
                {formErrors.idNumber && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.idNumber}</p>
                )}
              </div>
              
              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Gender <span className="text-red-500">*</span>
                </label>
                <div className="mt-2 space-x-6">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="gender"
                      value="male"
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                      checked={formData.gender === 'male'}
                      onChange={handleChange}
                    />
                    <span className="ml-2 text-sm text-gray-700">Male</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="gender"
                      value="female"
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                      checked={formData.gender === 'female'}
                      onChange={handleChange}
                    />
                    <span className="ml-2 text-sm text-gray-700">Female</span>
                  </label>
                </div>
                {formErrors.gender && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.gender}</p>
                )}
              </div>
              
              {/* Date of Birth */}
              <div>
                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  id="dateOfBirth"
                  className={`mt-1 block w-full rounded-md shadow-sm ${
                    formErrors.dateOfBirth ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                />
                {formErrors.dateOfBirth && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.dateOfBirth}</p>
                )}
              </div>
            </div>
            
            {/* ID Front Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Upload ID Front <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="idFrontFile"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                    >
                      <span>Upload a file</span>
                      <input
                        id="idFrontFile"
                        name="idFrontFile"
                        type="file"
                        className="sr-only"
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                  {formData.idFrontFile && (
                    <p className="text-xs text-green-500">
                      File selected: {(formData.idFrontFile as File).name}
                    </p>
                  )}
                </div>
              </div>
              {formErrors.idFrontFile && (
                <p className="mt-1 text-sm text-red-600">{formErrors.idFrontFile}</p>
              )}
            </div>
            
            {/* Handheld ID Photo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Upload Handheld ID Photo <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-2">Please take a photo of yourself holding your ID for verification purposes</p>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="handheldIdFile"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                    >
                      <span>Upload a file</span>
                      <input
                        id="handheldIdFile"
                        name="handheldIdFile"
                        type="file"
                        className="sr-only"
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                  {formData.handheldIdFile && (
                    <p className="text-xs text-green-500">
                      File selected: {(formData.handheldIdFile as File).name}
                    </p>
                  )}
                </div>
              </div>
              {formErrors.handheldIdFile && (
                <p className="mt-1 text-sm text-red-600">{formErrors.handheldIdFile}</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Section 2: Influencer Information */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Influencer Information</h2>
            <p className="mt-1 text-sm text-gray-600">Tell us about your social media presence</p>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Account Introduction */}
            <div>
              <label htmlFor="accountIntro" className="block text-sm font-medium text-gray-700">
                Account Introduction <span className="text-red-500">*</span>
              </label>
              <textarea
                name="accountIntro"
                id="accountIntro"
                rows={4}
                className={`mt-1 block w-full rounded-md shadow-sm ${
                  formErrors.accountIntro ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                }`}
                placeholder="Describe your content style, audience demographics, and typical engagement"
                value={formData.accountIntro}
                onChange={handleChange}
              />
              {formErrors.accountIntro && (
                <p className="mt-1 text-sm text-red-600">{formErrors.accountIntro}</p>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Platform URL */}
              <div>
                <label htmlFor="platformUrl" className="block text-sm font-medium text-gray-700">
                  Overseas Platform URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  name="platformUrl"
                  id="platformUrl"
                  className={`mt-1 block w-full rounded-md shadow-sm ${
                    formErrors.platformUrl ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                  placeholder="https://www.example.com/your-profile"
                  value={formData.platformUrl}
                  onChange={handleChange}
                />
                {formErrors.platformUrl && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.platformUrl}</p>
                )}
              </div>
              
              {/* Follower Count */}
              <div>
                <label htmlFor="followerCount" className="block text-sm font-medium text-gray-700">
                  Follower Count <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="followerCount"
                  id="followerCount"
                  className={`mt-1 block w-full rounded-md shadow-sm ${
                    formErrors.followerCount ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                  min="0"
                  value={formData.followerCount}
                  onChange={handleChange}
                />
                {formErrors.followerCount && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.followerCount}</p>
                )}
              </div>
            </div>
            
            {/* Backend Screenshot Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Upload Backend Screenshot <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-2">Please provide a screenshot of your account analytics/dashboard showing follower count</p>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="backendScreenshotFile"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                    >
                      <span>Upload a file</span>
                      <input
                        id="backendScreenshotFile"
                        name="backendScreenshotFile"
                        type="file"
                        className="sr-only"
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                  {formData.backendScreenshotFile && (
                    <p className="text-xs text-green-500">
                      File selected: {(formData.backendScreenshotFile as File).name}
                    </p>
                  )}
                </div>
              </div>
              {formErrors.backendScreenshotFile && (
                <p className="mt-1 text-sm text-red-600">{formErrors.backendScreenshotFile}</p>
              )}
            </div>
            
            {/* Other Platforms */}
            <div>
              <label htmlFor="otherPlatforms" className="block text-sm font-medium text-gray-700">
                Other Platforms Joined (Optional)
              </label>
              <input
                type="text"
                name="otherPlatforms"
                id="otherPlatforms"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Instagram, YouTube, etc."
                value={formData.otherPlatforms}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>
        
        {/* Section 3: Cooperation Information */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Cooperation Information</h2>
            <p className="mt-1 text-sm text-gray-600">Complete the authorization process</p>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Authorization Template */}
            <div>
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-blue-500" />
                <span className="ml-2 text-sm font-medium text-gray-700">Authorization Template</span>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Please download, fill out, and sign the authorization template below.
              </p>
              <a 
                href="#" 
                className="mt-2 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Download Authorization Template
              </a>
            </div>
            
            {/* Signed Authorization File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Upload Signed Authorization File <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="signedAuthFile"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                    >
                      <span>Upload a file</span>
                      <input
                        id="signedAuthFile"
                        name="signedAuthFile"
                        type="file"
                        className="sr-only"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileChange}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PDF, JPG, PNG up to 10MB</p>
                  {formData.signedAuthFile && (
                    <p className="text-xs text-green-500">
                      File selected: {(formData.signedAuthFile as File).name}
                    </p>
                  )}
                </div>
              </div>
              {formErrors.signedAuthFile && (
                <p className="mt-1 text-sm text-red-600">{formErrors.signedAuthFile}</p>
              )}
            </div>
            
            {/* Agent Email */}
            <div>
              <label htmlFor="agentEmail" className="block text-sm font-medium text-gray-700">
                Agent Email <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="text"
                  name="agentEmail"
                  id="agentEmail"
                  className={`flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md ${
                    formErrors.agentEmail ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                  value={formData.agentEmail.split('@')[0]}
                  onChange={(e) => setFormData({
                    ...formData,
                    agentEmail: e.target.value + '@bytedance.com'
                  })}
                />
                <span className="inline-flex items-center px-3 py-2 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                  @bytedance.com
                </span>
              </div>
              {formErrors.agentEmail && (
                <p className="mt-1 text-sm text-red-600">{formErrors.agentEmail}</p>
              )}
            </div>
            
            {/* Identity Video Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Upload Identity Video (Optional)
              </label>
              <p className="text-xs text-gray-500 mb-2">A short video introducing yourself and showing your ID can expedite verification</p>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="identityVideoFile"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                    >
                      <span>Upload a file</span>
                      <input
                        id="identityVideoFile"
                        name="identityVideoFile"
                        type="file"
                        className="sr-only"
                        accept="video/*"
                        onChange={handleFileChange}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">MP4, MOV up to 50MB</p>
                  {formData.identityVideoFile && (
                    <p className="text-xs text-green-500">
                      File selected: {(formData.identityVideoFile as File).name}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Terms & Conditions */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="p-6">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="termsAgreed"
                  name="termsAgreed"
                  type="checkbox"
                  className={`focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded ${
                    formErrors.termsAgreed ? 'border-red-300' : ''
                  }`}
                  checked={formData.termsAgreed}
                  onChange={handleCheckboxChange}
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="termsAgreed" className="font-medium text-gray-700">
                  I agree to the terms and conditions <span className="text-red-500">*</span>
                </label>
                <p className="text-gray-500">
                  By checking this box, you agree to our{' '}
                  <a href="#" className="text-blue-600 hover:text-blue-500">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#" className="text-blue-600 hover:text-blue-500">
                    Privacy Policy
                  </a>
                  .
                </p>
                {formErrors.termsAgreed && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.termsAgreed}</p>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Form Actions */}
        <div className="flex space-x-4 justify-end">
          <button
            type="button"
            onClick={handleSaveDraft}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      </form>
      
      {/* Help Information */}
      <div className="mt-8 bg-blue-50 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <Info className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Need help?</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                If you have any questions about the application process, please contact our support team at{' '}
                <a href="mailto:creator-support@bytedance.com" className="font-medium underline">
                  creator-support@bytedance.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
