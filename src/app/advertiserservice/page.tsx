'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

// Add this interface above your component
interface AdGroup {
  adgroup_id: string;
  status: string;
  cost_per_conversion: string;
  cpc: string;
  spend: string;
  conversion: string;
  impressions: string;
  cpm: string;
  name?: string;
  date_range?: string;
}

// Set fixed advertiser ID as specified
const ADVERTISER_ID = '7385681808811294736';

// Mock data to use while API integration is in progress - only ENABLE status
const mockAdGroups = [
  {
    adgroup_id: '123456789',
    status: 'ENABLE',
    cost_per_conversion: '12.50',
    cpc: '2.35',
    spend: '1200.00',
    conversion: '96',
    impressions: '150000',
    cpm: '8.00'
  },
  {
    adgroup_id: '987654321',
    status: 'ENABLE',
    cost_per_conversion: '9.75',
    cpc: '1.89',
    spend: '950.00',
    conversion: '98',
    impressions: '120000',
    cpm: '7.92'
  },
];

export default function AdvertiserService() {
  const { data: session } = useSession();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Add the type annotation here
  const [adGroups, setAdGroups] = useState<AdGroup[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);

  // Fetch ad groups on component mount
  useEffect(() => {
    fetchAdGroups();
  }, []);

  const fetchAdGroups = async () => {
    setLoading(true);
    try {
      console.log('Fetching ENABLE ad groups for advertiser ID:', ADVERTISER_ID);
      // Try to fetch from API
      const response = await fetch(`/api/advertiser?advertiser_id=${ADVERTISER_ID}`);
      
      const data = await response.json();
      console.log('Fetched ad groups data:', data);
      
      // Check if we received valid data
      if (!response.ok || !data || (Array.isArray(data) && data.length === 0)) {
        console.warn('Using mock data instead');
        setAdGroups(mockAdGroups);
      } else {
        // Process the received data based on its structure
        let adGroupsData = [];
        if (Array.isArray(data)) {
          adGroupsData = data;
        } else if (data.data && Array.isArray(data.data)) {
          adGroupsData = data.data;
        } else {
          console.warn('Received data in unexpected format, using mock data');
          adGroupsData = mockAdGroups;
        }
        
        // Check each ad group for missing metrics and add defaults if needed
        const enhancedAdGroups = adGroupsData.map((group: Partial<AdGroup>) => ({
          ...group,
          status: group.status || 'ENABLE',
          impressions: group.impressions || '0',
          cost_per_conversion: group.cost_per_conversion || '0.00',
          cpm: group.cpm || '0.00',
          cpc: group.cpc || '0.00',
          spend: group.spend || '0.00',
          conversion: group.conversion || '0'
        }));
        
        // Filter to only keep ENABLE status ad groups
        const enabledAdGroups = enhancedAdGroups.filter((group: Partial<AdGroup>) => group.status === 'ENABLE');
        console.log('Enhanced ad groups with defaults:', enabledAdGroups);
        setAdGroups(enabledAdGroups);
      }
    } catch (error) {
      console.error('Error fetching ad groups:', error);
      console.log('Using mock data due to error');
      setAdGroups(mockAdGroups);
    } finally {
      setLoading(false);
    }
  };

  // Fetch real-time metrics
  const fetchRealTimeMetrics = async () => {
    setMetricsLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      console.log(`Fetching metrics for date range: ${today} to ${today}`);
      
      const response = await fetch('/api/advertiser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          advertiser_id: ADVERTISER_ID,
          start_date: today,
          end_date: today
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Metrics response:', result);
      
      // Update adGroups with metrics data, keeping only ENABLE status
      if (result.data && Array.isArray(result.data)) {
        const newAdGroups = [...adGroups];
        result.data.forEach((metric: Partial<AdGroup>) => {
          const adGroupIndex: number = newAdGroups.findIndex(ag => ag.adgroup_id === metric.adgroup_id);
          if (adGroupIndex !== -1) {
            newAdGroups[adGroupIndex] = { ...newAdGroups[adGroupIndex], ...metric };
          } else if (metric.status === 'ENABLE') {
            // Only add new ad groups if they have ENABLE status
            newAdGroups.push(metric as AdGroup);
          }
        });
        setAdGroups(newAdGroups);
        console.log('Updated ad groups with metrics:', newAdGroups);
      }
      alert('Real-time metrics updated successfully');
    } catch (error) {
      console.error('Error fetching metrics:', error);
      alert('Failed to fetch real-time metrics');
    } finally {
      setMetricsLoading(false);
    }
  };

  // Send notification
  const sendNotification = async () => {
    setNotificationLoading(true);
    try {
      const response = await fetch('/api/advertiser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          advertiser_id: ADVERTISER_ID
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      await response.json();
      alert('Notification process triggered successfully');
    } catch (error) {
      console.error('Error sending notification:', error);
      alert('Failed to trigger notification process');
    } finally {
      setNotificationLoading(false);
    }
  };

  // Safely filter ad groups based on search term
  const filteredAdGroups = Array.isArray(adGroups) 
    ? adGroups
        .filter(group => group.status === 'ENABLE') // Add this explicit filter to ensure only ENABLE status
        .filter(group =>
          (group.name && String(group.name).toLowerCase().includes(searchTerm.toLowerCase())) ||
          (group.adgroup_id && String(group.adgroup_id).toLowerCase().includes(searchTerm.toLowerCase()))
        )
    : [];

  // Ensure the rendering works correctly
  console.log('Current adGroups state:', adGroups);
  console.log('Filtered adGroups:', filteredAdGroups);

  // Card rendering function for ad groups
  const renderAdGroupCard = (group: Partial<AdGroup>) => {
    console.log('Rendering card for group:', group);
    
    // Helper function to safely format numeric values
    interface NumberFormatter {
      (value: string | number | undefined | null, decimals?: number): string;
    }

    const formatNumber: NumberFormatter = (value, decimals = 2) => {
      if (!value) return '0.00';
      const number = parseFloat(String(value).replace(/[^0-9.-]+/g, ''));
      return isNaN(number) ? '0.00' : number.toFixed(decimals);
    };
    
    return (
      <div key={group.adgroup_id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Ad Group {group.adgroup_id}</h2>
          <p className="text-sm text-gray-500 mb-2">Status: <span className="font-medium text-gray-700">{group.status}</span></p>

          <div className="space-y-2 text-sm text-gray-600">
            {/* Always display all metrics with fallbacks for missing values */}
            <div className="flex items-center">
              <span className="w-32 font-medium">Impressions:</span>
              <span>{Number(group.impressions || 0).toLocaleString()}</span>
            </div>
            <div className="flex items-center">
              <span className="w-32 font-medium">Cost per Conversion:</span>
              <span className={`${parseFloat(formatNumber(group.cost_per_conversion)) > 10 ? 'text-red-600 font-bold' : 'text-green-600'}`}>
                ${formatNumber(group.cost_per_conversion)}
              </span>
            </div>
            <div className="flex items-center">
              <span className="w-32 font-medium">CPM:</span>
              <span>${formatNumber(group.cpm)}</span>
            </div>
            <div className="flex items-center">
              <span className="w-32 font-medium">CPC:</span>
              <span className={`${parseFloat(formatNumber(group.cpc)) > 2 ? 'text-red-600' : 'text-green-600'}`}>
                ${formatNumber(group.cpc)}
              </span>
            </div>
            <div className="flex items-center">
              <span className="w-32 font-medium">Total Spend:</span>
              <span>${formatNumber(group.spend)}</span>
            </div>
            <div className="flex items-center">
              <span className="w-32 font-medium">Conversions:</span>
              <span>{Number(group.conversion || 0).toLocaleString()}</span>
            </div>
            {/* Display date range if available */}
            {group.date_range && (
              <div className="flex items-center text-xs text-gray-400 mt-2">
                <span>Data from: {group.date_range}</span>
              </div>
            )}
          </div>

          <div className="mt-4">
            <button
              onClick={() => console.log('Edit ad group:', group.adgroup_id)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Edit
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-purple-900 text-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-extrabold">Advertiser Ad Groups</h1>
          <p className="mt-2 text-lg">Monitor advertise group performance</p>
          <div className="mt-4 flex space-x-4">
            <button
              onClick={fetchRealTimeMetrics}
              disabled={metricsLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              {metricsLoading ? 'Loading...' : 'Refresh Metrics'}
            </button>
            <button
              onClick={sendNotification}
              disabled={notificationLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              {notificationLoading ? 'Sending...' : 'Send Notification'}
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <input
          type="text"
          placeholder="Search by ad group ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-500 shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
        />
      </div>

      {/* Ad Group List */}
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="text-center py-10">
            <p className="text-gray-500">Loading ad groups...</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredAdGroups.length > 0 ? (
              filteredAdGroups.map(renderAdGroupCard)
            ) : (
              <p className="text-center text-gray-500 col-span-full">No ad groups found.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
