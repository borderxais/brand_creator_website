'use client';

import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Mock data
const earningsData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  datasets: [
    {
      label: 'Monthly Earnings',
      data: [2200, 2800, 2500, 3100, 2900, 3250],
      fill: true,
      borderColor: 'rgb(147, 51, 234)', // Purple (600)
      backgroundColor: 'rgba(147, 51, 234, 0.1)',
      tension: 0.4,
    },
    {
      label: 'Engagement Rate',
      data: [3.2, 3.8, 3.5, 4.2, 4.5, 4.8],
      fill: true,
      borderColor: 'rgb(34, 197, 94)', // Green (600)
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      tension: 0.4,
      yAxisID: 'y1',
    }
  ],
};

const options = {
  responsive: true,
  interaction: {
    mode: 'index' as const,
    intersect: false,
  },
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        usePointStyle: true,
        boxWidth: 6,
      }
    },
    title: {
      display: false,
    }
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        font: {
          size: 12
        }
      }
    },
    y: {
      type: 'linear' as const,
      display: true,
      position: 'left' as const,
      title: {
        display: true,
        text: 'Earnings ($)',
      },
      grid: {
        color: 'rgba(0, 0, 0, 0.05)',
      },
    },
    y1: {
      type: 'linear' as const,
      display: true,
      position: 'right' as const,
      title: {
        display: true,
        text: 'Engagement Rate (%)',
      },
      grid: {
        drawOnChartArea: false,
      },
    },
  },
};

export default function AnalyticsCharts() {
  return (
    <div className="w-full h-[300px]">
      <Line data={earningsData} options={options} />
    </div>
  );
}
