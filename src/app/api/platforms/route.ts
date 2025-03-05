import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const platforms = await prisma.platform.findMany({
      select: {
        id: true,
        name: true,
        displayName: true,
      },
    });

    return NextResponse.json(platforms);
  } catch (error) {
    console.error('Error fetching platforms:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
