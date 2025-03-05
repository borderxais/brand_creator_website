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

    // Get the user and ensure they are a brand
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { brand: true }
    });
    console.log('User:', { id: user?.id, email: user?.email, role: user?.role, hasBrand: !!user?.brand });

    if (!user?.brand || user.role !== 'BRAND') {
      console.log('Not a brand:', { role: user?.role, hasBrand: !!user?.brand });
      return NextResponse.json({ error: 'Unauthorized - Brand access only' }, { status: 403 });
    }

    // Fetch campaigns for this brand
    const campaigns = await prisma.campaign.findMany({
      where: {
        brandId: user.brand.id
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
          include: {
            creator: {
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
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    console.log('Brand campaigns:', campaigns.length);

    return NextResponse.json(campaigns);
  } catch (error) {
    console.error('Error fetching brand campaigns:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user and ensure they are a brand
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { brand: true }
    });

    if (!user?.brand || user.role !== 'BRAND') {
      return NextResponse.json({ error: 'Unauthorized - Brand access only' }, { status: 403 });
    }

    const data = await request.json();

    // Create campaign
    const campaign = await prisma.campaign.create({
      data: {
        ...data,
        brandId: user.brand.id,
        status: 'ACTIVE'
      }
    });

    return NextResponse.json(campaign);
  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
