import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query') || '';
    const status = searchParams.get('status'); // legacy, mapped to is_open below
    const category = searchParams.get('category');
    const platform = searchParams.get('platform');

    // Build a where clause that matches the current Prisma schema (no description/status fields)
    const campaigns = await prisma.campaigns.findMany({
      where: {
        ...(query && {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { brief: { contains: query, mode: 'insensitive' } },
            { requirements: { contains: query, mode: 'insensitive' } },
          ],
        }),
        ...(platform && { platform }),
        ...(category && { industry_category: category }),
        ...(status === 'open' ? { is_open: true } : {}),
        ...(status === 'closed' ? { is_open: false } : {}),
      },
      include: {
        BrandProfile: {
          select: {
            id: true,
            companyName: true,
            industry: true,
            description: true,
            website: true,
          },
        },
      },
    });

    // Normalize brand info for the client
    const transformedCampaigns = campaigns.map(campaign => {
      const brand = campaign.BrandProfile;
      return {
        ...campaign,
        brand: brand
          ? {
              id: brand.id,
              companyName: brand.companyName,
              industry: brand.industry,
              description: brand.description,
              website: brand.website,
            }
          : null,
      };
    });

    return NextResponse.json(transformedCampaigns);
  } catch (error) {
    console.error('Campaign search error:', error);
    return NextResponse.json({ error: 'Failed to search campaigns' }, { status: 500 });
  }
}
