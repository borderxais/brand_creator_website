"use client";

import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

interface IncomePieChartProps {
  incomeData: {
    [key: string]: number;
  };
  labels: string[];
  colors: string[];
}

export function IncomePieChart({ incomeData, labels, colors }: IncomePieChartProps) {
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
        // Extract values while excluding the 'total'
        const values = labels.filter(label => label.toLowerCase() !== 'total')
                             .map(label => incomeData[label.toLowerCase()]);
        
        // Create new chart
        chartInstance.current = new Chart(ctx, {
          type: 'pie',
          data: {
            labels: labels.filter(label => label.toLowerCase() !== 'total'),
            datasets: [
              {
                data: values,
                backgroundColor: colors.filter((_, i) => labels[i].toLowerCase() !== 'total'),
                borderColor: 'white',
                borderWidth: 2,
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'right',
                labels: {
                  boxWidth: 15,
                  padding: 15,
                  font: {
                    size: 12
                  }
                }
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    const total = values.reduce((sum, val) => sum + val, 0);
                    const value = context.raw as number;
                    const percentage = ((value / total) * 100).toFixed(1);
                    return `${context.label}: $${value.toLocaleString()} (${percentage}%)`;
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
  }, [incomeData, labels, colors]);

  return (
    <div className="w-full h-64">
      <canvas ref={chartRef} />
    </div>
  );
}

interface IncomeLineChartProps {
  monthlyData: {
    day: number;
    income: number;
  }[];
}

export function IncomeLineChart({ monthlyData }: IncomeLineChartProps) {
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
          type: 'line',
          data: {
            labels: monthlyData.map(item => `Day ${item.day}`),
            datasets: [
              {
                label: 'Daily Income',
                data: monthlyData.map(item => item.income),
                borderColor: 'rgba(59, 130, 246, 1)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: 'rgba(59, 130, 246, 1)',
                pointBorderColor: 'white',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
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
                      label += '$' + new Intl.NumberFormat().format(context.parsed.y);
                    }
                    return label;
                  }
                }
              }
            },
            scales: {
              x: {
                grid: {
                  display: false,
                },
                ticks: {
                  maxRotation: 0,
                  autoSkip: true,
                  maxTicksLimit: 10
                }
              },
              y: {
                beginAtZero: true,
                ticks: {
                  callback: function(value) {
                    const numValue = typeof value === 'string' ? parseFloat(value) : value;
                    if (numValue >= 1000) {
                      return '$' + (numValue / 1000).toFixed(1) + 'K';
                    }
                    return '$' + value;
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
  }, [monthlyData]);

  return (
    <div className="w-full h-64">
      <canvas ref={chartRef} />
    </div>
  );
}
