"use client";

import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

interface PerformanceMetricsChartProps {
  engagementRate: number;
  medianViews: number;
  contentCategory: string;
}

export default function PerformanceMetricsChart({
  engagementRate,
  medianViews
}: PerformanceMetricsChartProps) {
  const donutChartRef = useRef<HTMLCanvasElement>(null);
  const lineChartRef = useRef<HTMLCanvasElement>(null);
  const donutChartInstance = useRef<Chart | null>(null);
  const lineChartInstance = useRef<Chart | null>(null);

  // Create engagement rate donut chart
  useEffect(() => {
    if (donutChartRef.current) {
      if (donutChartInstance.current) {
        donutChartInstance.current.destroy();
      }

      const ctx = donutChartRef.current.getContext('2d');
      
      if (ctx) {
        donutChartInstance.current = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: ['Engagement Rate', 'Non-Engaged'],
            datasets: [{
              data: [engagementRate, 100 - engagementRate],
              backgroundColor: [
                'rgba(52, 211, 153, 0.8)',
                'rgba(243, 244, 246, 0.5)'
              ],
              borderColor: [
                'rgba(52, 211, 153, 1)',
                'rgba(243, 244, 246, 1)'
              ],
              borderWidth: 1,
              cutout: '75%'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return `${context.label}: ${context.parsed}%`;
                  }
                }
              }
            }
          }
        });
      }
    }

    return () => {
      if (donutChartInstance.current) {
        donutChartInstance.current.destroy();
      }
    };
  }, [engagementRate]);

  // Create views simulation line chart
  useEffect(() => {
    if (lineChartRef.current) {
      if (lineChartInstance.current) {
        lineChartInstance.current.destroy();
      }

      const ctx = lineChartRef.current.getContext('2d');
      
      if (ctx) {
        // Generate simulated view data around median views
        const simulatedData = [];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        
        for (let i = 0; i < months.length; i++) {
          // Random variation between 0.7 and 1.3 times median views
          const randomFactor = 0.7 + Math.random() * 0.6;
          simulatedData.push(Math.round(medianViews * randomFactor));
        }

        lineChartInstance.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels: months,
            datasets: [{
              label: 'Video Views',
              data: simulatedData,
              borderColor: 'rgba(16, 185, 129, 1)',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              borderWidth: 2,
              tension: 0.4,
              fill: true,
              pointBackgroundColor: 'rgba(16, 185, 129, 1)',
              pointBorderColor: '#fff',
              pointBorderWidth: 2,
              pointRadius: 4,
              pointHoverRadius: 6
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false
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
                beginAtZero: false,
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

    return () => {
      if (lineChartInstance.current) {
        lineChartInstance.current.destroy();
      }
    };
  }, [medianViews]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      <div className="relative h-64">
        <canvas ref={donutChartRef} />
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span className="text-3xl font-bold text-green-500">{engagementRate.toFixed(1)}%</span>
          <span className="text-sm text-gray-500">Engagement</span>
        </div>
      </div>
      <div className="h-64">
        <canvas ref={lineChartRef} />
      </div>
    </div>
  );
}
