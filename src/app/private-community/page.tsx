'use client';

import { useState } from 'react';

interface PlanFeature {
  name: string;
  basic: string | boolean;
  standard: string | boolean;
  premium: string | boolean;
}

interface Plan {
  name: string;
  monthlyFee: number;
  recommendedAudience: string;
  contentPushes: string;
  isRecommended: boolean;
  color: string;
  description: string;
}

export default function PrivateCommunityPage() {
  const [activeProfiles, setActiveProfiles] = useState(500);
  const [showFeatures, setShowFeatures] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [selectedAdPlatform, setSelectedAdPlatform] = useState<string>('google');
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [addOnQuantities, setAddOnQuantities] = useState<{ [key: string]: number }>({
    'extra-content': 1,
    'extra-campaigns': 1
  });

  // Toggle features visibility for all cards
  const toggleFeaturesVisibility = () => {
    setShowFeatures(prev => !prev);
  };

  // Handle slider change - reset manual selection
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setActiveProfiles(Number(e.target.value));
    setSelectedPlan(null); // Reset manual selection when slider changes
  };

  // Determine recommended plan based on active profiles
  const getRecommendedPlan = (): 'basic' | 'standard' | 'premium' => {
    if (activeProfiles <= 1000) return 'basic';
    if (activeProfiles <= 3000) return 'standard';
    return 'premium';
  };

  const recommendedPlan = getRecommendedPlan();

  // Handle plan selection
  const handlePlanSelection = (planKey: string) => {
    setSelectedPlan(planKey);
  };

  // Determine if a plan should be highlighted (selected or recommended if no selection)
  const isPlanHighlighted = (planKey: string) => {
    return selectedPlan ? selectedPlan === planKey : recommendedPlan === planKey;
  };

  // Plan configurations
  const plans: Record<string, Plan> = {
    basic: {
      name: 'Basic Plan',
      monthlyFee: 99,
      recommendedAudience: '0-1,000 profiles',
      contentPushes: 'Up to 10 per month',
      isRecommended: isPlanHighlighted('basic'),
      color: 'blue',
      description: 'Perfect for getting started with private domain management'
    },
    standard: {
      name: 'Standard Plan',
      monthlyFee: 299,
      recommendedAudience: '1,000-3,000 profiles',
      contentPushes: 'Up to 50 per month',
      isRecommended: isPlanHighlighted('standard'),
      color: 'purple',
      description: 'Ideal for growing brands looking to boost engagement'
    },
    premium: {
      name: 'Premium Plan',
      monthlyFee: 599,
      recommendedAudience: '3,000+ profiles',
      contentPushes: 'Unlimited',
      isRecommended: isPlanHighlighted('premium'),
      color: 'gold',
      description: 'Complete solution for mature brands building ecosystems'
    }
  };

  // Feature comparison data
  const features: PlanFeature[] = [
    {
      name: 'Community/Group Management',
      basic: true,
      standard: true,
      premium: true
    },
    {
      name: 'AI Chatbot',
      basic: '50 interactions/month',
      standard: '200 interactions/month',
      premium: 'Unlimited interactions'
    },
    {
      name: 'User Tagging & Segmentation',
      basic: false,
      standard: true,
      premium: true
    },
    {
      name: 'Campaign Planning',
      basic: false,
      standard: 'Standard campaigns',
      premium: 'Viral campaigns'
    },
    {
      name: 'Automated User Workflows',
      basic: false,
      standard: false,
      premium: true
    },
    {
      name: 'Lifecycle-based Customer Management',
      basic: 'Early-stage testing & private domain validation',
      standard: 'Growth-stage brands boosting re-engagement',
      premium: 'Mature brands building closed-loop ecosystems'
    }
  ];

  const CheckIcon = () => (
    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  );

  const CrossIcon = () => (
    <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  );

  // Handle ad platform selection
  const handleAdPlatformSelection = (platform: string) => {
    setSelectedAdPlatform(platform);
  };

  // Ad platform configurations
  const adPlatforms = {
    meta: {
      name: 'Meta/Facebook Ads',
      minBudget: '$5,000/month',
      managementFee: '15% of ad spend',
      minimumFee: '$1,000/month',
      description: 'Reach billions of users across Facebook, Instagram, and WhatsApp',
      icon: '📘'
    },
    tiktok: {
      name: 'TikTok Ads',
      minBudget: '$3,000/month',
      managementFee: '15% of ad spend',
      minimumFee: '$800/month',
      description: 'Engage with younger audiences through viral video content',
      icon: '🎵'
    },
    google: {
      name: 'Google Ads',
      minBudget: '$2,500/month',
      managementFee: '12% of ad spend',
      minimumFee: '$600/month',
      description: 'Capture high-intent customers through search and display',
      icon: '🔍'
    }
  };

  // Handle add-on selection
  const handleAddOnSelection = (addOnId: string) => {
    setSelectedAddOns(prev => {
      if (prev.includes(addOnId)) {
        return prev.filter(id => id !== addOnId);
      } else {
        return [...prev, addOnId];
      }
    });
  };

  // Handle quantity change for add-ons
  const handleQuantityChange = (addOnId: string, quantity: number) => {
    setAddOnQuantities(prev => ({
      ...prev,
      [addOnId]: Math.max(1, quantity) // Ensure minimum quantity is 1
    }));
  };

  // Add-on services configuration
  const addOnServices = [
    {
      id: 'extra-content',
      name: 'Extra Content Pushes',
      description: 'Additional messages beyond your plan limit',
      pricing: '$8–$10 per extra message',
      details: 'Pricing depends on format & volume',
      available: true
    },
    {
      id: 'custom-chatbot',
      name: 'Custom AI Chatbot Development',
      description: 'Advanced CRM/ERP/API integration',
      pricing: '$1,000–$3,000 setup + $500–$800/month',
      details: '$0.20 per additional interaction',
      available: true
    },
    {
      id: 'extra-campaigns',
      name: 'Extra Viral Marketing Campaigns',
      description: 'Additional marketing campaigns beyond plan limits',
      pricing: '$500–$1,000 each',
      details: 'Custom campaign development and execution',
      available: true
    },
    {
      id: 'design-pack',
      name: 'Branded Visual Design Pack',
      description: 'Custom graphics and templates',
      pricing: '$150 per pack',
      details: '3–5 reusable templates included',
      available: true
    },
    {
      id: 'video-production',
      name: 'Short-Form Video Production',
      description: 'Professional video content creation',
      pricing: '$250 per video',
      details: 'Includes editing, voiceover, subtitle, cover',
      available: true
    }
  ];

  // Calculate total add-on cost estimate
  const getAddOnCostEstimate = () => {
    if (selectedAddOns.length === 0) return null;
    
    const costs: string[] = [];
    selectedAddOns.forEach(addOnId => {
      const addOn = addOnServices.find(service => service.id === addOnId);
      if (addOn) {
        costs.push(addOn.pricing);
      }
    });
    
    return costs;
  };

  // Calculate dynamic pricing
  const calculateTotalQuote = () => {
    // Get base plan price (use recommended if no plan selected)
    const currentPlan = selectedPlan || recommendedPlan;
    const planPrice = plans[currentPlan].monthlyFee;

    // Get advertising management fees
    const selectedPlatform = adPlatforms[selectedAdPlatform as keyof typeof adPlatforms];
    const minBudget = parseInt(selectedPlatform.minBudget.replace(/[$,\/month]/g, ''));
    const managementFeeRate = parseInt(selectedPlatform.managementFee.replace(/[%of ad spend]/g, '')) / 100;
    const advertisingFees = minBudget + (minBudget * managementFeeRate);

    // Calculate add-on fees with quantities
    const addOnPrices: { [key: string]: number } = {
      'extra-content': 8,
      'custom-chatbot': 1500,
      'extra-campaigns': 500,
      'design-pack': 150,
      'video-production': 250
    };

    const totalAddOnFees = selectedAddOns.reduce((total, addOnId) => {
      const basePrice = addOnPrices[addOnId] || 0;
      const quantity = addOnQuantities[addOnId] || 1;
      
      // Apply quantity for services that support it
      if (addOnId === 'extra-content' || addOnId === 'extra-campaigns') {
        return total + (basePrice * quantity);
      } else {
        return total + basePrice;
      }
    }, 0);

    const totalPrice = planPrice + advertisingFees + totalAddOnFees;

    return {
      planPrice,
      minBudget,
      managementFee: minBudget * managementFeeRate,
      advertisingFees,
      totalAddOnFees,
      totalPrice,
      currentPlan: plans[currentPlan].name,
      selectedPlatform: selectedPlatform.name
    };
  };

  const priceBreakdown = calculateTotalQuote();

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">Private Domain Services</h1>
          <p className="mt-4 text-xl text-gray-600">
            Build and manage your exclusive community with our comprehensive private domain solutions
          </p>
          <p className="mt-2 text-gray-500">
            Scale your engagement, automate workflows, and create lasting customer relationships
          </p>
        </div>

        {/* Active Profiles Slider */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How many active profiles do you have?</h2>
            <p className="text-gray-600">Adjust the slider to see our recommended plan for your needs</p>
          </div>
          
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <input
                type="range"
                min="0"
                max="5000"
                step="100"
                value={activeProfiles}
                onChange={handleSliderChange}
                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #8B5CF6 0%, #8B5CF6 ${(activeProfiles / 5000) * 100}%, #E5E7EB ${(activeProfiles / 5000) * 100}%, #E5E7EB 100%)`
                }}
              />
              <div className="flex justify-between text-sm text-gray-600 mt-2">
                <span>0</span>
                <span>1,000</span>
                <span>3,000</span>
                <span>5,000+</span>
              </div>
            </div>
            
            <div className="text-center mt-6">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {activeProfiles.toLocaleString()} profiles
              </div>
              <div className="text-lg text-gray-700">
                {selectedPlan ? (
                  <>Selected: <span className="font-semibold text-purple-600">{plans[selectedPlan].name}</span></>
                ) : (
                  <>Recommended: <span className="font-semibold text-purple-600">{plans[recommendedPlan].name}</span></>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {Object.entries(plans).map(([key, plan]) => (
            <div
              key={key}
              className={`relative bg-white rounded-lg shadow-lg overflow-visible transform transition-all duration-300 ${
                plan.isRecommended 
                  ? 'ring-4 ring-purple-500 scale-105 shadow-2xl' 
                  : 'hover:shadow-xl hover:scale-102'
              }`}
              style={{ marginTop: plan.isRecommended ? '24px' : '0' }}
            >
              {/* Recommended Badge */}
              {plan.isRecommended && (
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-10">
                  <div className="bg-purple-500 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg whitespace-nowrap">
                    {selectedPlan === key ? '✓ Selected' : '⭐ Recommended'}
                  </div>
                </div>
              )}

              <div className="p-8">
                {/* Plan Header */}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="text-4xl font-bold text-purple-600 mb-2">
                    ${plan.monthlyFee}<span className="text-lg text-gray-600">/month</span>
                  </div>
                  <p className="text-gray-600 mb-4">{plan.description}</p>
                  
                  {/* Key Metrics */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Recommended for:</span>
                      <span className="font-semibold">{plan.recommendedAudience}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Content pushes:</span>
                      <span className="font-semibold">{plan.contentPushes}</span>
                    </div>
                  </div>
                </div>

                {/* CTA Button - All plans are selectable */}
                <button
                  onClick={() => handlePlanSelection(key)}
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors mb-4 ${
                    plan.isRecommended
                      ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg'
                      : 'bg-gray-100 hover:bg-purple-50 hover:border-purple-300 text-gray-900 border border-gray-200'
                  }`}
                >
                  {plan.isRecommended ? 
                    (selectedPlan === key ? '✓ Selected Plan' : '🚀 Get Started - Recommended') 
                    : 'Choose This Plan'
                  }
                </button>

                {/* Popular Choice Badge for non-recommended plans */}
                {!plan.isRecommended && (
                  <div className="text-center mb-4">
                    <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                      Also a great choice
                    </span>
                  </div>
                )}

                {/* Expandable Features List */}
                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  showFeatures ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}>
                  <div className="space-y-4 pt-4 border-t border-gray-100">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Plan Features:</h4>
                    {features.map((feature, index) => {
                      const planFeature = feature[key as keyof typeof feature];
                      const hasFeature = planFeature === true || typeof planFeature === 'string';
                      
                      return (
                        <div key={index} className="flex items-start space-x-3">
                          <div className="flex-shrink-0 mt-0.5">
                            {hasFeature ? <CheckIcon /> : <CrossIcon />}
                          </div>
                          <div className={hasFeature ? 'text-gray-900' : 'text-gray-400'}>
                            <div className="font-medium text-sm">{feature.name}</div>
                            {typeof planFeature === 'string' && (
                              <div className="text-xs text-gray-600 mt-1">{planFeature}</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Single See More/Less Button */}
        <div className="text-center mb-16">
          <button
            onClick={toggleFeaturesVisibility}
            className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-purple-600 hover:text-purple-700 border border-purple-200 hover:border-purple-300 rounded-lg transition-colors"
          >
            {showFeatures ? (
              <>
                <span>See Less</span>
                <svg className="ml-2 w-5 h-5 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </>
            ) : (
              <>
                <span>See More Features</span>
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </>
            )}
          </button>
        </div>

        {/* Advertising Management Fees Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Advertising Management Fees</h2>
            <p className="text-lg text-gray-600 mb-2">(Quoted Separately)</p>
            <p className="text-gray-500">
              Professional ad management across major platforms to maximize your ROI
            </p>
          </div>

          {/* Platform Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {Object.entries(adPlatforms).map(([key, platform]) => (
              <div
                key={key}
                onClick={() => handleAdPlatformSelection(key)}
                className={`relative p-6 border-2 rounded-lg cursor-pointer transition-all duration-300 ${
                  selectedAdPlatform === key
                    ? 'border-purple-500 bg-purple-50 shadow-lg scale-105'
                    : 'border-gray-200 hover:border-purple-300 hover:shadow-md'
                }`}
              >
                {/* Selected Badge */}
                {selectedAdPlatform === key && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <div className="bg-purple-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Selected
                    </div>
                  </div>
                )}

                <div className="text-center">
                  <div className="text-4xl mb-3">{platform.icon}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{platform.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">{platform.description}</p>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Min. Budget:</span>
                      <span className="font-semibold text-purple-600">{platform.minBudget}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Management Fee:</span>
                      <span className="font-semibold">{platform.managementFee}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Minimum Fee:</span>
                      <span className="font-semibold">{platform.minimumFee}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Selected Platform Summary */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Selected Platform: {adPlatforms[selectedAdPlatform as keyof typeof adPlatforms].name}
              </h3>
              <span className="text-2xl">{adPlatforms[selectedAdPlatform as keyof typeof adPlatforms].icon}</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="bg-white p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Recommended Budget</div>
                <div className="text-lg font-bold text-purple-600">
                  {adPlatforms[selectedAdPlatform as keyof typeof adPlatforms].minBudget}
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Management Fee</div>
                <div className="text-lg font-bold">
                  {adPlatforms[selectedAdPlatform as keyof typeof adPlatforms].managementFee}
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Minimum Monthly Fee</div>
                <div className="text-lg font-bold">
                  {adPlatforms[selectedAdPlatform as keyof typeof adPlatforms].minimumFee}
                </div>
              </div>
            </div>

            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Advertising management fees are quoted separately and added to your selected private domain service plan. 
                Our expert team will optimize your campaigns for maximum ROI and provide detailed performance reports.
              </p>
            </div>
          </div>
        </div>

        {/* Service Comparison Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Service Comparison</h2>
            <p className="text-lg text-gray-600 mb-2">Complete breakdown of what's included in each plan</p>
            <p className="text-gray-500">
              Everything you need to build and manage your private domain community
            </p>
          </div>

          {/* Service Comparison Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {Object.entries(plans).map(([key, plan]) => (
              <div
                key={key}
                onClick={() => handlePlanSelection(key)}
                className={`relative bg-white border-2 rounded-lg p-6 cursor-pointer transition-all duration-300 ${
                  plan.isRecommended 
                    ? 'border-purple-500 bg-purple-50 shadow-lg scale-105' 
                    : 'border-gray-200 hover:border-purple-300 hover:shadow-md'
                }`}
              >
                {/* Plan Header */}
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  {plan.isRecommended && (
                    <div className="inline-block bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-semibold mb-2">
                      {selectedPlan === key ? 'Selected' : 'Recommended'}
                    </div>
                  )}
                </div>

                {/* Service Items */}
                <div className="space-y-4">
                  <div className="border-b border-gray-100 pb-3">
                    <div className="font-medium text-sm text-gray-700 mb-1">Community Setup & Onboarding</div>
                    <div className="flex items-center text-green-600">
                      <CheckIcon />
                      <span className="ml-2 text-sm">Included</span>
                    </div>
                  </div>

                  <div className="border-b border-gray-100 pb-3">
                    <div className="font-medium text-sm text-gray-700 mb-1">Content Calendar Planning</div>
                    <div className="flex items-center text-green-600">
                      <CheckIcon />
                      <span className="ml-2 text-sm">Included</span>
                    </div>
                  </div>

                  <div className="border-b border-gray-100 pb-3">
                    <div className="font-medium text-sm text-gray-700 mb-1">Content Pushes</div>
                    <div className="text-sm text-purple-600 font-semibold">
                      {key === 'basic' ? '10 posts per month' : 
                       key === 'standard' ? '30 posts per month' : 
                       '50 posts per month'}
                    </div>
                  </div>

                  <div className="border-b border-gray-100 pb-3">
                    <div className="font-medium text-sm text-gray-700 mb-1">User Interaction Management</div>
                    <div className="text-sm text-gray-600">
                      {key === 'basic' ? 'Basic replies' : 
                       key === 'standard' ? 'Tag-based campaigns' : 
                       'Advanced tagging + automated triggers'}
                    </div>
                  </div>

                  <div className="border-b border-gray-100 pb-3">
                    <div className="font-medium text-sm text-gray-700 mb-1">AI Chatbot</div>
                    <div className="text-sm text-gray-600">
                      {key === 'basic' ? 'Basic – 50 interactions/month' : 
                       key === 'standard' ? 'Upgraded – 200 interactions/month' : 
                       'Advanced – unlimited interactions + knowledge base'}
                    </div>
                  </div>

                  <div className="border-b border-gray-100 pb-3">
                    <div className="font-medium text-sm text-gray-700 mb-1">Viral Marketing Campaigns</div>
                    {key === 'basic' ? (
                      <div className="flex items-center text-red-500">
                        <CrossIcon />
                        <span className="ml-2 text-sm">Not included</span>
                      </div>
                    ) : key === 'standard' ? (
                      <div className="text-sm text-orange-600">Partial support</div>
                    ) : (
                      <div className="text-sm text-green-600">Fully executed every 2 months</div>
                    )}
                  </div>

                  <div className="border-b border-gray-100 pb-3">
                    <div className="font-medium text-sm text-gray-700 mb-1">Data & Performance Reports</div>
                    <div className="text-sm text-gray-600">
                      {key === 'basic' ? 'Monthly summary report' : 
                       key === 'standard' ? 'Monthly engagement report' : 
                       'Full-lifecycle analytics + ROI reporting'}
                    </div>
                  </div>

                  <div className="border-b border-gray-100 pb-3">
                    <div className="font-medium text-sm text-gray-700 mb-1">Branded Visual Design Pack</div>
                    <div className="text-sm text-orange-600">Add-on</div>
                  </div>

                  <div>
                    <div className="font-medium text-sm text-gray-700 mb-1">Short-Form Video Production</div>
                    <div className="text-sm text-orange-600">Add-on</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add-on Services Note */}
          <div className="bg-orange-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-orange-800 mb-3">Available Add-on Services</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold text-orange-700 mb-2">Branded Visual Design Pack</h4>
                <p className="text-orange-600">Custom graphics, templates, and visual assets tailored to your brand identity</p>
              </div>
              <div>
                <h4 className="font-semibold text-orange-700 mb-2">Short-Form Video Production</h4>
                <p className="text-orange-600">Professional video content creation for social media and engagement campaigns</p>
              </div>
            </div>
            <p className="text-sm text-orange-700 mt-4">
              <strong>Note:</strong> Add-on services are quoted separately based on your specific requirements and can be added to any plan.
            </p>
          </div>
        </div>

        {/* Add-on Services Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Add-on Services</h2>
            <p className="text-lg text-gray-600 mb-2">Enhance your plan with additional services</p>
            <p className="text-gray-500">
              Select multiple add-ons to customize your private domain solution
            </p>
          </div>

          {/* Add-on Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {addOnServices.map((addOn) => (
              <div
                key={addOn.id}
                className={`relative p-6 border-2 rounded-lg transition-all duration-300 ${
                  selectedAddOns.includes(addOn.id)
                    ? 'border-purple-500 bg-purple-50 shadow-lg scale-105'
                    : 'border-gray-200 hover:border-purple-300 hover:shadow-md'
                }`}
              >
                {/* Selected Badge */}
                {selectedAddOns.includes(addOn.id) && (
                  <div className="absolute -top-3 -right-3">
                    <div className="bg-purple-500 text-white rounded-full p-2">
                      <CheckIcon />
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{addOn.name}</h3>
                    <p className="text-sm text-gray-600 mb-3">{addOn.description}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="text-lg font-bold text-purple-600">
                      {addOn.pricing}
                    </div>
                    <div className="text-xs text-gray-500">
                      {addOn.details}
                    </div>
                  </div>

                  {/* Quantity Selector for specific add-ons */}
                  {selectedAddOns.includes(addOn.id) && (addOn.id === 'extra-content' || addOn.id === 'extra-campaigns') && (
                    <div className="bg-white p-3 rounded-lg border">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantity: {addOn.id === 'extra-content' ? 'Number of Extra Messages' : 'Number of Extra Campaigns'}
                      </label>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuantityChange(addOn.id, (addOnQuantities[addOn.id] || 1) - 1);
                          }}
                          className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-full text-gray-600"
                          disabled={addOnQuantities[addOn.id] <= 1}
                        >
                          -
                        </button>
                        <span className="w-12 text-center font-semibold">
                          {addOnQuantities[addOn.id] || 1}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuantityChange(addOn.id, (addOnQuantities[addOn.id] || 1) + 1);
                          }}
                          className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-full text-gray-600"
                        >
                          +
                        </button>
                      </div>
                      <div className="mt-2 text-sm text-purple-600 font-semibold">
                        Subtotal: ${addOn.id === 'extra-content' 
                          ? (8 * (addOnQuantities[addOn.id] || 1)).toLocaleString()
                          : (500 * (addOnQuantities[addOn.id] || 1)).toLocaleString()
                        }/month
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t border-gray-100">
                    <button 
                      onClick={() => handleAddOnSelection(addOn.id)}
                      className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                        selectedAddOns.includes(addOn.id)
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-purple-50 hover:text-purple-700'
                      }`}
                    >
                      {selectedAddOns.includes(addOn.id) ? 'Selected' : 'Add to Plan'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Selected Add-ons Summary */}
          {selectedAddOns.length > 0 && (
            <div className="bg-purple-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-purple-800 mb-4">Selected Add-on Services</h3>
              <div className="space-y-3">
                {selectedAddOns.map(addOnId => {
                  const addOn = addOnServices.find(service => service.id === addOnId);
                  if (!addOn) return null;
                  
                  const quantity = addOnQuantities[addOnId] || 1;
                  const hasQuantity = addOnId === 'extra-content' || addOnId === 'extra-campaigns';
                  const unitPrice = addOnId === 'extra-content' ? 8 : addOnId === 'extra-campaigns' ? 500 : 0;
                  
                  return (
                    <div key={addOnId} className="flex items-center justify-between bg-white p-3 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">{addOn.name}</h4>
                        <p className="text-sm text-gray-600">{addOn.description}</p>
                        {hasQuantity && (
                          <p className="text-sm text-purple-600">
                            Quantity: {quantity} × ${unitPrice} = ${(unitPrice * quantity).toLocaleString()}/month
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-purple-600">
                          {hasQuantity ? `$${(unitPrice * quantity).toLocaleString()}/month` : addOn.pricing}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddOnSelection(addOnId);
                          }}
                          className="text-sm text-red-600 hover:text-red-800 mt-1"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 p-4 bg-purple-100 rounded-lg">
                <p className="text-sm text-purple-800">
                  <strong>Note:</strong> Add-on pricing may vary based on your specific requirements and volume. 
                  Contact us for a detailed quote with your selected plan and add-ons.
                </p>
              </div>
            </div>
          )}

          {/* Add-on Services Table */}
          <div className="mt-8 overflow-x-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Complete Add-on Services List</h3>
            <table className="w-full border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    Service Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    Add-On Option
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">Community Setup & Onboarding</td>
                  <td className="px-6 py-4 text-sm text-gray-500">—</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">Content Calendar Planning</td>
                  <td className="px-6 py-4 text-sm text-gray-500">—</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">Content Pushes (text / image / audio / video)</td>
                  <td className="px-6 py-4 text-sm text-gray-600">$8–$10 per extra message (depends on format & volume)</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">User Interaction Management</td>
                  <td className="px-6 py-4 text-sm text-gray-500">—</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">AI Chatbot</td>
                  <td className="px-6 py-4 text-sm text-gray-600">Custom development (CRM/ERP/API integration): $1,000–$3,000 setup + $500–$800/month + $0.20 per additional interaction</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">Viral Marketing Campaigns</td>
                  <td className="px-6 py-4 text-sm text-gray-600">Extra campaigns: $500–$1,000 each</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">Data & Performance Reports</td>
                  <td className="px-6 py-4 text-sm text-gray-500">—</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">Branded Visual Design Pack</td>
                  <td className="px-6 py-4 text-sm text-gray-600">$150 per pack (3–5 reusable templates)</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">Short-Form Video Production</td>
                  <td className="px-6 py-4 text-sm text-gray-600">$250 per video (includes editing, voiceover, subtitle, cover)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Dynamic Pricing Summary */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Your Custom Quote</h2>
            <p className="text-lg text-gray-600 mb-2">Based on your selections</p>
            <p className="text-gray-500">
              Complete pricing breakdown for your private domain solution
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            {/* Price Breakdown */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing Breakdown</h3>
              
              <div className="space-y-4">
                {/* Plan Fee */}
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <div>
                    <span className="font-medium text-gray-900">{priceBreakdown.currentPlan}</span>
                    <span className="text-sm text-gray-500 ml-2">(Monthly subscription)</span>
                  </div>
                  <span className="font-semibold text-purple-600">${priceBreakdown.planPrice.toLocaleString()}/month</span>
                </div>

                {/* Advertising Management */}
                <div className="py-3 border-b border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-900">{priceBreakdown.selectedPlatform} Management</span>
                    <span className="font-semibold text-purple-600">${priceBreakdown.advertisingFees.toLocaleString()}/month</span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex justify-between">
                      <span>• Minimum ad budget:</span>
                      <span>${priceBreakdown.minBudget.toLocaleString()}/month</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• Management fee (15%):</span>
                      <span>${priceBreakdown.managementFee.toLocaleString()}/month</span>
                    </div>
                  </div>
                </div>

                {/* Add-on Services */}
                {selectedAddOns.length > 0 && (
                  <div className="py-3 border-b border-gray-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-900">Add-on Services</span>
                      <span className="font-semibold text-purple-600">${priceBreakdown.totalAddOnFees.toLocaleString()}/month</span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      {selectedAddOns.map(addOnId => {
                        const addOn = addOnServices.find(service => service.id === addOnId);
                        const addOnPrices: { [key: string]: number } = {
                          'extra-content': 8,
                          'custom-chatbot': 1500,
                          'extra-campaigns': 500,
                          'design-pack': 150,
                          'video-production': 250
                        };
                        if (!addOn) return null;
                        
                        const quantity = addOnQuantities[addOnId] || 1;
                        const unitPrice = addOnPrices[addOnId];
                        const hasQuantity = addOnId === 'extra-content' || addOnId === 'extra-campaigns';
                        const totalPrice = hasQuantity ? unitPrice * quantity : unitPrice;
                        
                        return (
                          <div key={addOnId} className="flex justify-between">
                            <span>
                              • {addOn.name}
                              {hasQuantity && ` (${quantity}x)`}:
                            </span>
                            <span>${totalPrice}/month</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Total */}
                <div className="flex justify-between items-center py-4 bg-purple-50 rounded-lg px-4">
                  <span className="text-xl font-bold text-gray-900">Total Monthly Investment Start With</span>
                  <span className="text-2xl font-bold text-purple-600">${priceBreakdown.totalPrice.toLocaleString()}/month</span>
                </div>
              </div>
            </div>

            {/* What's Included Summary */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h4 className="font-semibold text-blue-800 mb-3">What's Included in Your Package</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h5 className="font-medium text-blue-700 mb-2">Core Services</h5>
                  <ul className="space-y-1 text-blue-600">
                    <li>• {priceBreakdown.currentPlan} features</li>
                    <li>• {priceBreakdown.selectedPlatform} management</li>
                    <li>• Dedicated account manager</li>
                    <li>• Monthly performance reports</li>
                  </ul>
                </div>
                {selectedAddOns.length > 0 && (
                  <div>
                    <h5 className="font-medium text-blue-700 mb-2">Add-on Services</h5>
                    <ul className="space-y-1 text-blue-600">
                      {selectedAddOns.map(addOnId => {
                        const addOn = addOnServices.find(service => service.id === addOnId);
                        return addOn ? <li key={addOnId}>• {addOn.name}</li> : null;
                      })}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to build your private domain? Contact us to get your quote</h2>
          <p className="text-xl text-gray-600 mb-4">
            Join thousands of brands already leveraging private domain strategies
          </p>
          <p className="text-lg text-purple-600 font-semibold mb-8">
            Your estimated monthly investment: ${priceBreakdown.totalPrice.toLocaleString()}
          </p>
          <div className="space-x-4">
            <a 
              href="/contact" 
              className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
            >
              Get Your Custom Quote
            </a>
          </div>
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #8B5CF6;
          cursor: pointer;
          box-shadow: 0 0 2px 0 #555;
          transition: background .15s ease-in-out;
        }
        
        .slider::-webkit-slider-thumb:hover {
          background: #7C3AED;
        }
        
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #8B5CF6;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 2px 0 #555;
        }
      `}</style>
    </div>
  );
}
