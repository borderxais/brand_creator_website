'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { CampaignList } from '@/components/campaigns/CampaignList';
import { Platform } from '@/types/platform';
import { Category } from '@/types/category';

interface Brand {
  name: string;
  logo: string;
}

interface Campaign {
  id: string;
  brand: Brand;
  title: string;
  description: string;
  platform: Platform[];
  category: Category;
  compensation: string;
  startDate: Date;
  endDate: Date;
  deadline: string;
  status?: string;
  requirements: string[];
  createdAt: Date;
  platformIds: string[];
  categories: string;
  deliverables: string;
  budget: number;
}

export default function Campaigns() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentCampaigns, setCurrentCampaigns] = useState<Campaign[]>([]);
  const [availableCampaigns, setAvailableCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
      return;
    }

    const fetchCampaigns = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check if we're on the right page
        if (session.user.role !== 'CREATOR') {
          router.push('/login');
          return;
        }

        const response = await fetch('/api/creator/campaigns', {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to fetch campaigns');
        }

        const data = await response.json();
        
        // Transform campaigns to match the interface
        const transformCampaign = (campaign: any): Campaign => ({
          id: campaign.id,
          brand: {
            name: campaign.brand.user.name,
            logo: '/images/placeholder.svg'
          },
          title: campaign.title,
          description: campaign.description,
          platform: campaign.platformIds.map((id: string) => ({ id, name: id })),
          category: JSON.parse(campaign.categories)[0],
          compensation: `$${campaign.budget}`,
          startDate: new Date(campaign.startDate),
          endDate: new Date(campaign.endDate),
          deadline: new Date(campaign.endDate).toISOString().split('T')[0],
          status: campaign.status,
          requirements: JSON.parse(campaign.requirements).list,
          createdAt: new Date(campaign.createdAt),
          platformIds: campaign.platformIds,
          categories: campaign.categories,
          deliverables: campaign.deliverables,
          budget: campaign.budget
        });

        setCurrentCampaigns(data.currentCampaigns.map(transformCampaign));
        setAvailableCampaigns(data.availableCampaigns.map(transformCampaign));
      } catch (error) {
        console.error('Error fetching campaigns:', error);
        setError(error instanceof Error ? error.message : 'Failed to load campaigns');
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, [session, status, router]);

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== 'CREATOR') {
    router.push('/login');
    return null;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-sm text-red-600 hover:text-red-800"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Your Campaigns</h1>
      <CampaignList
        currentCampaigns={currentCampaigns}
        availableCampaigns={availableCampaigns}
      />
    </div>
  );
}
