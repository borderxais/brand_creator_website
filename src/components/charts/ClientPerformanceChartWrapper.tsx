"use client";

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const PerformanceMetricsChart = dynamic(
  () => import('@/components/charts/PerformanceMetricsChart'),
  { ssr: false }
);

interface PerformanceChartWrapperProps {
  engagementRate: number;
  medianViews: number;
  contentCategory: string;
}

export default function ClientPerformanceChartWrapper(props: PerformanceChartWrapperProps) {
  return (
    <Suspense fallback={<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      <div className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>
      <div className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>
    </div>}>
      <PerformanceMetricsChart {...props} />
    </Suspense>
  );
}
