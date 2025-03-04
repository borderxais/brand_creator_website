import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/app/api/auth/[...nextauth]/auth.config';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { campaignId } = await request.json();

    if (!campaignId) {
      return new NextResponse('Campaign ID is required', { status: 400 });
    }

    // Get creator profile
    const creator = await prisma.creatorProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true }
    });

    if (!creator) {
      return new NextResponse('Creator profile not found', { status: 404 });
    }

    // Create application
    const application = await prisma.application.create({
      data: {
        campaignId,
        creatorId: creator.id,
        status: 'PENDING'
      }
    });

    return NextResponse.json(application);
  } catch (error) {
    console.error('Error applying for campaign:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
