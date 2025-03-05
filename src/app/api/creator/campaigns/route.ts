import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/app/api/auth/[...nextauth]/auth.config';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // Get the authenticated user's session
    const session = await getServerSession(authConfig);
    console.log('Session:', session);

    if (!session?.user?.email) {
      console.log('No session or email');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user and ensure they are a creator
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { 
        creator: true,
        brand: true
      }
    });
    console.log('User:', { id: user?.id, email: user?.email, role: user?.role, hasCreator: !!user?.creator });

    if (!user?.creator || user.role !== 'CREATOR') {
      console.log('Not a creator:', { role: user?.role, hasCreator: !!user?.creator });
      return NextResponse.json({ error: 'Unauthorized - Creator access only' }, { status: 403 });
    }

    // Get campaigns the creator has applied to
    const currentCampaigns = await prisma.campaign.findMany({
      where: {
        applications: {
          some: {
            creatorId: user.creator.id
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
        },
        applications: {
          where: {
            creatorId: user.creator.id
          },
          select: {
            status: true,
            createdAt: true
          }
        }
      }
    });
    console.log('Current campaigns:', currentCampaigns.length);

    // Get available campaigns
    const availableCampaigns = await prisma.campaign.findMany({
      where: {
        status: 'ACTIVE',
        NOT: {
          applications: {
            some: {
              creatorId: user.creator.id
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
    console.log('Available campaigns:', availableCampaigns.length);

    // Transform campaigns to include application status
    const transformedCurrentCampaigns = currentCampaigns.map(campaign => ({
      ...campaign,
      applicationStatus: campaign.applications[0]?.status || 'PENDING',
      appliedAt: campaign.applications[0]?.createdAt
    }));

    return NextResponse.json({
      currentCampaigns: transformedCurrentCampaigns,
      availableCampaigns
    });
  } catch (error) {
    console.error('Error fetching creator campaigns:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
