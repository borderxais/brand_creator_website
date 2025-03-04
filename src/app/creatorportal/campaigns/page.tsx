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
  deadline: string;
  status?: string;
  requirements: string[];
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
      },
      applications: {
        where: {
          creatorId: creator.id
        },
        select: {
          status: true
        }
      }
    },
    orderBy: {
      deadline: 'asc'
    }
  });

  // Get available campaigns the creator hasn't applied to
  const availableCampaigns = await prisma.campaign.findMany({
    where: {
      status: 'ACTIVE',
      applications: {
        none: {
          creatorId: creator.id
        }
      },
      deadline: {
        gt: new Date()
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
    },
    orderBy: {
      deadline: 'asc'
    }
  });

  return {
    currentCampaigns: currentCampaigns.map(campaign => ({
      id: campaign.id,
      brand: {
        name: campaign.brand.user.name || 'Unknown Brand',
        logo: campaign.brand.user.image || '/images/placeholder-40.svg'
      },
      title: campaign.title,
      description: campaign.description,
      platform: (campaign.requirements ? JSON.parse(campaign.requirements).platforms || [] : []) as Platform[],
      category: (campaign.requirements ? JSON.parse(campaign.requirements).category || 'OTHER' : 'OTHER') as Category,
      compensation: `$${campaign.budget}`,
      deadline: campaign.deadline.toISOString().split('T')[0],
      status: campaign.applications[0]?.status.toLowerCase(),
      requirements: campaign.requirements ? 
        JSON.parse(campaign.requirements).list || [] : []
    })),
    availableCampaigns: availableCampaigns.map(campaign => ({
      id: campaign.id,
      brand: {
        name: campaign.brand.user.name || 'Unknown Brand',
        logo: campaign.brand.user.image || '/images/placeholder-40.svg'
      },
      title: campaign.title,
      description: campaign.description,
      platform: (campaign.requirements ? JSON.parse(campaign.requirements).platforms || [] : []) as Platform[],
      category: (campaign.requirements ? JSON.parse(campaign.requirements).category || 'OTHER' : 'OTHER') as Category,
      compensation: `$${campaign.budget}`,
      deadline: campaign.deadline.toISOString().split('T')[0],
      requirements: campaign.requirements ? 
        JSON.parse(campaign.requirements).list || [] : []
    }))
  };
}

export default async function Campaigns() {
  const session = await getServerSession(authConfig);
  
  if (!session?.user?.id) {
    redirect('/login');
  }

  const { currentCampaigns, availableCampaigns } = await getCampaigns(session.user.id);

  return (
    <div>
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="page-header mb-6">
          <h1>Campaigns</h1>
          <p>Manage your brand collaborations and discover new opportunities</p>
        </div>
        
        <CampaignList 
          currentCampaigns={currentCampaigns}
          availableCampaigns={availableCampaigns}
        />
      </div>
    </div>
  );
}
