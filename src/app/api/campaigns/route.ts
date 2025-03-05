import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the brand profile for the current user
    const brandProfile = await prisma.brandProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!brandProfile) {
      return NextResponse.json(
        { error: 'Brand profile not found' },
        { status: 404 }
      );
    }

    const data = await request.json();
    
    // Create the campaign
    const campaign = await prisma.campaign.create({
      data: {
        brandId: brandProfile.id,
        title: data.title,
        description: data.description,
        budget: data.budget,
        requirements: data.requirements,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        status: data.status || 'DRAFT',
        categories: data.categories,
        deliverables: data.deliverables,
        platformIds: data.platformIds,
      },
    });

    return NextResponse.json(campaign);
  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const take = parseInt(searchParams.get('take') || '100');
    const skip = parseInt(searchParams.get('skip') || '0');
    const status = searchParams.get('status');
    const platform = searchParams.get('platform');

    // Get the brand profile for the current user
    const brandProfile = await prisma.brandProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!brandProfile) {
      return NextResponse.json(
        { error: 'Brand profile not found' },
        { status: 404 }
      );
    }

    // Build the query
    const where = {
      brandId: brandProfile.id,
      ...(status && { status }),
      ...(platform && { platformIds: { has: platform } }),
    };

    // Get campaigns
    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        take,
        skip,
        orderBy: { createdAt: 'desc' },
        include: {
          brand: {
            select: {
              companyName: true,
            },
          },
          applications: {
            select: {
              id: true,
            },
          },
        },
      }),
      prisma.campaign.count({ where }),
    ]);

    return NextResponse.json({
      campaigns,
      total,
      hasMore: skip + take < total,
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}
