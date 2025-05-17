import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/app/api/auth/[...nextauth]/auth.config';
import { prisma } from '@/lib/prisma';

// Define the Python API URL
const PYTHON_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function GET(request: Request, context: any) {
  try {
    // Get the authenticated user's session
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

    // Extract the campaign ID directly from URL as a fallback approach
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const campaignId = pathSegments[pathSegments.length - 1];
    
    console.log('Campaign ID from URL path:', campaignId);
    
    // Fetch the campaign details from Python API
    const pythonApiUrl = `${PYTHON_API_URL}/brand-campaigns/${user.brand.id}/campaign/${campaignId}`;
    
    console.log('Fetching campaign details from Python API:', pythonApiUrl);
    
    const response = await fetch(pythonApiUrl, {
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(5000)
    });
    
    if (!response.ok) {
      console.error(`Python API returned status ${response.status}`);
      return NextResponse.json({ error: 'Failed to fetch campaign details' }, { status: 500 });
    }
    
    const campaign = await response.json();
    return NextResponse.json(campaign);
  } catch (error) {
    console.error('Error fetching campaign details:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
