import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/app/api/auth/[...nextauth]/auth.config';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user and ensure they are a creator
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { creator: true }
    });

    if (!user?.creator || user.role !== 'CREATOR') {
      return NextResponse.json({ error: 'Unauthorized - Creator access only' }, { status: 403 });
    }

    const { campaignId } = await request.json();

    // Check if campaign exists
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId }
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Check if creator has already applied
    const existingApplication = await prisma.application.findFirst({
      where: {
        campaignId,
        creatorId: user.creator.id
      }
    });

    if (existingApplication) {
      return NextResponse.json({ error: 'Already applied to this campaign' }, { status: 400 });
    }

    // Create application
    const application = await prisma.application.create({
      data: {
        campaignId,
        creatorId: user.creator.id,
        status: 'PENDING'
      }
    });

    return NextResponse.json(application);
  } catch (error) {
    console.error('Error applying to campaign:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
