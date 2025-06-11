'use client';

import { useState } from 'react';
import { DollarSign, ArrowRight, Wallet, ArrowDown, TrendingUp, TrendingDown } from 'lucide-react';
import Link from 'next/link';
import { IncomePieChart, IncomeLineChart } from '@/components/charts/IncomeCharts';

// Define income type ID union
type IncomeTypeID = 'total' | 'business' | 'douyin' | 'live' | 'xingtu';
type IncomePeriod = 'yesterday' | 'week' | 'month';

// Define income data structure
interface IncomePeriodData {
  total: number;
  business: number;
  douyin: number;
  live: number;
  xingtu: number;
  [key: string]: number; // Add this line to make the type compatible
}

// Define income data type
interface IncomeDataType {
  yesterday: IncomePeriodData;
  week: IncomePeriodData;
  month: IncomePeriodData;
}

// Mock data for current and previous periods - set to 0 for new users
const incomeData: IncomeDataType = {
  yesterday: {
    total: 0,
    business: 0,
    douyin: 0,
    live: 0,
    xingtu: 0
  },
  week: {
    total: 0,
    business: 0,
    douyin: 0,
    live: 0,
    xingtu: 0
  },
  month: {
    total: 0,
    business: 0,
    douyin: 0,
    live: 0,
    xingtu: 0
  }
};

// Previous period data for comparison - set to 0 for new users
const previousData: IncomeDataType = {
  yesterday: {
    total: 0,
    business: 0,
    douyin: 0,
    live: 0,
    xingtu: 0
  },
  week: {
    total: 0,
    business: 0,
    douyin: 0,
    live: 0,
    xingtu: 0
  },
  month: {
    total: 0,
    business: 0,
    douyin: 0,
    live: 0,
    xingtu: 0
  }
};

// Sample daily income data for the current month - set to 0 for new users
const dailyIncomeData = Array(30).fill(0).map((_, index) => ({
  day: index + 1,
  income: 0
}));

// Calculate percentage change
const getPercentChange = (current: number, previous: number) => {
  if (previous === 0 && current === 0) return 0;
  if (previous === 0) return 100;
  return Math.round(((current - previous) / previous) * 100);
};

// Define a union type for valid colors
type IncomeColor = 'blue' | 'purple' | 'red' | 'green' | 'yellow';

// Income type definitions
const incomeTypes: Array<{ id: IncomeTypeID; label: string; color: IncomeColor }> = [
  { id: 'total', label: 'Total', color: 'blue' },
  { id: 'business', label: 'Business', color: 'purple' },
  { id: 'douyin', label: 'Douyin', color: 'red' },
  { id: 'live', label: 'Live', color: 'green' },
  { id: 'xingtu', label: 'Xingtu', color: 'yellow' }
];

// Time period definitions
const timePeriods: Array<{ id: IncomePeriod; label: string; previous: string }> = [
  { id: 'yesterday', label: 'Yesterday', previous: 'day before' },
  { id: 'week', label: 'Last 7 Days', previous: 'previous week' },
  { id: 'month', label: 'Last Month', previous: 'previous month' }
];

