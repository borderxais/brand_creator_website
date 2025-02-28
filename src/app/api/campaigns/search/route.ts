import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query') || '';
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const platform = searchParams.get('platform');

    const campaigns = await prisma.campaign.findMany({
      where: {
        OR: [
          { title: { contains: query } },
          { description: { contains: query } },
        ],
        ...(status && { status }),
        ...(category && { category }),
        ...(platform && { platform }),
      },
      include: {
        brand: {
          select: {
            id: true,
            userId: true,
            companyName: true,
            user: {
              select: {
                image: true
              }
            }
          },
        },
      },
    });

    // Transform the response to include the user's image
    const transformedCampaigns = campaigns.map(campaign => ({
      ...campaign,
      brand: {
        ...campaign.brand,
        image: campaign.brand.user.image,
        name: campaign.brand.companyName
      }
    }));

    return NextResponse.json(transformedCampaigns);
  } catch (error) {
    console.error('Campaign search error:', error);
    return NextResponse.json({ error: 'Failed to search campaigns' }, { status: 500 });
  }
}
