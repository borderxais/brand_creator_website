import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { userId, ...profileData } = data;

    // TODO: Validate user session and permissions

    const now = new Date().toISOString();
    await prisma.$executeRaw`
      UPDATE BrandProfile
      SET
        companyName = ${profileData.companyName || null},
        industry = ${profileData.industry || null},
        description = ${profileData.description || null},
        website = ${profileData.website || null},
        location = ${profileData.location || null},
        updatedAt = ${now}
      WHERE userId = ${userId}
    `;

    const updatedProfile = await prisma.$queryRaw`
      SELECT 
        b.*,
        u.name,
        u.email,
        u.image
      FROM BrandProfile b
      JOIN User u ON b.userId = u.id
      WHERE b.userId = ${userId}
    `;

    return NextResponse.json(Array.isArray(updatedProfile) ? updatedProfile[0] : null);
  } catch (error) {
    console.error('Error updating brand profile:', error);
    return NextResponse.json(
      { error: 'Failed to update brand profile' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const brandProfile = await prisma.$queryRaw`
      SELECT 
        b.*,
        u.name,
        u.email,
        u.image
      FROM BrandProfile b
      JOIN User u ON b.userId = u.id
      WHERE b.userId = ${userId}
    `;

    if (!brandProfile || (Array.isArray(brandProfile) && brandProfile.length === 0)) {
      return NextResponse.json(
        { error: 'Brand profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(Array.isArray(brandProfile) ? brandProfile[0] : brandProfile);
  } catch (error) {
    console.error('Error fetching brand profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch brand profile' },
      { status: 500 }
    );
  }
}
