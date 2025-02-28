'use client';

import { useState } from 'react';
import { DollarSign, TrendingUp, CreditCard, Download, Calendar, Filter } from 'lucide-react';

const mockEarnings = {
  overview: {
    totalEarnings: '$12,450',
    pendingPayments: '$2,800',
    averagePerPost: '$485',
    monthlyGrowth: '+15%'
  },
  transactions: [
    {
      id: 1,
      brand: 'StyleCo',
      campaign: 'Spring Collection Launch',
      date: '2024-01-28',
      amount: '$800',
      status: 'Paid',
      platform: 'Instagram',
      content: '1 Post, 2 Stories'
    },
    {
      id: 2,
      brand: 'BeautyBrand',
      campaign: 'Skincare Routine',
      date: '2024-01-25',
      amount: '$1,200',
      status: 'Pending',
      platform: 'Instagram, TikTok',
      content: '1 Reel, 1 TikTok'
    },
    {
      id: 3,
      brand: 'FitLife',
      campaign: 'Workout Challenge',
      date: '2024-01-20',
      amount: '$2,000',
      status: 'Paid',
      platform: 'All Platforms',
      content: '7 Posts, Stories'
    }
  ]
};

const monthlyEarnings = [
  { month: 'Jan', amount: 12450 },
  { month: 'Dec', amount: 10800 },
  { month: 'Nov', amount: 9500 },
  { month: 'Oct', amount: 8200 },
  { month: 'Sep', amount: 7800 },
  { month: 'Aug', amount: 7200 }
];

export default function CreatorEarnings() {
  const [timeFilter, setTimeFilter] = useState('6months');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredTransactions = mockEarnings.transactions.filter(transaction => {
    if (statusFilter === 'all') return true;
    return transaction.status.toLowerCase() === statusFilter.toLowerCase();
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900">Earnings</h1>
          <p className="mt-2 text-sm text-gray-600">
            Track your earnings and payment history
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Earnings</p>
              <p className="text-2xl font-semibold text-gray-900">{mockEarnings.overview.totalEarnings}</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100">
              <CreditCard className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending Payments</p>
              <p className="text-2xl font-semibold text-gray-900">{mockEarnings.overview.pendingPayments}</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Average Per Post</p>
              <p className="text-2xl font-semibold text-gray-900">{mockEarnings.overview.averagePerPost}</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Monthly Growth</p>
              <p className="text-2xl font-semibold text-gray-900">{mockEarnings.overview.monthlyGrowth}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Earnings Chart */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Earnings History</h2>
          <select
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
          >
            <option value="6months">Last 6 Months</option>
            <option value="year">Last Year</option>
            <option value="all">All Time</option>
          </select>
        </div>
        <div className="h-64">
          <div className="flex h-full items-end space-x-6">
            {monthlyEarnings.map((month) => (
              <div key={month.month} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-blue-100 rounded-t"
                  style={{ height: `${(month.amount / 15000) * 100}%` }}
                >
                  <div className="w-full bg-blue-500 opacity-75 h-full rounded-t"></div>
                </div>
                <div className="mt-2 text-sm text-gray-600">{month.month}</div>
                <div className="text-xs text-gray-500">${month.amount}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Payment History</h2>
            <div className="flex items-center space-x-4">
              <select
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
              </select>
              <button className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Content</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.brand}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.campaign}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.content}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{transaction.amount}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${
                        transaction.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {transaction.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
