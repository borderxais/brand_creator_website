"use client";

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const AudienceMetricsChart = dynamic(
  () => import('@/components/charts/AudienceMetricsChart'),
  { ssr: false }
);

interface AudienceChartWrapperProps {
  followerCount: number;
  followingCount: number;
  likeCount: number;
  videosCount: number;
}

export default function ClientAudienceChartWrapper(props: AudienceChartWrapperProps) {
  return (
    <Suspense fallback={<div className="w-full h-64 bg-gray-100 animate-pulse rounded-lg"></div>}>
      <AudienceMetricsChart {...props} />
    </Suspense>
  );
}
