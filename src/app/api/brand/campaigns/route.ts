import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/app/api/auth/[...nextauth]/auth.config';
import { prisma } from '@/lib/prisma';

// Define the Python API URL
const PYTHON_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

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

    // Extract any query parameters from the request
    const { searchParams } = new URL(request.url);
    const isOpen = searchParams.get('is_open'); // Changed from status to is_open
    const search = searchParams.get('search');
    const startDate = searchParams.get('start_date'); // Using snake_case
    const endDate = searchParams.get('end_date'); // Using snake_case

    // Build the Python API URL with query parameters
    let pythonApiUrl = `${PYTHON_API_URL}/brand-campaigns/${user.brand.id}`;
    const queryParams = new URLSearchParams();
    
    if (isOpen) queryParams.append('is_open', isOpen); // Changed from status to is_open
    if (search) queryParams.append('search', search);
    if (startDate) queryParams.append('start_date', startDate);
    if (endDate) queryParams.append('end_date', endDate);
    
    if (queryParams.toString()) {
      pythonApiUrl += `?${queryParams.toString()}`;
    }
    
    console.log('Fetching from Python API:', pythonApiUrl);
    
    const response = await fetch(pythonApiUrl, {
      headers: {
        'Content-Type': 'application/json',
      },
      // Set a reasonable timeout
      signal: AbortSignal.timeout(5000)  // 5 second timeout
    });
    
    if (!response.ok) {
      console.error(`Python API returned status ${response.status}`);
      // Instead of falling back to Prisma, return an error or empty data
      return NextResponse.json(
        { 
          error: `API Error: ${response.status}`,
          campaigns: [] 
        }, 
        { status: response.status === 500 ? 200 : response.status }
      );
    }
    
    const campaigns = await response.json();
    console.log('Python API campaigns:', Array.isArray(campaigns) ? campaigns.length : 'not an array');
    
    // Return the campaigns
    return NextResponse.json(campaigns);
  } catch (error) {
    console.error('Error fetching brand campaigns:', error);
    // Return empty array with error message instead of 500 status
    return NextResponse.json({ 
      error: 'Failed to fetch campaigns',
      campaigns: [] 
    }, { status: 200 });
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

    // Forward the request to the Python API - Updated URL to match the correct pattern
    const pythonApiUrl = `${PYTHON_API_URL}/brand-campaigns/${user.brand.id}/add_campaign`;
    
    console.log('Creating campaign via Python API:', pythonApiUrl);
    
    const response = await fetch(pythonApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...data,
        brand_id: user.brand.id
      }),
    });

    if (!response.ok) {
      console.error(`Python API returned status ${response.status} for POST`);
      return NextResponse.json({ error: 'Failed to create campaign' }, { status: response.status });
    }

    const campaign = await response.json();
    return NextResponse.json(campaign);
  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
