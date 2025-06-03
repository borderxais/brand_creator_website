'use client';

import { useState } from 'react';

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  submit?: string;
}

interface ContactResponse {
  success: boolean;
  message: string;
  contact_id?: string;
  stored_in_database?: boolean;
}

export default function ContactPage() {
  // Form state management
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  // Error state management
  const [errors, setErrors] = useState<FormErrors>({});
  
  // Loading and submission states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  // Success/Error status
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
    contactId?: string;
    storedInDb?: boolean;
    details?: string;
  }>({ type: null, message: '' });

  // Enhanced form validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters long';
    } else if (formData.name.trim().length > 50) {
      newErrors.name = 'Name must be less than 50 characters';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Subject validation
    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    } else if (formData.subject.trim().length < 5) {
      newErrors.subject = 'Subject must be at least 5 characters long';
    } else if (formData.subject.trim().length > 100) {
      newErrors.subject = 'Subject must be less than 100 characters';
    }

    // Message validation
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters long';
    } else if (formData.message.trim().length > 5000) {
      newErrors.message = 'Message must be less than 5000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Real-time validation as user types
  const validateField = (name: keyof ContactFormData, value: string) => {
    const newErrors = { ...errors };

    switch (name) {
      case 'name':
        if (!value.trim()) {
          newErrors.name = 'Name is required';
        } else if (value.trim().length < 2) {
          newErrors.name = 'Name must be at least 2 characters long';
        } else {
          delete newErrors.name;
        }
        break;
      case 'email':
        if (!value.trim()) {
          newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors.email = 'Please enter a valid email address';
        } else {
          delete newErrors.email;
        }
        break;
      case 'subject':
        if (!value.trim()) {
          newErrors.subject = 'Subject is required';
        } else if (value.trim().length < 5) {
          newErrors.subject = 'Subject must be at least 5 characters long';
        } else {
          delete newErrors.subject;
        }
        break;
      case 'message':
        if (!value.trim()) {
          newErrors.message = 'Message is required';
        } else if (value.trim().length < 10) {
          newErrors.message = 'Message must be at least 10 characters long';
        } else {
          delete newErrors.message;
        }
        break;
    }

    setErrors(newErrors);
  };

  // Handle input changes with real-time validation
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Update form data
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear submit error when user starts typing
    if (errors.submit) {
      setErrors(prev => ({
        ...prev,
        submit: undefined
      }));
    }

    // Real-time validation with debouncing
    setTimeout(() => {
      validateField(name as keyof ContactFormData, value);
    }, 300);
  };

  // Reset form to initial state
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      subject: '',
      message: ''
    });
    setErrors({});
    setIsSubmitted(false);
    setSubmitStatus({ type: null, message: '' });
  };

  // Enhanced form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setErrors({});
    setSubmitStatus({ type: null, message: '' });

    // Validate form
    if (!validateForm()) {
      setErrors(prev => ({
        ...prev,
        submit: 'Please correct the errors above before submitting.'
      }));
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('Submitting contact form:', formData);

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          timestamp: new Date().toISOString()
        }),
      });

      console.log('Contact form response status:', response.status);
      const data: ContactResponse = await response.json();
      console.log('Contact form response data:', data);

      if (response.ok && data.success) {
        // Success state - show only clean message
        setSubmitStatus({
          type: 'success',
          message: "Thank you for your message! We'll get back to you soon.", // Use clean message directly
          contactId: data.contact_id,
          storedInDb: data.stored_in_database
        });
        
        // Mark as submitted and reset form after delay
        setIsSubmitted(true);
        setTimeout(() => {
          resetForm();
        }, 5000); // Auto-reset after 5 seconds
        
      } else {
        throw new Error(data.message || 'Failed to send message');
      }
    } catch (error: any) {
      console.error('Error submitting contact form:', error);
      setSubmitStatus({
        type: 'error',
        message: 'Failed to send your message. Please try again.',
        details: error.message || 'Network error occurred'
      });
      
      setErrors({
        submit: error.message || 'An error occurred while submitting the form. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Character count helpers
  const getCharacterCount = (field: keyof ContactFormData) => {
    return formData[field].length;
  };

  const getCharacterLimit = (field: keyof ContactFormData) => {
    switch (field) {
      case 'name': return 50;
      case 'subject': return 100;
      case 'message': return 5000;
      default: return 0;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">Contact Us</h1>
          <p className="mt-4 text-xl text-gray-600">
            We're here to help you succeed
          </p>
          <p className="mt-2 text-gray-500">
            Get in touch with our team for support, partnerships, or any questions
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a message</h2>
                
                {/* Complete Success/Error Message */}
                {submitStatus.type && (
                  <div className={`mb-6 p-4 rounded-md border ${
                    submitStatus.type === 'success' 
                      ? 'bg-green-50 border-green-200 text-green-800' 
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}>
                    <div className="flex">
                      <div className="flex-shrink-0">
                        {submitStatus.type === 'success' ? (
                          <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div className="ml-3">
                        <h3 className={`text-sm font-medium ${
                          submitStatus.type === 'success' ? 'text-green-800' : 'text-red-800'
                        }`}>
                          {submitStatus.type === 'success' ? 'Message Sent Successfully!' : 'Error Sending Message'}
                        </h3>
                        <div className={`mt-2 text-sm ${
                          submitStatus.type === 'success' ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {/* Only show clean message for success, full message for errors */}
                          <p>
                            {submitStatus.type === 'success' 
                              ? "Thank you for your message! We'll get back to you soon."
                              : submitStatus.message
                            }
                          </p>
                          
                          {/* Show error details if available */}
                          {submitStatus.type === 'error' && submitStatus.details && (
                            <p className="mt-1 text-xs">{submitStatus.details}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Form submission success state */}
                {isSubmitted && submitStatus.type === 'success' ? (
                  <div className="text-center py-8">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                      <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Thank you for contacting us!</h3>
                    <p className="text-gray-600 mb-4">
                      We've received your message and will get back to you within 24 hours.
                    </p>
                    <button
                      onClick={resetForm}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-purple-700 bg-purple-100 hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    >
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                    {/* General submit error */}
                    {errors.submit && (
                      <div className="p-3 rounded-md bg-red-50 border border-red-200">
                        <p className="text-sm text-red-800">{errors.submit}</p>
                      </div>
                    )}

                    {/* Complete Name Field */}
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Name *
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="name"
                          id="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className={`shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                            errors.name ? 'border-red-300 ring-red-300' : ''
                          }`}
                          placeholder="Your full name"
                          required
                          disabled={isSubmitting}
                          maxLength={50}
                        />
                        <div className="mt-1 flex justify-between">
                          {errors.name ? (
                            <p className="text-sm text-red-600">{errors.name}</p>
                          ) : (
                            <p className="text-sm text-gray-500">Enter your full name</p>
                          )}
                          <p className="text-xs text-gray-400">
                            {getCharacterCount('name')}/{getCharacterLimit('name')}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Complete Email Field */}
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email *
                      </label>
                      <div className="mt-1">
                        <input
                          type="email"
                          name="email"
                          id="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className={`shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                            errors.email ? 'border-red-300 ring-red-300' : ''
                          }`}
                          placeholder="you@example.com"
                          required
                          disabled={isSubmitting}
                        />
                        {errors.email ? (
                          <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                        ) : (
                          <p className="mt-1 text-sm text-gray-500">We'll use this to respond to you</p>
                        )}
                      </div>
                    </div>

                    {/* Complete Subject Field */}
                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                        Subject *
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="subject"
                          id="subject"
                          value={formData.subject}
                          onChange={handleInputChange}
                          className={`shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                            errors.subject ? 'border-red-300 ring-red-300' : ''
                          }`}
                          placeholder="What's this about?"
                          required
                          disabled={isSubmitting}
                          maxLength={100}
                        />
                        <div className="mt-1 flex justify-between">
                          {errors.subject ? (
                            <p className="text-sm text-red-600">{errors.subject}</p>
                          ) : (
                            <p className="text-sm text-gray-500">Brief description of your inquiry</p>
                          )}
                          <p className="text-xs text-gray-400">
                            {getCharacterCount('subject')}/{getCharacterLimit('subject')}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Complete Message Field */}
                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                        Message *
                      </label>
                      <div className="mt-1">
                        <textarea
                          id="message"
                          name="message"
                          rows={6}
                          value={formData.message}
                          onChange={handleInputChange}
                          className={`shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                            errors.message ? 'border-red-300 ring-red-300' : ''
                          }`}
                          placeholder="Tell us more about your inquiry. Please include any relevant details..."
                          required
                          disabled={isSubmitting}
                          maxLength={5000}
                        />
                        <div className="mt-1 flex justify-between">
                          {errors.message ? (
                            <p className="text-sm text-red-600">{errors.message}</p>
                          ) : (
                            <p className="text-sm text-gray-500">Provide details about your inquiry (minimum 10 characters)</p>
                          )}
                          <p className="text-xs text-gray-400">
                            {getCharacterCount('message')}/{getCharacterLimit('message')}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Complete Submit Button */}
                    <div>
                      <button
                        type="submit"
                        disabled={isSubmitting || Object.keys(errors).length > 0}
                        className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors ${
                          isSubmitting || Object.keys(errors).length > 0
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500'
                        }`}
                      >
                        {isSubmitting ? (
                          <div className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Sending Message...
                          </div>
                        ) : (
                          'Send Message'
                        )}
                      </button>
                    </div>

                    {/* Form Reset Button */}
                    {(formData.name || formData.email || formData.subject || formData.message) && !isSubmitting && (
                      <div className="text-center">
                        <button
                          type="button"
                          onClick={resetForm}
                          className="text-sm text-gray-500 hover:text-gray-700 underline"
                        >
                          Clear Form
                        </button>
                      </div>
                    )}
                  </form>
                )}
              </div>
            </div>
          </div>

          {/* Contact Information Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Get in Touch</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Support</h4>
                  <p className="text-sm text-gray-600">
                    Need help? Our support team is available 24/7.
                  </p>
                  <a href="mailto:info@borderxmedia.com" className="text-sm text-purple-600 hover:text-purple-800">
                    info@borderxmedia.com
                  </a>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Business Inquiries</h4>
                  <p className="text-sm text-gray-600">
                    For business and partnership inquiries.
                  </p>
                  <a href="mailto:sam@borderxmedia.com" className="text-sm text-purple-600 hover:text-purple-800">
                    sam@borderxmedia.com
                  </a>
                </div>
              </div>
            </div>

            {/* FAQ Section */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Common Questions</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700">How quickly will you respond?</h4>
                  <p className="text-sm text-gray-600">
                    We typically respond within 24 hours during business days.
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Can I schedule a call?</h4>
                  <p className="text-sm text-gray-600">
                    Yes! Mention your preferred time in the message and we'll coordinate.
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Technical Issues?</h4>
                  <p className="text-sm text-gray-600">
                    For technical support, please include your browser and device information.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
