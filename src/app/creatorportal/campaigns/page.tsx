import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/app/api/auth/[...nextauth]/auth.config';
import { prisma } from '@/lib/prisma';
import { CampaignList } from '@/components/campaigns/CampaignList';
import { redirect } from 'next/navigation';
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

async function getCampaigns(userId: string) {
  // Get the creator's profile
  const creator = await prisma.creatorProfile.findUnique({
    where: { userId },
    select: { id: true }
  });

  if (!creator) {
    return { currentCampaigns: [], availableCampaigns: [] };
  }

  // Get campaigns the creator has applied to
  const currentCampaigns = await prisma.campaign.findMany({
    where: {
      applications: {
        some: {
          creatorId: creator.id
        }
      },
      status: {
        in: ['ACTIVE', 'IN_PROGRESS']
      }
    },
    include: {
      brand: {
        include: {
          user: {
            select: {
              name: true,
              image: true
            }
          }
        }
      }
    }
  });

  // Get available campaigns
  const availableCampaigns = await prisma.campaign.findMany({
    where: {
      status: 'ACTIVE',
      NOT: {
        applications: {
          some: {
            creatorId: creator.id
          }
        }
      }
    },
    include: {
      brand: {
        include: {
          user: {
            select: {
              name: true,
              image: true
            }
          }
        }
      }
    }
  });

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
    startDate: campaign.startDate,
    endDate: campaign.endDate,
    deadline: campaign.endDate.toISOString().split('T')[0], // Convert to YYYY-MM-DD string
    status: campaign.status,
    requirements: JSON.parse(campaign.requirements).list,
    createdAt: campaign.createdAt,
    platformIds: campaign.platformIds,
    categories: campaign.categories,
    deliverables: campaign.deliverables,
    budget: campaign.budget
  });

  return {
    currentCampaigns: currentCampaigns.map(transformCampaign),
    availableCampaigns: availableCampaigns.map(transformCampaign)
  };
}

export default async function Campaigns() {
  const session = await getServerSession(authConfig);
  
  if (!session?.user) {
    redirect('/login');
  }

  const { currentCampaigns, availableCampaigns } = await getCampaigns(session.user.id);

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