export default function IncomePage() {
  const [activeTimeFilter, setActiveTimeFilter] = useState<IncomePeriod>('week');
  const [selectedIncomeType, setSelectedIncomeType] = useState<IncomeTypeID>('total');
  
  const getIncomeTypeColor = (typeId: IncomeTypeID): IncomeColor => {
    const type = incomeTypes.find(t => t.id === typeId);
    return type ? type.color : 'blue';
  };
  
  const colorMap: Record<IncomeColor, string> = {
    'blue': 'bg-blue-500',
    'purple': 'bg-purple-500',
    'red': 'bg-red-500',
    'green': 'bg-green-500',
    'yellow': 'bg-yellow-500'
  };

  const pieChartColors = incomeTypes
    .filter(type => type.id !== 'total')
    .map(type => {
      const colorClass = colorMap[type.color];
      const rgbValues: Record<string, string> = {
        'bg-blue-500': 'rgba(59, 130, 246, 0.8)',
        'bg-purple-500': 'rgba(139, 92, 246, 0.8)',
        'bg-red-500': 'rgba(239, 68, 68, 0.8)',
        'bg-green-500': 'rgba(34, 197, 94, 0.8)',
        'bg-yellow-500': 'rgba(234, 179, 8, 0.8)'
      };
      return rgbValues[colorClass] || 'rgba(59, 130, 246, 0.8)';
    });
  
  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900">Income</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage your earnings and withdrawal options
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <h2 className="ml-3 text-xl font-semibold text-gray-900">My Income</h2>
            </div>
            <Link href="/creatorportal/income/history" className="text-blue-600 flex items-center text-sm">
              View History
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Balance</p>
              <p className="text-3xl font-bold text-gray-900">${incomeData[activeTimeFilter].total.toLocaleString()}</p>
            </div>
            <div className="text-gray-500 bg-gray-50 px-3 py-1 rounded-full text-sm">
              {getPercentChange(incomeData[activeTimeFilter].total, previousData[activeTimeFilter].total) === 0 
                ? 'No previous data' 
                : `${getPercentChange(incomeData[activeTimeFilter].total, previousData[activeTimeFilter].total) >= 0 ? '+' : ''}${getPercentChange(incomeData[activeTimeFilter].total, previousData[activeTimeFilter].total)}% from last period`
              }
            </div>
          </div>
          
          <div className="mt-4">
            <p className="text-sm text-gray-500">Start earning by applying to campaigns and completing collaborations</p>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <Wallet className="h-6 w-6 text-green-600" />
              </div>
              <h2 className="ml-3 text-xl font-semibold text-gray-900">Cash</h2>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Available to Withdraw</p>
              <p className="text-3xl font-bold text-gray-900">$0</p>
            </div>
            <button className="bg-gray-400 text-white px-4 py-2 rounded-md flex items-center cursor-not-allowed" disabled>
              <ArrowDown className="mr-2 h-4 w-4" />
              Withdraw
            </button>
          </div>
          
          <div className="mt-4">
            <p className="text-sm text-gray-500">Complete campaigns to start earning and enable withdrawals</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Income Analysis</h2>
        
        <div className="grid grid-cols-5 gap-4 mb-8">
          {incomeTypes.map(type => (
            <div
              key={type.id}
              className={`p-4 text-center rounded-lg cursor-pointer transition-all ${
                selectedIncomeType === type.id 
                  ? `bg-${type.color}-100 border border-${type.color}-300 shadow-sm` 
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
              onClick={() => setSelectedIncomeType(type.id)}
            >
              <h3 className={`font-medium ${selectedIncomeType === type.id ? `text-${type.color}-700` : 'text-gray-700'}`}>
                {type.label}
              </h3>
              <p className="text-2xl font-bold mt-2">
                ${incomeData[activeTimeFilter][type.id].toLocaleString()}
              </p>
              <div className={`text-xs mt-1 ${
                getPercentChange(incomeData[activeTimeFilter][type.id], previousData[activeTimeFilter][type.id]) === 0
                  ? 'text-gray-500'
                  : getPercentChange(incomeData[activeTimeFilter][type.id], previousData[activeTimeFilter][type.id]) >= 0 
                    ? 'text-green-600' 
                    : 'text-red-600'
              }`}>
                {getPercentChange(incomeData[activeTimeFilter][type.id], previousData[activeTimeFilter][type.id]) === 0 
                  ? 'No data' 
                  : `${getPercentChange(incomeData[activeTimeFilter][type.id], previousData[activeTimeFilter][type.id]) >= 0 ? '+' : ''}${getPercentChange(incomeData[activeTimeFilter][type.id], previousData[activeTimeFilter][type.id])}%`
                }
              </div>
            </div>
          ))}
        </div>
        
        <div className="space-y-6 mt-8">
          <h3 className="font-medium text-gray-800 mb-4">
            {incomeTypes.find(t => t.id === selectedIncomeType)?.label} Income by Time Period
          </h3>
          
          <div className="space-y-4">
            {timePeriods.map(period => {
              const isActive = activeTimeFilter === period.id;
              const currentValue = incomeData[period.id as keyof IncomeDataType][selectedIncomeType];
              const previousValue = previousData[period.id as keyof IncomeDataType][selectedIncomeType];
              const percentChange = getPercentChange(currentValue, previousValue);
              const isIncrease = currentValue >= previousValue;
              const selectedColor = getIncomeTypeColor(selectedIncomeType);
              
              return (
                <div 
                  key={period.id} 
                  className={`p-4 rounded-lg ${isActive ? `bg-${selectedColor}-50 border border-${selectedColor}-100` : 'bg-gray-50 hover:bg-gray-100'} cursor-pointer`}
                  onClick={() => setActiveTimeFilter(period.id as 'yesterday' | 'week' | 'month')}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-800">{period.label}</h4>
                    <div className="text-xl font-semibold">${currentValue.toLocaleString()}</div>
                  </div>
                  
                  <div className="flex items-center mt-3">
                    <div className={`text-sm ${
                      percentChange === 0 
                        ? 'text-gray-500' 
                        : isIncrease ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {percentChange === 0 
                        ? 'No previous data' 
                        : `${isIncrease ? '+' : ''}${percentChange}% vs ${period.previous}`
                      }
                    </div>
                    <div className="flex-1 mx-4">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${percentChange === 0 ? 'bg-gray-300' : isIncrease ? 'bg-green-500' : 'bg-red-500'}`}
                          style={{ width: `${percentChange === 0 ? 0 : Math.min(Math.abs(percentChange), 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    {percentChange === 0 ? 
                      <div className="h-5 w-5" /> : 
                      isIncrease ? 
                        <TrendingUp className="h-5 w-5 text-green-600" /> : 
                        <TrendingDown className="h-5 w-5 text-red-600" />
                    }
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Income Breakdown</h2>
          <select 
            className="border border-gray-300 rounded-md p-2 text-sm"
            value={activeTimeFilter}
            onChange={(e) => setActiveTimeFilter(e.target.value as 'yesterday' | 'week' | 'month')}
          >
            <option value="yesterday">Yesterday</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last Month</option>
          </select>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-4">Income Distribution</h3>
            <IncomePieChart 
              // Filter out the 'total' property as it's not part of the distribution
              incomeData={Object.fromEntries(
                Object.entries(incomeData[activeTimeFilter])
                  .filter(([key]) => key !== 'total')
              )}
              labels={incomeTypes.filter(type => type.id !== 'total').map(type => type.label)}
              colors={pieChartColors}
            />
            <div className="mt-4 text-sm text-gray-500 text-center">
              Percentage breakdown of income sources
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-4">Daily Income Trend (This Month)</h3>
            <IncomeLineChart monthlyData={dailyIncomeData} />
            <div className="mt-4 text-sm text-gray-500 text-center">
              Daily income variations during the current month
            </div>
          </div>
        </div>
        
        <div className="mt-8 border-t pt-4">
          <h3 className="text-sm font-medium mb-3">Income Summary for {timePeriods.find(p => p.id === activeTimeFilter)?.label}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500">Current Period</div>
              <div className="text-xl font-bold">${incomeData[activeTimeFilter].total.toLocaleString()}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500">Previous Period</div>
              <div className="text-xl font-bold">${previousData[activeTimeFilter].total.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
