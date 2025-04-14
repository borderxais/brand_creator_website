"use client";

import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

interface AudienceMetricsChartProps {
  followerCount: number;
  followingCount: number;
  likeCount: number;
  videosCount: number;
}

export default function AudienceMetricsChart({
  followerCount,
  followingCount,
  likeCount,
  videosCount
}: AudienceMetricsChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (chartRef.current) {
      // Destroy previous chart if it exists
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const ctx = chartRef.current.getContext('2d');
      
      if (ctx) {
        // Create new chart
        chartInstance.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: ['Followers', 'Following', 'Likes', 'Videos'],
            datasets: [
              {
                label: 'Audience Statistics',
                data: [followerCount, followingCount, likeCount, videosCount],
                backgroundColor: [
                  'rgba(99, 102, 241, 0.7)',
                  'rgba(139, 92, 246, 0.7)',
                  'rgba(217, 70, 239, 0.7)',
                  'rgba(232, 121, 249, 0.7)'
                ],
                borderColor: [
                  'rgba(99, 102, 241, 1)',
                  'rgba(139, 92, 246, 1)',
                  'rgba(217, 70, 239, 1)',
                  'rgba(232, 121, 249, 1)'
                ],
                borderWidth: 1,
                borderRadius: 6,
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'top',
                display: false,
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    let label = context.dataset.label || '';
                    if (label) {
                      label += ': ';
                    }
                    if (context.parsed.y !== null) {
                      label += new Intl.NumberFormat().format(context.parsed.y);
                    }
                    return label;
                  }
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: function(value) {
                    if (value >= 1000000) {
                      return (value / 1000000).toFixed(1) + 'M';
                    } else if (value >= 1000) {
                      return (value / 1000).toFixed(1) + 'K';
                    }
                    return value;
                  }
                }
              }
            }
          }
        });
      }
    }

    // Cleanup function
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [followerCount, followingCount, likeCount, videosCount]);

  return (
    <div className="w-full h-64 mt-6">
      <canvas ref={chartRef} />
    </div>
  );
}
